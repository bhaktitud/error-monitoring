import * as tf from '@tensorflow/tfjs-node';
import { load as loadUSE } from '@tensorflow-models/universal-sentence-encoder';
import { ErrorDataItem } from '../utils/datasetGenerator';
import * as fs from 'fs';
import * as path from 'path';
import prisma from '../models/prisma';

// Path untuk menyimpan model dan embedding
const MODEL_DIR = path.join(__dirname, '../../models');
const USE_MODEL_PATH = path.join(MODEL_DIR, 'use_model');
const ERROR_EMBEDDINGS_PATH = path.join(MODEL_DIR, 'error_embeddings.json');

/**
 * Service untuk analisis error message menggunakan BERT (Universal Sentence Encoder)
 * Menggunakan model pre-trained USE yang lebih ringan dibanding BERT penuh
 * tetapi tetap menggunakan prinsip transformer untuk embedding
 */
export class BertErrorAnalyzer {
  private model: any = null;
  private errorEmbeddings: Map<string, { id: string; embedding: number[]; cause: string }> = new Map();
  private isModelLoaded = false;

  constructor() {
    // Buat direktori jika belum ada
    if (!fs.existsSync(MODEL_DIR)) {
      fs.mkdirSync(MODEL_DIR, { recursive: true });
    }
  }

  /**
   * Cek apakah model sudah dimuat
   */
  isLoaded(): boolean {
    return this.isModelLoaded;
  }

  /**
   * Muat model USE dan error embeddings jika ada
   */
  async loadModel(): Promise<boolean> {
    try {
      // Muat model USE
      this.model = await loadUSE();
      
      // Muat embeddings error sebelumnya jika ada
      if (fs.existsSync(ERROR_EMBEDDINGS_PATH)) {
        const embeddingsData = JSON.parse(fs.readFileSync(ERROR_EMBEDDINGS_PATH, 'utf-8'));
        this.errorEmbeddings = new Map(Object.entries(embeddingsData));
        console.log(`Loaded ${this.errorEmbeddings.size} error embeddings`);
      }
      
      this.isModelLoaded = true;
      return true;
    } catch (error) {
      console.error('Error loading BERT model:', error);
      return false;
    }
  }

  /**
   * Simpan embeddings error ke file
   */
  private async saveEmbeddings(): Promise<void> {
    const embeddingsObj = Object.fromEntries(this.errorEmbeddings);
    fs.writeFileSync(ERROR_EMBEDDINGS_PATH, JSON.stringify(embeddingsObj, null, 2));
    console.log(`Saved ${this.errorEmbeddings.size} error embeddings`);
  }

  /**
   * Generate embedding dari teks menggunakan USE
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Import cache service
    const { cacheService } = await import('./cacheService');
    
    // Cek apakah embedding sudah ada di cache
    const cachedEmbedding = cacheService.getCachedEmbedding(text);
    
    if (cachedEmbedding) {
      console.log('Using cached embedding');
      return cachedEmbedding;
    }
    
    if (!this.isModelLoaded) {
      await this.loadModel();
    }
    
    const embeddings = await this.model.embeddings([text]);
    const embeddingArray = await embeddings.array();
    
    // Simpan ke cache untuk penggunaan berikutnya
    cacheService.cacheEmbedding(text, embeddingArray[0]);
    
    return embeddingArray[0];
  }

  /**
   * Proses dataset dan buat embeddings untuk semua error
   */
  async processDataset(dataset: ErrorDataItem[]): Promise<void> {
    if (!this.isModelLoaded) {
      await this.loadModel();
    }
    
    console.log(`Processing ${dataset.length} errors for embeddings...`);
    
    // Buat array teks untuk semua error messages
    const errorTexts = dataset.map(item => this.preprocessErrorMessage(item));
    
    // Generate embeddings secara batch untuk efisiensi
    const batchSize = 32;
    for (let i = 0; i < errorTexts.length; i += batchSize) {
      const batch = errorTexts.slice(i, i + batchSize);
      const items = dataset.slice(i, i + batchSize);
      
      // Generate embeddings untuk batch
      const embeddings = await this.model.embeddings(batch);
      const embeddingArrays = await embeddings.array();
      
      // Simpan embeddings untuk setiap error
      for (let j = 0; j < embeddingArrays.length; j++) {
        const item = items[j];
        this.errorEmbeddings.set(item.id, {
          id: item.id,
          embedding: embeddingArrays[j],
          cause: item.probableCause
        });
      }
      
      console.log(`Processed batch ${i / batchSize + 1}/${Math.ceil(errorTexts.length / batchSize)}`);
    }
    
    // Simpan embeddings
    await this.saveEmbeddings();
    console.log('Finished processing dataset.');
  }

  /**
   * Preprocessing pesan error untuk mendapatkan hasil yang lebih baik
   */
  private preprocessErrorMessage(item: ErrorDataItem): string {
    // Kombinasikan beberapa informasi penting
    let text = `${item.errorType}: ${item.message}`;
    
    // Tambahkan stack trace pertama jika ada
    if (item.stackFrames && item.stackFrames.length > 0) {
      const frame = item.stackFrames[0];
      text += ` at ${frame.functionName || 'anonymous'} (${frame.fileName}:${frame.lineNumber})`;
    }
    
    return text;
  }

  /**
   * Hitung similaritas kosinus antara dua embedding
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
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
   * Analisis error baru dan temukan error yang paling mirip
   */
  async analyzeError(item: ErrorDataItem, topK: number = 5): Promise<Array<{
    id: string;
    cause: string;
    similarity: number;
  }>> {
    // Import cache service
    const { cacheService } = await import('./cacheService');
    
    // Cek cache untuk hasil analisis sebelumnya
    const cachedSimilarErrors = cacheService.getCachedSimilarErrors(item.id);
    
    if (cachedSimilarErrors) {
      console.log('Using cached similar errors analysis');
      return cachedSimilarErrors.slice(0, topK);
    }
    
    if (!this.isModelLoaded) {
      await this.loadModel();
    }
    
    // Generate embedding untuk error baru
    const text = this.preprocessErrorMessage(item);
    const embedding = await this.generateEmbedding(text);
    
    // Bandingkan dengan semua error yang ada
    const similarities: Array<{
      id: string;
      cause: string;
      similarity: number;
    }> = [];
    
    for (const [id, data] of this.errorEmbeddings.entries()) {
      const similarity = this.cosineSimilarity(embedding, data.embedding);
      similarities.push({
        id,
        cause: data.cause,
        similarity
      });
    }
    
    // Urutkan berdasarkan similaritas tertinggi
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    // Simpan hasil ke cache
    cacheService.cacheSimilarErrors(item.id, similarities);
    
    // Kembalikan top K
    return similarities.slice(0, topK);
  }

  /**
   * Latih model untuk mendapatkan embeddings dari dataset lengkap
   */
  async train(): Promise<void> {
    // Ambil data dari database
    const dataset = await import('../utils/datasetGenerator').then(
      module => module.generateTrainingDataset()
    );
    
    if (dataset.length < 10) {
      throw new Error('Dataset terlalu kecil untuk training, minimal butuh 10 item');
    }
    
    // Proses dataset untuk membuat embeddings
    await this.processDataset(dataset);
  }

  /**
   * Analisis penyebab error baru berdasarkan error yang mirip
   */
  async predictCause(item: ErrorDataItem): Promise<Array<{
    cause: string;
    probability: number;
  }>> {
    // Temukan error yang mirip
    const similarErrors = await this.analyzeError(item, 10);
    
    // Hitung probabilitas untuk setiap kemungkinan penyebab
    const causeProbabilities = new Map<string, number>();
    let totalWeight = 0;
    
    for (const error of similarErrors) {
      // Gunakan similaritas sebagai bobot
      const weight = error.similarity;
      totalWeight += weight;
      
      const currentValue = causeProbabilities.get(error.cause) || 0;
      causeProbabilities.set(error.cause, currentValue + weight);
    }
    
    // Normalize probabilitas
    const result: Array<{ cause: string; probability: number }> = [];
    for (const [cause, weight] of causeProbabilities.entries()) {
      result.push({
        cause,
        probability: totalWeight > 0 ? weight / totalWeight : 0
      });
    }
    
    // Urutkan berdasar probabilitas tertinggi
    return result.sort((a, b) => b.probability - a.probability);
  }
}

// Buat singleton instance
export const bertErrorAnalyzer = new BertErrorAnalyzer(); 