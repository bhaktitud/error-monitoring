import * as tf from '@tensorflow/tfjs-node';
import { ErrorDataItem, extractErrorFeatures, featuresToArray } from '../utils/datasetGenerator';
import { bertErrorAnalyzer } from './bertErrorAnalyzerService';
import { kmeans } from 'ml-kmeans';
import * as fs from 'fs';
import * as path from 'path';
import prisma from '../models/prisma';

// Path untuk menyimpan model clustering
const MODEL_DIR = path.join(__dirname, '../../models');
const CLUSTERS_PATH = path.join(MODEL_DIR, 'error_clusters.json');
const EMBEDDINGS_PATH = path.join(MODEL_DIR, 'cluster_embeddings.json');

/**
 * Interface untuk cluster error
 */
interface ErrorCluster {
  id: string;
  name: string;
  description: string;
  centroid: number[]; // Titik pusat cluster dalam embedding space
  semanticCentroid: number[]; // Semantic embedding untuk cluster
  errorTypes: string[]; // Tipe error dalam cluster
  commonMessages: string[]; // Pesan error umum dalam cluster
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface untuk error yang sudah di-cluster
 */
interface ClusteredError {
  id: string;
  clusterId: string;
  distance: number; // Jarak ke centroid
}

/**
 * Service untuk pengelompokan error menggunakan algoritma clustering
 */
export class ErrorClusteringService {
  private clusters: ErrorCluster[] = [];
  private clusteringModel: any = null;
  private errorEmbeddings: Map<string, number[]> = new Map();
  private bertModel: typeof bertErrorAnalyzer;
  private embeddingDimension = 512; // Dimensi embedding dari Universal Sentence Encoder
  private _isInitialized = false;

  constructor() {
    if (!fs.existsSync(MODEL_DIR)) {
      fs.mkdirSync(MODEL_DIR, { recursive: true });
    }
    this.bertModel = bertErrorAnalyzer;
  }

  /**
   * Cek apakah service sudah diinisialisasi
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Inisialisasi service
   */
  async initialize(): Promise<boolean> {
    try {
      // Muat model BERT untuk embedding
      await this.bertModel.loadModel();
      
      // Muat cluster yang tersimpan
      if (fs.existsSync(CLUSTERS_PATH)) {
        this.clusters = JSON.parse(fs.readFileSync(CLUSTERS_PATH, 'utf-8'));
        console.log(`Loaded ${this.clusters.length} error clusters`);
      }
      
      // Muat error embeddings
      if (fs.existsSync(EMBEDDINGS_PATH)) {
        const embeddingsData = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, 'utf-8'));
        this.errorEmbeddings = new Map(Object.entries(embeddingsData));
        console.log(`Loaded ${this.errorEmbeddings.size} error embeddings for clustering`);
      }
      
      this._isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing error clustering service:', error);
      return false;
    }
  }

  /**
   * Simpan state service
   */
  private async saveState(): Promise<void> {
    // Simpan cluster
    fs.writeFileSync(CLUSTERS_PATH, JSON.stringify(this.clusters, null, 2));
    
    // Simpan embeddings
    const embeddingsObj = Object.fromEntries(this.errorEmbeddings);
    fs.writeFileSync(EMBEDDINGS_PATH, JSON.stringify(embeddingsObj, null, 2));
    
    console.log(`Saved ${this.clusters.length} clusters and ${this.errorEmbeddings.size} embeddings`);
  }

  /**
   * Generate embeddings dari dataset
   */
  private async generateEmbeddings(dataset: ErrorDataItem[]): Promise<Map<string, number[]>> {
    const embeddings = new Map<string, number[]>();
    
    // Gunakan batch processing untuk efisiensi
    const batchSize = 32;
    for (let i = 0; i < dataset.length; i += batchSize) {
      const batch = dataset.slice(i, i + batchSize);
      
      // Preprocess error messages
      const errorTexts = batch.map(item => this.preprocessErrorMessage(item));
      
      // Generate embeddings dengan BERT model
      console.log(`Generating embeddings for batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(dataset.length / batchSize)}`);
      
      // Gunakan generateEmbedding dari bertModel untuk setiap pesan
      const embeddingPromises = errorTexts.map(text => this.bertModel.generateEmbedding(text));
      const embeddingArrays = await Promise.all(embeddingPromises);
      
      // Simpan embeddings
      for (let j = 0; j < embeddingArrays.length; j++) {
        embeddings.set(batch[j].id, embeddingArrays[j]);
      }
    }
    
    return embeddings;
  }

  /**
   * Preprocess pesan error untuk embedding
   */
  private preprocessErrorMessage(item: ErrorDataItem): string {
    let text = `${item.errorType}: ${item.message}`;
    
    // Tambahkan stack trace pertama jika ada
    if (item.stackFrames && item.stackFrames.length > 0) {
      const frame = item.stackFrames[0];
      text += ` at ${frame.functionName || 'anonymous'} (${frame.fileName}:${frame.lineNumber})`;
    }
    
    return text;
  }

  /**
   * Lakukan clustering pada dataset
   */
  async performClustering(dataset: ErrorDataItem[], numClusters: number = 0): Promise<ErrorCluster[]> {
    if (!this._isInitialized) {
      await this.initialize();
    }
    
    try {
      // Generate embeddings untuk semua error
      this.errorEmbeddings = await this.generateEmbeddings(dataset);
      
      // Konversi embeddings ke array untuk algoritma k-means
      const errorIds = Array.from(this.errorEmbeddings.keys());
      const embeddingVectors = errorIds.map(id => this.errorEmbeddings.get(id)!);
      
      // Tentukan jumlah cluster optimal jika tidak ditentukan
      if (numClusters <= 0) {
        numClusters = this.determineOptimalClusterCount(embeddingVectors, dataset.length);
      }
      
      console.log(`Performing clustering with ${numClusters} clusters on ${embeddingVectors.length} errors`);
      
      // Lakukan K-means clustering
      const result = kmeans(embeddingVectors, numClusters, {
        seed: 42,
        maxIterations: 100
      });
      
      // Hasilnya berisi clusters dan centroids
      const { clusters: clusterAssignments, centroids } = result;
      
      // Buat cluster baru
      this.clusters = [];
      
      // Kelompokkan error berdasarkan cluster
      const errorsByCluster: Record<number, ErrorDataItem[]> = {};
      
      for (let i = 0; i < clusterAssignments.length; i++) {
        const clusterId = clusterAssignments[i];
        const errorId = errorIds[i];
        const error = dataset.find(item => item.id === errorId);
        
        if (error) {
          if (!errorsByCluster[clusterId]) {
            errorsByCluster[clusterId] = [];
          }
          errorsByCluster[clusterId].push(error);
        }
      }
      
      // Buat objek cluster
      for (let i = 0; i < numClusters; i++) {
        const clusterErrors = errorsByCluster[i] || [];
        
        if (clusterErrors.length === 0) continue;
        
        // Hitung properti cluster
        const errorTypes = this.getMostCommonValues(clusterErrors.map(e => e.errorType));
        const messages = this.getMostCommonValues(clusterErrors.map(e => e.message), 5);
        
        // Buat nama dan deskripsi cluster berdasarkan error yang dominan
        const mainErrorType = errorTypes[0] || 'Unknown Error';
        const name = `Cluster ${i + 1}: ${mainErrorType}`;
        
        const description = messages.length > 0 
          ? `Errors related to: ${messages[0]}`
          : `Cluster of ${clusterErrors.length} errors`;
        
        // Buat cluster baru
        const newCluster: ErrorCluster = {
          id: `cluster_${i + 1}`,
          name,
          description,
          centroid: centroids[i],
          semanticCentroid: this.calculateSemanticCentroid(clusterErrors),
          errorTypes,
          commonMessages: messages,
          errorCount: clusterErrors.length,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        this.clusters.push(newCluster);
      }
      
      // Simpan state
      await this.saveState();
      
      return this.clusters;
    } catch (error) {
      console.error('Error performing clustering:', error);
      throw error;
    }
  }

  /**
   * Tentukan jumlah cluster yang optimal
   * Menggunakan metode elbow (dengan varian dari SSE)
   */
  private determineOptimalClusterCount(data: number[][], numErrors: number): number {
    // Default: heuristic sederhana berdasarkan jumlah data
    // Aturan praktis: sqrt(n/2) di mana n adalah jumlah data
    const baseCount = Math.round(Math.sqrt(numErrors / 2));
    
    // Batasi jumlah cluster antara 3 dan 15
    return Math.max(3, Math.min(15, baseCount));
  }

  /**
   * Hitung centroid semantik untuk cluster
   * Ini membantu untuk mendeskripsikan isi cluster secara lebih bermakna
   */
  private calculateSemanticCentroid(clusterErrors: ErrorDataItem[]): number[] {
    // Inisialisasi array centroid dengan 0
    const centroid = new Array(this.embeddingDimension).fill(0);
    
    // Jika tidak ada error, kembalikan centroid kosong
    if (clusterErrors.length === 0) {
      return centroid;
    }
    
    // Jumlahkan semua embedding
    for (const error of clusterErrors) {
      const embedding = this.errorEmbeddings.get(error.id);
      if (embedding) {
        for (let i = 0; i < this.embeddingDimension; i++) {
          centroid[i] += embedding[i];
        }
      }
    }
    
    // Bagi dengan jumlah error untuk mendapatkan rata-rata
    for (let i = 0; i < this.embeddingDimension; i++) {
      centroid[i] /= clusterErrors.length;
    }
    
    return centroid;
  }

  /**
   * Dapatkan nilai yang paling umum dari array
   */
  private getMostCommonValues<T>(values: T[], limit: number = 3): T[] {
    const counts = new Map<string, { value: T; count: number }>();
    
    for (const value of values) {
      const key = String(value);
      const current = counts.get(key);
      if (current) {
        current.count++;
      } else {
        counts.set(key, { value, count: 1 });
      }
    }
    
    // Urutkan berdasarkan jumlah teratas
    const sorted = Array.from(counts.values()).sort((a, b) => b.count - a.count);
    
    // Ambil sejumlah teratas
    return sorted.slice(0, limit).map(item => item.value);
  }

  /**
   * Tentukan cluster untuk error baru
   */
  async clusterNewError(item: ErrorDataItem): Promise<{
    clusterId: string;
    clusterName: string;
    distance: number;
    confidence: number;
  }> {
    if (!this._isInitialized) {
      await this.initialize();
    }
    
    try {
      // Generate embedding untuk error baru
      const text = this.preprocessErrorMessage(item);
      const vector = await this.bertModel.generateEmbedding(text);
      
      // Jika tidak ada cluster, tidak bisa melakukan clustering
      if (this.clusters.length === 0) {
        throw new Error('Tidak ada cluster yang tersedia, jalankan clustering terlebih dahulu');
      }
      
      // Hitung jarak ke setiap centroid cluster
      const distances: Array<{ clusterId: string; distance: number }> = [];
      
      for (const cluster of this.clusters) {
        const distance = this.calculateCosineSimilarity(vector, cluster.centroid);
        distances.push({
          clusterId: cluster.id,
          distance: 1 - distance // Ubah similaritas menjadi jarak
        });
      }
      
      // Urutkan berdasarkan jarak terkecil (similaritas tertinggi)
      distances.sort((a, b) => a.distance - b.distance);
      
      // Ambil cluster terdekat
      const nearestCluster = distances[0];
      const cluster = this.clusters.find(c => c.id === nearestCluster.clusterId);
      
      if (!cluster) {
        throw new Error('Cluster tidak ditemukan');
      }
      
      // Hitung confidence berdasarkan jarak
      // Semakin dekat ke centroid, semakin tinggi confidence
      const confidence = Math.max(0, 1 - nearestCluster.distance);
      
      return {
        clusterId: cluster.id,
        clusterName: cluster.name,
        distance: nearestCluster.distance,
        confidence
      };
    } catch (error) {
      console.error('Error clustering new error:', error);
      throw error;
    }
  }

  /**
   * Hitung similarity kosinus antara dua vektor
   */
  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (normA * normB);
  }

  /**
   * Jalankan proses clustering pada semua error
   */
  async runClusteringOnAllErrors(numClusters: number = 0): Promise<ErrorCluster[]> {
    try {
      // Ambil semua error dari database dengan kriteria yang sesuai
      const events = await prisma.event.findMany({
        where: {
          // Ambil event yang memiliki metadata cukup
          stacktrace: {
            not: null
          }
        },
        take: 1000 // Batasi untuk performa
      });
      
      // Konversi ke format ErrorDataItem
      const dataset: ErrorDataItem[] = [];
      
      for (const event of events) {
        try {
          // Parse stacktrace jika ada
          const stackTraceParser = await import('../utils/stackTraceParser');
          const stackFrames = event.stacktrace 
            ? stackTraceParser.parseStackTrace(event.stacktrace)
            : [];
          
          dataset.push({
            id: event.id,
            errorType: event.errorType,
            message: event.message,
            stacktraceText: event.stacktrace || '',
            stackFrames,
            browser: event.browser || undefined,
            os: event.os || undefined,
            statusCode: event.statusCode || undefined,
            environment: event.environment || undefined,
            probableCause: 'unknown' // Default value untuk clustering
          });
        } catch (parseError) {
          console.error('Error parsing stacktrace:', parseError);
          // Skip entry yang bermasalah
          continue;
        }
      }
      
      // Jalankan clustering
      return this.performClustering(dataset, numClusters);
    } catch (error) {
      console.error('Error running clustering on all errors:', error);
      throw error;
    }
  }

  /**
   * Dapatkan semua cluster yang ada
   */
  getClusters(): ErrorCluster[] {
    return this.clusters;
  }

  /**
   * Dapatkan informasi detail cluster
   */
  async getClusterDetails(clusterId: string): Promise<{
    cluster: ErrorCluster;
    topErrors: Array<{ id: string; errorType: string; message: string; distance: number }>;
  }> {
    if (!this._isInitialized) {
      await this.initialize();
    }
    
    const cluster = this.clusters.find(c => c.id === clusterId);
    if (!cluster) {
      throw new Error(`Cluster dengan ID ${clusterId} tidak ditemukan`);
    }
    
    // Temukan error yang termasuk di cluster ini
    const errorDistances: Array<{ id: string; errorType: string; message: string; distance: number }> = [];
    
    for (const [errorId, embedding] of this.errorEmbeddings.entries()) {
      const distance = 1 - this.calculateCosineSimilarity(embedding, cluster.centroid);
      
      // Cari data error
      const event = await prisma.event.findUnique({
        where: { id: errorId }
      });
      
      if (event) {
        errorDistances.push({
          id: errorId,
          errorType: event.errorType,
          message: event.message,
          distance
        });
      }
    }
    
    // Urutkan berdasarkan jarak terdekat ke centroid
    errorDistances.sort((a, b) => a.distance - b.distance);
    
    // Ambil top 20 errors
    const topErrors = errorDistances.slice(0, 20);
    
    return {
      cluster,
      topErrors
    };
  }
}

// Buat singleton instance
export const errorClusteringService = new ErrorClusteringService(); 