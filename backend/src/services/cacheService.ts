import NodeCache from 'node-cache';

/**
 * Service untuk menangani caching data untuk mengoptimalkan performa
 * analisis realtime
 */
export class CacheService {
  private static instance: CacheService;
  private cache: NodeCache;
  
  // Cache TTL default dalam detik
  private readonly DEFAULT_TTL = 3600; // 1 jam
  
  // Prefiks cache key untuk tipe data berbeda
  private readonly KEY_PREFIX = {
    EMBEDDING: 'emb_',
    PREDICTION: 'pred_',
    SIMILAR_ERRORS: 'sim_',
    CLUSTER: 'clstr_',
  };
  
  private constructor() {
    // Inisialisasi cache dengan standard TTL dan check period
    this.cache = new NodeCache({
      stdTTL: this.DEFAULT_TTL,
      checkperiod: 120, // Check expired keys setiap 2 menit
      useClones: false, // Untuk efisiensi memory dengan objek besar
      maxKeys: 5000, // Batasi jumlah entri untuk menghindari memory leak
    });
    
    console.log('Cache service initialized');
  }
  
  /**
   * Mendapatkan instance singleton dari CacheService
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }
  
  /**
   * Menyimpan hasil embedding ke cache
   * @param errorMessage Pesan error yang digunakan untuk generate embedding
   * @param embedding Hasil embedding sebagai array of number
   * @param ttl Opsional Time-to-live dalam detik
   */
  public cacheEmbedding(errorMessage: string, embedding: number[], ttl?: number): void {
    const hash = this.hashString(errorMessage);
    const key = `${this.KEY_PREFIX.EMBEDDING}${hash}`;
    this.cache.set(key, embedding, ttl || this.DEFAULT_TTL);
  }
  
  /**
   * Mendapatkan cached embedding jika ada
   * @param errorMessage Pesan error 
   * @returns Embedding vector jika ditemukan, undefined jika tidak
   */
  public getCachedEmbedding(errorMessage: string): number[] | undefined {
    const hash = this.hashString(errorMessage);
    const key = `${this.KEY_PREFIX.EMBEDDING}${hash}`;
    return this.cache.get<number[]>(key);
  }
  
  /**
   * Menyimpan hasil prediksi error ke cache
   * @param errorId ID dari error
   * @param prediction Hasil prediksi 
   * @param ttl Opsional Time-to-live dalam detik
   */
  public cachePrediction(errorId: string, prediction: any, ttl?: number): void {
    const key = `${this.KEY_PREFIX.PREDICTION}${errorId}`;
    this.cache.set(key, prediction, ttl || this.DEFAULT_TTL);
  }
  
  /**
   * Mendapatkan cached prediction jika ada
   * @param errorId ID dari error
   * @returns Prediction object jika ditemukan, undefined jika tidak
   */
  public getCachedPrediction(errorId: string): any | undefined {
    const key = `${this.KEY_PREFIX.PREDICTION}${errorId}`;
    return this.cache.get(key);
  }
  
  /**
   * Menyimpan hasil pencarian error yang mirip ke cache
   * @param errorId ID dari error
   * @param similarErrors Array error yang mirip
   * @param ttl Opsional Time-to-live dalam detik
   */
  public cacheSimilarErrors(errorId: string, similarErrors: any[], ttl?: number): void {
    const key = `${this.KEY_PREFIX.SIMILAR_ERRORS}${errorId}`;
    this.cache.set(key, similarErrors, ttl || this.DEFAULT_TTL);
  }
  
  /**
   * Mendapatkan cached similar errors jika ada
   * @param errorId ID dari error
   * @returns Array similar errors jika ditemukan, undefined jika tidak
   */
  public getCachedSimilarErrors(errorId: string): any[] | undefined {
    const key = `${this.KEY_PREFIX.SIMILAR_ERRORS}${errorId}`;
    return this.cache.get<any[]>(key);
  }
  
  /**
   * Menyimpan hasil cluster assignment ke cache
   * @param errorId ID dari error
   * @param clusterInfo Informasi cluster untuk error
   * @param ttl Opsional Time-to-live dalam detik
   */
  public cacheClusterAssignment(errorId: string, clusterInfo: any, ttl?: number): void {
    const key = `${this.KEY_PREFIX.CLUSTER}${errorId}`;
    this.cache.set(key, clusterInfo, ttl || this.DEFAULT_TTL);
  }
  
  /**
   * Mendapatkan cached cluster assignment jika ada
   * @param errorId ID dari error
   * @returns Cluster info jika ditemukan, undefined jika tidak
   */
  public getCachedClusterAssignment(errorId: string): any | undefined {
    const key = `${this.KEY_PREFIX.CLUSTER}${errorId}`;
    return this.cache.get(key);
  }
  
  /**
   * Hapus item dari cache berdasarkan key
   * @param key Cache key
   * @returns true jika berhasil, false jika gagal
   */
  public invalidate(key: string): boolean {
    return this.cache.del(key) > 0;
  }
  
  /**
   * Hapus semua item dengan prefix tertentu
   * @param prefix Prefiks key yang akan dihapus
   * @returns Jumlah item yang dihapus
   */
  public invalidateByPrefix(prefix: string): number {
    const keys = this.cache.keys();
    const keysToDelete = keys.filter(key => key.startsWith(prefix));
    
    if (keysToDelete.length === 0) {
      return 0;
    }
    
    return this.cache.del(keysToDelete);
  }
  
  /**
   * Hapus semua item di cache
   * @returns true jika berhasil
   */
  public clear(): boolean {
    this.cache.flushAll();
    return true;
  }
  
  /**
   * Mendapatkan statistik cache
   */
  public getStats(): {
    keys: number;
    hits: number;
    misses: number;
    hitRate: number;
    ksize: number;
    vsize: number;
  } {
    const stats = this.cache.getStats();
    return {
      keys: this.cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses || 1),
      ksize: stats.ksize,
      vsize: stats.vsize,
    };
  }
  
  /**
   * Helper method untuk menghasilkan hash dari string
   * @param str String yang akan dihash
   * @returns Hash string yang dihasilkan
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16); // Konversi ke hex string
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance(); 