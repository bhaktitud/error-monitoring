import { PrismaClient } from '@prisma/client';
import { ErrorType, SolutionRecommendation, ErrorContext } from '../types/error';

const prisma = new PrismaClient();

/**
 * Service untuk merekomendasikan solusi berdasarkan error yang dianalisis
 */
export class SolutionRecommenderService {
  /**
   * Mendapatkan rekomendasi solusi berdasarkan error
   * @param errorId ID error yang perlu diberikan rekomendasi
   * @returns Array solusi yang direkomendasikan
   */
  async getRecommendations(errorId: string): Promise<SolutionRecommendation[]> {
    // Dapatkan detail error dari database
    const error = await prisma.event.findUnique({
      where: { id: errorId },
      include: {
        rootCauseAnalysis: true
      }
    });

    if (!error) {
      throw new Error(`Error dengan ID ${errorId} tidak ditemukan`);
    }

    // Mendapatkan rekomendasi berdasarkan tipe error
    const recommendations = await this.generateRecommendations(error);
    
    // Menyimpan rekomendasi ke database untuk referensi di masa mendatang
    await this.saveRecommendations(errorId, recommendations);
    
    return recommendations;
  }

  /**
   * Menghasilkan rekomendasi berdasarkan error
   * @param error Error object dengan detail lengkap
   * @returns Array rekomendasi solusi
   */
  private async generateRecommendations(error: any): Promise<SolutionRecommendation[]> {
    // Mendapatkan pattern error dari knowledge base
    const knowledgeBaseEntries = await prisma.errorKnowledgeBase.findMany({
      where: {
        errorType: error.type,
        // Mencari berdasarkan pattern yang cocok
        OR: [
          { pattern: { contains: error.message } },
          { keywords: { hasSome: this.extractKeywords(error.message) } }
        ]
      }
    });

    // Jika tidak ada entri dalam knowledge base, gunakan analisis generik
    if (knowledgeBaseEntries.length === 0) {
      return this.generateGenericRecommendations(error);
    }

    // Mengurutkan entri berdasarkan relevansi
    const sortedEntries = this.rankKnowledgeBaseEntries(knowledgeBaseEntries, error);
    
    // Menghasilkan rekomendasi dari entri knowledge base
    return sortedEntries.map(entry => ({
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      errorId: error.id,
      title: entry.solutionTitle,
      description: entry.solutionDescription,
      codeExample: entry.solutionCodeExample,
      confidence: this.calculateConfidence(entry, error),
      source: 'knowledge_base',
      relevanceScore: entry.relevanceScore || 0.7,
      createdAt: new Date()
    }));
  }

  /**
   * Menghasilkan rekomendasi generik jika tidak ada entri knowledge base yang cocok
   * @param error Error object
   * @returns Array rekomendasi generik
   */
  private async generateGenericRecommendations(error: any): Promise<SolutionRecommendation[]> {
    // Implementasi logika untuk menghasilkan rekomendasi generik
    // berdasarkan tipe error, konteks, dan analisis root cause
    
    const recommendations: SolutionRecommendation[] = [];
    
    // Rekomendasi berdasarkan tipe error
    switch (error.type) {
      case 'SYNTAX_ERROR':
        recommendations.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          errorId: error.id,
          title: 'Perbaiki sintaks kode',
          description: `Perhatikan sintaks di sekitar ${error.location?.lineNumber || 'baris yang ditunjukkan'}. ${error.message}`,
          codeExample: this.generateCodeExample(error),
          confidence: 0.6,
          source: 'generic',
          relevanceScore: 0.6,
          createdAt: new Date()
        });
        break;
        
      case 'RUNTIME_ERROR':
        recommendations.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          errorId: error.id,
          title: 'Periksa kondisi runtime',
          description: 'Periksa nilai-nilai variabel saat runtime dan pastikan semua asumsi valid.',
          codeExample: this.generateRuntimeCheckExample(error),
          confidence: 0.5,
          source: 'generic',
          relevanceScore: 0.5,
          createdAt: new Date()
        });
        break;
        
      // Tambahkan case untuk tipe error lainnya
        
      default:
        recommendations.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          errorId: error.id,
          title: 'Telaah stack trace',
          description: 'Periksa detail stack trace untuk mengidentifikasi sumber masalah.',
          codeExample: '',
          confidence: 0.4,
          source: 'generic',
          relevanceScore: 0.4,
          createdAt: new Date()
        });
    }
    
    return recommendations;
  }

  /**
   * Ekstrak kata kunci dari pesan error
   * @param message Pesan error
   * @returns Array kata kunci
   */
  private extractKeywords(message: string): string[] {
    // Implementasi ekstraksi keyword sederhana
    const keywords = message
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !['error', 'exception', 'failed', 'cannot'].includes(word));
      
    return [...new Set(keywords)];
  }

  /**
   * Mengurutkan entri knowledge base berdasarkan relevansi
   * @param entries Entri knowledge base
   * @param error Error object
   * @returns Entri yang diurutkan
   */
  private rankKnowledgeBaseEntries(entries: any[], error: any): any[] {
    return entries.map(entry => {
      // Hitung skor relevansi
      const keywordMatchScore = this.calculateKeywordMatchScore(entry, error);
      const patternMatchScore = this.calculatePatternMatchScore(entry, error);
      const contextMatchScore = this.calculateContextMatchScore(entry, error);
      
      // Skor gabungan
      const relevanceScore = (keywordMatchScore * 0.3) + (patternMatchScore * 0.5) + (contextMatchScore * 0.2);
      
      return {
        ...entry,
        relevanceScore
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Menghitung skor kecocokan kata kunci
   */
  private calculateKeywordMatchScore(entry: any, error: any): number {
    const errorKeywords = this.extractKeywords(error.message);
    const matchCount = entry.keywords.filter((kw: string) => errorKeywords.includes(kw)).length;
    return matchCount / Math.max(entry.keywords.length, 1);
  }

  /**
   * Menghitung skor kecocokan pola
   */
  private calculatePatternMatchScore(entry: any, error: any): number {
    if (!entry.pattern || entry.pattern.length === 0) return 0;
    return error.message.includes(entry.pattern) ? 1.0 : 0.0;
  }

  /**
   * Menghitung skor kecocokan konteks
   */
  private calculateContextMatchScore(entry: any, error: any): number {
    // Implementasi sederhana, bisa ditingkatkan dengan analisis konteks yang lebih canggih
    if (!entry.context || !error.context) return 0.5;
    
    // Contoh: cocokkan framework, library, atau teknologi
    const contextMatch = entry.context.framework === error.context.framework;
    return contextMatch ? 1.0 : 0.3;
  }

  /**
   * Menghitung tingkat kepercayaan rekomendasi
   */
  private calculateConfidence(entry: any, error: any): number {
    // Faktor untuk perhitungan confidence
    const successRate = entry.successRate || 0.5;
    const relevance = entry.relevanceScore || 0.5;
    
    return (successRate * 0.7) + (relevance * 0.3);
  }

  /**
   * Menghasilkan contoh kode untuk solusi
   */
  private generateCodeExample(error: any): string {
    // Implementasi contoh kode berdasarkan tipe error
    // Ini bisa dikembangkan lebih lanjut dengan template
    return `// Contoh perbaikan untuk error: ${error.message}
// Lokasi: ${error.location?.file || 'Unknown'}, baris: ${error.location?.lineNumber || 'Unknown'}

// Kode dengan error
${error.context?.code || '// Kode tidak tersedia'}

// Perbaikan yang disarankan
// Perhatikan sintaks yang benar
`;
  }

  /**
   * Menghasilkan contoh kode untuk pengecekan runtime
   */
  private generateRuntimeCheckExample(error: any): string {
    return `// Tambahkan validasi untuk mencegah error
if (variabel !== undefined && variabel !== null) {
  // Lakukan operasi dengan variabel
} else {
  // Tangani kasus ketika variabel tidak valid
  console.error('Variabel tidak valid');
}`;
  }

  /**
   * Menyimpan rekomendasi ke database
   */
  private async saveRecommendations(errorId: string, recommendations: SolutionRecommendation[]): Promise<void> {
    // Simpan rekomendasi ke database untuk analisis dan pembelajaran di masa depan
    for (const recommendation of recommendations) {
      await prisma.solutionRecommendation.create({
        data: {
          errorId: recommendation.errorId,
          title: recommendation.title,
          description: recommendation.description,
          codeExample: recommendation.codeExample,
          confidence: recommendation.confidence,
          source: recommendation.source,
          relevanceScore: recommendation.relevanceScore
        }
      });
    }
  }
}

export default new SolutionRecommenderService(); 