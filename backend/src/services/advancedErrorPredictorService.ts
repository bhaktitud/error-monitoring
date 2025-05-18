import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { ErrorDataItem, extractErrorFeatures, featuresToArray, createFeatureMap, createLabelMap, 
  labelToIndex, indexToLabel, generateTrainingDataset } from '../utils/datasetGenerator';
import { bertErrorAnalyzer } from './bertErrorAnalyzerService';
import { ErrorClassifier } from './errorClassifierService';
import KNN from 'ml-knn';

// Path untuk model
const MODEL_DIR = path.join(__dirname, '../../models');
const ENSEMBLE_MODEL_PATH = path.join(MODEL_DIR, 'ensemble_model');
const FEATURE_MAP_PATH = path.join(MODEL_DIR, 'adv_feature_map.json');
const LABEL_MAP_PATH = path.join(MODEL_DIR, 'adv_label_map.json');
const KNN_MODEL_PATH = path.join(MODEL_DIR, 'knn_model.json');

/**
 * Service untuk prediksi error yang lebih akurat menggunakan gabungan beberapa model (ensemble)
 */
export class AdvancedErrorPredictor {
  private featureMap: Map<string, number> = new Map();
  private labelMap: Map<string, number> = new Map();
  private tfModel: tf.Sequential | null = null;
  private knnModel: any = null;
  private bertModel: typeof bertErrorAnalyzer;
  private errorClassifier: ErrorClassifier;
  private isModelLoaded = false;

  constructor(errorClassifier: ErrorClassifier) {
    if (!fs.existsSync(MODEL_DIR)) {
      fs.mkdirSync(MODEL_DIR, { recursive: true });
    }
    this.bertModel = bertErrorAnalyzer;
    this.errorClassifier = errorClassifier;
  }

  /**
   * Cek apakah model sudah dilatih
   */
  async isModelTrained(): Promise<boolean> {
    try {
      return fs.existsSync(ENSEMBLE_MODEL_PATH) && fs.existsSync(KNN_MODEL_PATH);
    } catch (error) {
      console.error('Error checking model existence:', error);
      return false;
    }
  }

  /**
   * Muat model dari disk
   */
  async loadModel(): Promise<boolean> {
    try {
      // Cek apakah model ada
      if (!fs.existsSync(ENSEMBLE_MODEL_PATH) || !fs.existsSync(KNN_MODEL_PATH)) {
        console.log('Model tidak ditemukan, diperlukan training terlebih dahulu');
        return false;
      }

      // Muat TF model
      this.tfModel = await tf.loadLayersModel(`file://${ENSEMBLE_MODEL_PATH}/model.json`) as tf.Sequential;
      
      // Muat feature dan label map
      if (fs.existsSync(FEATURE_MAP_PATH) && fs.existsSync(LABEL_MAP_PATH)) {
        const featureMapData = JSON.parse(fs.readFileSync(FEATURE_MAP_PATH, 'utf-8'));
        this.featureMap = new Map(Object.entries(featureMapData));
        
        const labelMapData = JSON.parse(fs.readFileSync(LABEL_MAP_PATH, 'utf-8'));
        this.labelMap = new Map(Object.entries(labelMapData));
      } else {
        console.log('Feature map dan label map tidak ditemukan');
        return false;
      }
      
      // Muat KNN Model
      if (fs.existsSync(KNN_MODEL_PATH)) {
        const knnData = JSON.parse(fs.readFileSync(KNN_MODEL_PATH, 'utf-8'));
        this.knnModel = KNN.load(knnData);
      } else {
        console.log('KNN model tidak ditemukan');
        return false;
      }
      
      // Muat model BERT
      await this.bertModel.loadModel();
      
      this.isModelLoaded = true;
      return true;
    } catch (error) {
      console.error('Error loading model:', error);
      return false;
    }
  }

  /**
   * Simpan model ke disk
   */
  private async saveModel(): Promise<void> {
    // Simpan TF model
    if (this.tfModel) {
      await this.tfModel.save(`file://${ENSEMBLE_MODEL_PATH}`);
    }
    
    // Simpan feature dan label map
    fs.writeFileSync(FEATURE_MAP_PATH, JSON.stringify(Object.fromEntries(this.featureMap)));
    fs.writeFileSync(LABEL_MAP_PATH, JSON.stringify(Object.fromEntries(this.labelMap)));
    
    // Simpan KNN model
    if (this.knnModel) {
      fs.writeFileSync(KNN_MODEL_PATH, JSON.stringify(this.knnModel.toJSON()));
    }
  }

  /**
   * Latih semua model yang digunakan dalam ensemble
   */
  async trainModel(dataset?: ErrorDataItem[]): Promise<void> {
    try {
      // Jika dataset tidak diberikan, ambil dari database
      if (!dataset) {
        dataset = await generateTrainingDataset();
      }
      
      if (dataset.length < 20) {
        throw new Error('Dataset terlalu kecil untuk melatih model ensemble, minimal dibutuhkan 20 item');
      }
      
      console.log(`Training ensemble model with ${dataset.length} samples`);
      
      // Buat feature map dan label map
      this.featureMap = createFeatureMap(dataset);
      this.labelMap = createLabelMap(dataset);
      
      console.log(`Feature map size: ${this.featureMap.size}`);
      console.log(`Label map size: ${this.labelMap.size}`);
      
      // Ekstrak fitur dan label untuk training
      const features: number[][] = [];
      const labels: number[] = [];
      
      for (const item of dataset) {
        const itemFeatures = extractErrorFeatures(item);
        const featureArray = featuresToArray(itemFeatures, this.featureMap);
        features.push(featureArray);
        
        const labelIndex = labelToIndex(item.probableCause, this.labelMap);
        labels.push(labelIndex);
      }
      
      // Siapkan data training untuk TF
      const xs = tf.tensor2d(features);
      const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), this.labelMap.size);
      
      // 1. Latih model TensorFlow yang lebih kompleks
      
      // Buat model sequential baru dengan arsitektur yang lebih kompleks
      this.tfModel = tf.sequential();
      
      // Input layer dengan normalisasi batch
      this.tfModel.add(tf.layers.dense({
        inputShape: [this.featureMap.size],
        units: 256,
        activation: 'relu'
      }));
      
      this.tfModel.add(tf.layers.batchNormalization());
      this.tfModel.add(tf.layers.dropout({ rate: 0.5 }));
      
      // Hidden layer 1
      this.tfModel.add(tf.layers.dense({
        units: 128,
        activation: 'relu'
      }));
      
      this.tfModel.add(tf.layers.batchNormalization());
      this.tfModel.add(tf.layers.dropout({ rate: 0.4 }));
      
      // Hidden layer 2
      this.tfModel.add(tf.layers.dense({
        units: 64,
        activation: 'relu'
      }));
      
      this.tfModel.add(tf.layers.batchNormalization());
      this.tfModel.add(tf.layers.dropout({ rate: 0.3 }));
      
      // Output layer
      this.tfModel.add(tf.layers.dense({
        units: this.labelMap.size,
        activation: 'softmax'
      }));
      
      // Compile model dengan optimizer Adam dan learning rate dinamis
      const optimizer = tf.train.adam(0.001);
      
      this.tfModel.compile({
        optimizer,
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
      
      // Latih model dengan callbacks untuk monitoring
      await this.tfModel.fit(xs, ys, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(
                `Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc.toFixed(4)}, ` +
                `val_loss = ${logs?.val_loss.toFixed(4)}, val_accuracy = ${logs?.val_acc.toFixed(4)}`
              );
            }
          }
        }
      });
      
      // 2. Latih KNN model sebagai bagian dari ensemble
      this.knnModel = new KNN(features, labels, { k: 5 });
      
      // 3. Latih BERT model
      await this.bertModel.train();
      
      // 4. Simpan semua model
      await this.saveModel();
      
      // Bebaskan memori tensors
      xs.dispose();
      ys.dispose();
      
      this.isModelLoaded = true;
      console.log('Ensemble model training completed');
    } catch (error) {
      console.error('Error training ensemble model:', error);
      throw error;
    }
  }

  /**
   * Prediksi penyebab error dengan menggabungkan beberapa model
   * dan memberikan bobot sesuai akurasi masing-masing model
   */
  async predict(item: ErrorDataItem): Promise<Array<{ 
    cause: string; 
    probability: number;
    confidence: number;
    models: {
      tf: number;
      knn: number;
      bert: number;
    }
  }>> {
    // Import cache service
    const { cacheService } = await import('./cacheService');
    
    // Cek cache untuk hasil prediksi sebelumnya
    const cachedPrediction = cacheService.getCachedPrediction(item.id);
    
    if (cachedPrediction) {
      console.log('Using cached ensemble prediction');
      return cachedPrediction;
    }
    
    // Pastikan model sudah dimuat
    if (!this.isModelLoaded) {
      const loaded = await this.loadModel();
      if (!loaded) {
        throw new Error('Model belum dilatih atau gagal dimuat');
      }
    }
    
    try {
      // 1. Prediksi dari model TensorFlow
      const itemFeatures = extractErrorFeatures(item);
      const featureArray = featuresToArray(itemFeatures, this.featureMap);
      const input = tf.tensor2d([featureArray]);
      
      const tfPredictions = this.tfModel!.predict(input) as tf.Tensor;
      const tfPredictionsData = await tfPredictions.data();
      
      // 2. Prediksi dari model KNN
      const knnPrediction = this.knnModel.predict([featureArray]);
      
      // Ubah hasil KNN menjadi probabilitas
      const knnPredictionArray = new Array(this.labelMap.size).fill(0);
      knnPredictionArray[knnPrediction[0]] = 1;
      
      // 3. Prediksi dari model BERT
      const bertPredictions = await this.bertModel.predictCause(item);
      
      // Konversi bertPredictions menjadi array probabilitas
      const bertPredictionArray = new Array(this.labelMap.size).fill(0);
      for (const pred of bertPredictions) {
        const labelIndex = labelToIndex(pred.cause, this.labelMap);
        if (labelIndex >= 0) {
          bertPredictionArray[labelIndex] = pred.probability;
        }
      }
      
      // Bobot untuk setiap model dalam ensemble
      const weights = {
        tf: 0.5,     // Model TensorFlow yang kompleks
        knn: 0.2,    // Model KNN
        bert: 0.3    // Model BERT
      };
      
      // Gabungkan hasil prediksi dengan weighted ensemble
      const combinedPredictions = new Array(this.labelMap.size).fill(0);
      
      for (let i = 0; i < this.labelMap.size; i++) {
        combinedPredictions[i] = 
          (tfPredictionsData[i] * weights.tf) +
          (knnPredictionArray[i] * weights.knn) +
          (bertPredictionArray[i] * weights.bert);
      }
      
      // Buat hasil akhir
      const result: Array<{ 
        cause: string; 
        probability: number;
        confidence: number;
        models: {
          tf: number;
          knn: number;
          bert: number;
        }
      }> = [];
      
      // Hitung confidence score berdasarkan konsensus dari berbagai model
      for (let i = 0; i < combinedPredictions.length; i++) {
        const cause = indexToLabel(i, this.labelMap);
        
        // Hitung confidence berdasarkan jumlah model yang setuju
        const modelValues = [
          tfPredictionsData[i], 
          knnPredictionArray[i], 
          bertPredictionArray[i]
        ];
        
        const agreementCount = modelValues.filter(v => v > 0.2).length;
        const variance = this.calculateVariance(modelValues);
        
        // Confidence tinggi jika banyak model setuju dan varian rendah
        const confidence = (agreementCount / 3) * (1 - Math.min(1, variance * 5));
        
        result.push({
          cause,
          probability: combinedPredictions[i],
          confidence,
          models: {
            tf: tfPredictionsData[i],
            knn: knnPredictionArray[i],
            bert: bertPredictionArray[i]
          }
        });
      }
      
      // Bebaskan memori
      input.dispose();
      tfPredictions.dispose();
      
      // Urutkan dan filter hasil
      const finalResult = result
        .sort((a, b) => b.probability - a.probability)
        .filter(r => r.probability > 0.05); // Filter yang probabilitasnya terlalu kecil
      
      // Simpan hasil prediksi ke cache
      cacheService.cachePrediction(item.id, finalResult);
      
      return finalResult;
    } catch (error) {
      console.error('Error predicting with ensemble model:', error);
      throw error;
    }
  }

  /**
   * Hitung varian dari serangkaian nilai
   * Digunakan untuk menghitung tingkat kesepakatan antar model
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return variance;
  }

  /**
   * Evaluasi kinerja model ensemble
   */
  async evaluateModel(testData: ErrorDataItem[]): Promise<{
    accuracy: number;
    f1Score: number;
    confusionMatrix: number[][];
    classAccuracy: Record<string, { precision: number; recall: number; f1: number }>;
  }> {
    if (!this.isModelLoaded) {
      const loaded = await this.loadModel();
      if (!loaded) {
        throw new Error('Model belum dilatih atau gagal dimuat');
      }
    }
    
    try {
      const predictions: string[] = [];
      const actualLabels: string[] = [];
      
      // Buat confusion matrix
      const confusionMatrix: number[][] = Array(this.labelMap.size)
        .fill(0)
        .map(() => Array(this.labelMap.size).fill(0));
      
      // Evaluasi tiap test item
      for (const item of testData) {
        const result = await this.predict(item);
        const topPrediction = result[0]; // Ambil prediksi dengan probabilitas tertinggi
        
        const predictedLabel = topPrediction.cause;
        const actualLabel = item.probableCause;
        
        predictions.push(predictedLabel);
        actualLabels.push(actualLabel);
        
        // Update confusion matrix
        const predictedIndex = labelToIndex(predictedLabel, this.labelMap);
        const actualIndex = labelToIndex(actualLabel, this.labelMap);
        confusionMatrix[actualIndex][predictedIndex]++;
      }
      
      // Hitung accuracy
      let correctCount = 0;
      for (let i = 0; i < predictions.length; i++) {
        if (predictions[i] === actualLabels[i]) {
          correctCount++;
        }
      }
      const accuracy = correctCount / predictions.length;
      
      // Hitung precision, recall, dan F1 score untuk setiap kelas
      const classAccuracy: Record<string, { precision: number; recall: number; f1: number }> = {};
      let totalF1 = 0;
      
      for (let i = 0; i < this.labelMap.size; i++) {
        const className = indexToLabel(i, this.labelMap);
        
        // True positive untuk kelas ini
        const tp = confusionMatrix[i][i];
        
        // False positive (predicted as this class but actually other)
        let fp = 0;
        for (let j = 0; j < this.labelMap.size; j++) {
          if (j !== i) {
            fp += confusionMatrix[j][i];
          }
        }
        
        // False negative (actually this class but predicted as other)
        let fn = 0;
        for (let j = 0; j < this.labelMap.size; j++) {
          if (j !== i) {
            fn += confusionMatrix[i][j];
          }
        }
        
        // Hitung precision dan recall
        const precision = tp / (tp + fp) || 0;
        const recall = tp / (tp + fn) || 0;
        
        // Hitung F1 score
        const f1 = 2 * (precision * recall) / (precision + recall) || 0;
        
        classAccuracy[className] = { precision, recall, f1 };
        totalF1 += f1;
      }
      
      // Average F1 score across all classes
      const f1Score = totalF1 / this.labelMap.size;
      
      return {
        accuracy,
        f1Score,
        confusionMatrix,
        classAccuracy
      };
    } catch (error) {
      console.error('Error evaluating ensemble model:', error);
      throw error;
    }
  }
}

// Buat singleton instance yang akan digunakan dalam aplikasi
import { errorClassifier } from './errorClassifierService';
export const advancedErrorPredictor = new AdvancedErrorPredictor(errorClassifier); 