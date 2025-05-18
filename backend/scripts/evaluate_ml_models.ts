import * as tf from '@tensorflow/tfjs-node';
import { bertErrorAnalyzer } from '../src/services/bertErrorAnalyzerService';
import { advancedErrorPredictor } from '../src/services/advancedErrorPredictorService';
import { errorClusteringService } from '../src/services/errorClusteringService';
import prisma from '../src/models/prisma';
import { parseStackTrace } from '../src/utils/stackTraceParser';
import { ErrorDataItem as OriginalErrorDataItem } from '../src/utils/datasetGenerator';

/**
 * Script untuk mengevaluasi performa model machine learning
 * untuk sistem Root Cause Analysis (RCA)
 */

// Interface untuk item data error yang sesuai dengan struktur database
// dan memenuhi kebutuhan ErrorDataItem di datasetGenerator
interface ErrorDataItem extends OriginalErrorDataItem {
  // Interface sudah sesuai dengan definisi di datasetGenerator
}

interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  latency: number; // ms
}

interface ClusteringMetrics {
  silhouetteScore: number;
  inertia: number;
  clusterCount: number;
  avgPointsPerCluster: number;
}

/**
 * Menghitung silhouette score
 * Mengukur seberapa baik sebuah data point cocok dengan cluster-nya
 * dibandingkan dengan cluster lainnya
 */
async function calculateSilhouetteScore(
  data: number[][],
  labels: number[]
): Promise<number> {
  const uniqueLabels = Array.from(new Set(labels));
  const n = data.length;
  
  let totalScore = 0;
  
  for (let i = 0; i < n; i++) {
    // a(i) = rata-rata jarak ke semua point di cluster yang sama
    let sameClusterDistances: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i !== j && labels[i] === labels[j]) {
        sameClusterDistances.push(euclideanDistance(data[i], data[j]));
      }
    }
    
    const a = sameClusterDistances.length > 0 
      ? sameClusterDistances.reduce((sum, val) => sum + val, 0) / sameClusterDistances.length 
      : 0;
    
    // b(i) = rata-rata jarak ke semua point di cluster terdekat
    const otherClusterAvgs = new Map<number, number[]>();
    for (let j = 0; j < n; j++) {
      if (labels[i] !== labels[j]) {
        const cluster = labels[j];
        const dist = euclideanDistance(data[i], data[j]);
        
        if (!otherClusterAvgs.has(cluster)) {
          otherClusterAvgs.set(cluster, []);
        }
        
        otherClusterAvgs.get(cluster)!.push(dist);
      }
    }
    
    let b = Infinity;
    for (const [_, distances] of otherClusterAvgs.entries()) {
      const avgDist = distances.reduce((sum, val) => sum + val, 0) / distances.length;
      b = Math.min(b, avgDist);
    }
    
    // Silhouette coefficient untuk point i
    const s = b === Infinity || (b === 0 && a === 0)
      ? 0
      : (b - a) / Math.max(a, b);
    
    totalScore += s;
  }
  
  return totalScore / n;
}

/**
 * Menghitung jarak Euclidean antar dua vektor
 */
function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }
  
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  
  return Math.sqrt(sum);
}

/**
 * Evaluasi model BERT untuk analisis error
 */
async function evaluateBertModel(testData: ErrorDataItem[]): Promise<EvaluationMetrics> {
  console.log('Evaluating BERT model...');
  const startTime = Date.now();
  
  // Memastikan model sudah dimuat
  await bertErrorAnalyzer.loadModel();
  
  let correctPredictions = 0;
  let totalPredictions = 0;
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  
  for (const item of testData) {
    // Mencari penyebab error paling mungkin
    const predictions = await bertErrorAnalyzer.predictCause(item);
    
    if (predictions.length > 0) {
      totalPredictions++;
      const topPrediction = predictions[0].cause;
      
      if (topPrediction === item.probableCause) {
        correctPredictions++;
        truePositives++;
      } else {
        falsePositives++;
        falseNegatives++;
      }
    }
  }
  
  const endTime = Date.now();
  const latency = (endTime - startTime) / testData.length; // Rata-rata latency per prediksi
  
  const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
  const precision = (truePositives + falsePositives) > 0 ? truePositives / (truePositives + falsePositives) : 0;
  const recall = (truePositives + falseNegatives) > 0 ? truePositives / (truePositives + falseNegatives) : 0;
  const f1Score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
  
  return {
    accuracy,
    precision,
    recall,
    f1Score,
    latency
  };
}

/**
 * Evaluasi model ensemble untuk prediksi error
 */
async function evaluateEnsembleModel(testData: ErrorDataItem[]): Promise<EvaluationMetrics> {
  console.log('Evaluating Ensemble model...');
  const startTime = Date.now();
  
  let correctPredictions = 0;
  let totalPredictions = 0;
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  
  for (const item of testData) {
    // Prediksi dengan model ensemble
    const predictions = await advancedErrorPredictor.predict(item);
    
    if (predictions.length > 0) {
      totalPredictions++;
      const topPrediction = predictions[0].cause;
      
      if (topPrediction === item.probableCause) {
        correctPredictions++;
        truePositives++;
      } else {
        falsePositives++;
        falseNegatives++;
      }
    }
  }
  
  const endTime = Date.now();
  const latency = (endTime - startTime) / testData.length;
  
  const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
  const precision = (truePositives + falsePositives) > 0 ? truePositives / (truePositives + falsePositives) : 0;
  const recall = (truePositives + falseNegatives) > 0 ? truePositives / (truePositives + falseNegatives) : 0;
  const f1Score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
  
  return {
    accuracy,
    precision,
    recall,
    f1Score,
    latency
  };
}

/**
 * Evaluasi algoritma clustering
 */
async function evaluateClusteringAlgorithm(testData: ErrorDataItem[]): Promise<ClusteringMetrics> {
  console.log('Evaluating Clustering algorithm...');
  
  // Inisialisasi service clustering
  await errorClusteringService.initialize();
  
  // Proses clustering
  const startTime = Date.now();
  const clusters = await errorClusteringService.performClustering(testData);
  const endTime = Date.now();
  
  // Ekstrak data dan label untuk evaluasi
  const dataPoints: number[][] = [];
  const labels: number[] = [];
  
  for (const item of testData) {
    // Menggunakan method public dari errorClusteringService
    const text = item.message + " " + item.stacktraceText;
    const embedding = await bertErrorAnalyzer.generateEmbedding(text);
    dataPoints.push(embedding);
    
    const clusterResult = await errorClusteringService.clusterNewError(item);
    const clusterId = clusterResult.clusterId;
    const clusterIndex = clusters.findIndex(c => c.id === clusterId);
    labels.push(clusterIndex);
  }
  
  // Hitung silhouette score
  const silhouetteScore = await calculateSilhouetteScore(dataPoints, labels);
  
  // Hitung inertia (jumlah kuadrat jarak ke centroid)
  let inertia = 0;
  for (let i = 0; i < dataPoints.length; i++) {
    const clusterIndex = labels[i];
    const centroid = clusters[clusterIndex].centroid;
    inertia += Math.pow(euclideanDistance(dataPoints[i], centroid), 2);
  }
  
  // Hitung rata-rata points per cluster
  const pointsPerCluster = new Map<number, number>();
  for (const label of labels) {
    pointsPerCluster.set(label, (pointsPerCluster.get(label) || 0) + 1);
  }
  
  const avgPointsPerCluster = Array.from(pointsPerCluster.values()).reduce((sum, val) => sum + val, 0) / pointsPerCluster.size;
  
  return {
    silhouetteScore,
    inertia,
    clusterCount: clusters.length,
    avgPointsPerCluster
  };
}

/**
 * Jalankan evaluasi untuk semua model
 */
async function runEvaluation() {
  try {
    console.log('Starting ML models evaluation...');
    
    // Ambil data testing dari database
    const events = await prisma.event.findMany({
      take: 100, // Batasi jumlah data untuk testing
      where: {
        stacktrace: {
          not: null
        }
      },
      include: {
        rootCauseAnalysis: {
          where: {
            status: 'completed',
            probableCauses: {
              not: '[]'
            }
          }
        }
      }
    });
    
    // Filter events yang memiliki rootCauseAnalysis
    const eventsWithRCA = events.filter(event => 
      event.rootCauseAnalysis && 
      Array.isArray(event.rootCauseAnalysis) && 
      event.rootCauseAnalysis.length > 0
    );
    
    // Transform ke format yang dibutuhkan
    const testData: ErrorDataItem[] = eventsWithRCA.map(event => {
      // Parse probableCauses dari event.rootCauseAnalysis
      let probableCause = 'Unknown';
      try {
        if (event.rootCauseAnalysis && 
            Array.isArray(event.rootCauseAnalysis) && 
            event.rootCauseAnalysis.length > 0 && 
            event.rootCauseAnalysis[0]?.probableCauses) {
          const causes = JSON.parse(String(event.rootCauseAnalysis[0].probableCauses)) as Array<{
            cause: string;
            probability: number;
          }>;
          
          // Ambil cause dengan probability tertinggi
          if (causes.length > 0) {
            const topCause = causes.reduce((prev, current) => 
              (prev.probability > current.probability) ? prev : current
            );
            probableCause = topCause.cause;
          }
        }
      } catch (error) {
        console.error('Error parsing probable causes:', error);
      }
      
      const stackFrames = event.stacktrace ? parseStackTrace(event.stacktrace) : [];
      
      return {
        id: event.id,
        message: event.message || '',
        errorType: event.errorType || '',
        stacktraceText: event.stacktrace || '',
        stacktrace: event.stacktrace || '',
        stackFrames,
        browser: event.browser || '',
        os: event.os || '',
        url: event.url || '',
        userAgent: event.userAgent || '',
        probableCause,
        statusCode: event.statusCode || undefined,
        environment: event.environment || undefined,
        metadata: {}
      };
    });
    
    console.log(`Test data loaded: ${testData.length} items`);
    
    // Evaluasi semua model
    const bertMetrics = await evaluateBertModel(testData);
    const ensembleMetrics = await evaluateEnsembleModel(testData);
    const clusteringMetrics = await evaluateClusteringAlgorithm(testData);
    
    // Tampilkan hasil evaluasi
    console.log('\n=== EVALUATION RESULTS ===\n');
    
    console.log('BERT Model Metrics:');
    console.log(`- Accuracy: ${(bertMetrics.accuracy * 100).toFixed(2)}%`);
    console.log(`- Precision: ${(bertMetrics.precision * 100).toFixed(2)}%`);
    console.log(`- Recall: ${(bertMetrics.recall * 100).toFixed(2)}%`);
    console.log(`- F1 Score: ${(bertMetrics.f1Score * 100).toFixed(2)}%`);
    console.log(`- Avg. Latency: ${bertMetrics.latency.toFixed(2)}ms`);
    
    console.log('\nEnsemble Model Metrics:');
    console.log(`- Accuracy: ${(ensembleMetrics.accuracy * 100).toFixed(2)}%`);
    console.log(`- Precision: ${(ensembleMetrics.precision * 100).toFixed(2)}%`);
    console.log(`- Recall: ${(ensembleMetrics.recall * 100).toFixed(2)}%`);
    console.log(`- F1 Score: ${(ensembleMetrics.f1Score * 100).toFixed(2)}%`);
    console.log(`- Avg. Latency: ${ensembleMetrics.latency.toFixed(2)}ms`);
    
    console.log('\nClustering Algorithm Metrics:');
    console.log(`- Silhouette Score: ${clusteringMetrics.silhouetteScore.toFixed(4)}`);
    console.log(`- Inertia: ${clusteringMetrics.inertia.toFixed(2)}`);
    console.log(`- Cluster Count: ${clusteringMetrics.clusterCount}`);
    console.log(`- Avg. Points per Cluster: ${clusteringMetrics.avgPointsPerCluster.toFixed(2)}`);
    
    // Export hasil ke file
    const resultsJson = JSON.stringify({
      bertMetrics,
      ensembleMetrics,
      clusteringMetrics,
      timestamp: new Date().toISOString()
    }, null, 2);
    
    const fs = require('fs');
    const path = require('path');
    const resultsDir = path.join(__dirname, '../evaluation_results');
    
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(resultsDir, `ml_evaluation_${new Date().toISOString().replace(/[:.]/g, '-')}.json`),
      resultsJson
    );
    
    console.log('\nEvaluation completed successfully. Results saved to file.');
  } catch (error) {
    console.error('Error during evaluation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan evaluasi
runEvaluation()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error during evaluation:', error);
    process.exit(1);
  }); 