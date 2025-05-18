import prisma from '../models/prisma';
import { parseStackTrace } from '../utils/stackTraceParser';
import { ErrorDataItem } from '../utils/datasetGenerator';
import { errorClassifier } from './errorClassifierService';

/**
 * Struktur hasil prediksi penyebab error
 */
export interface ErrorPredictionResult {
  eventId: string;
  groupId?: string;
  probableCauses: Array<{
    cause: string;
    probability: number;
    explanation?: string;
  }>;
  predictionTime: number;
  modelVersion: string;
  createdAt: Date;
}

/**
 * Melakukan prediksi penyebab error berdasarkan data event
 */
export async function predictErrorCause(eventId: string): Promise<ErrorPredictionResult> {
  const startTime = Date.now();
  
  try {
    // Ambil data event
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Event tidak ditemukan');
    }

    // Cek apakah model sudah dilatih
    const isModelTrained = await errorClassifier.isModelTrained();
    if (!isModelTrained) {
      throw new Error('Model belum dilatih, harap latih model terlebih dahulu');
    }

    // Parse stacktrace menjadi frame-frame
    const stackFrames = event.stacktrace ? parseStackTrace(event.stacktrace) : [];

    // Buat data item untuk prediksi
    const dataItem: ErrorDataItem = {
      id: event.id,
      errorType: event.errorType,
      message: event.message,
      stacktraceText: event.stacktrace || '',
      stackFrames,
      browser: event.browser || undefined,
      os: event.os || undefined,
      statusCode: event.statusCode || undefined,
      environment: event.environment || undefined,
      probableCause: '' // Tidak digunakan untuk prediksi
    };

    // Lakukan prediksi menggunakan model
    const predictions = await errorClassifier.predict(dataItem);

    // Tambahkan penjelasan untuk penyebab yang paling mungkin
    const results = predictions.slice(0, 5).map(prediction => {
      return {
        cause: prediction.cause,
        probability: prediction.probability,
        explanation: generateExplanation(prediction.cause, event)
      };
    });

    // Simpan hasil prediksi ke database
    const predictionResult = await prisma.errorPrediction.create({
      data: {
        eventId: event.id,
        groupId: event.groupId || undefined,
        probableCauses: JSON.stringify(results),
        predictionTime: Date.now() - startTime,
        modelVersion: '1.0.0'
      }
    });

    return {
      eventId: predictionResult.eventId,
      groupId: predictionResult.groupId || undefined,
      probableCauses: results,
      predictionTime: predictionResult.predictionTime,
      modelVersion: predictionResult.modelVersion,
      createdAt: predictionResult.createdAt
    };
  } catch (error) {
    console.error('Error predicting error cause:', error);
    throw error;
  }
}

/**
 * Latih model error predictor
 */
export async function trainErrorPredictor(): Promise<{ success: boolean; message: string; stats?: any }> {
  try {
    // Latih model dengan dataset dari database
    await errorClassifier.trainModel();
    
    return {
      success: true,
      message: 'Model berhasil dilatih'
    };
  } catch (error) {
    console.error('Error training error predictor:', error);
    return {
      success: false,
      message: `Gagal melatih model: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Evaluasi model error predictor
 */
export async function evaluateErrorPredictor(testDataPercentage: number = 0.2): Promise<{ 
  success: boolean; 
  message: string; 
  metrics?: { 
    accuracy: number; 
    confusionMatrix: number[][] 
  } 
}> {
  try {
    // Ambil data dari database
    const dataset = await import('../utils/datasetGenerator').then(
      module => module.generateTrainingDataset()
    );
    
    // Cek apakah dataset cukup
    if (dataset.length < 10) {
      return {
        success: false,
        message: 'Dataset terlalu kecil untuk evaluasi, minimal dibutuhkan 10 item'
      };
    }
    
    // Bagi dataset menjadi data training dan testing
    const shuffle = [...dataset].sort(() => Math.random() - 0.5);
    const testCount = Math.floor(dataset.length * testDataPercentage);
    const testData = shuffle.slice(0, testCount);
    const trainData = shuffle.slice(testCount);
    
    // Latih model dengan data training
    await errorClassifier.trainModel(trainData);
    
    // Evaluasi model dengan data testing
    const metrics = await errorClassifier.evaluateModel(testData);
    
    return {
      success: true,
      message: `Model berhasil dievaluasi dengan akurasi ${(metrics.accuracy * 100).toFixed(2)}%`,
      metrics
    };
  } catch (error) {
    console.error('Error evaluating error predictor:', error);
    return {
      success: false,
      message: `Gagal mengevaluasi model: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Prediksi penyebab error untuk error group
 */
export async function predictErrorGroupCause(groupId: string): Promise<ErrorPredictionResult> {
  try {
    // Ambil event terbaru dari group ini
    const latestEvent = await prisma.event.findFirst({
      where: { groupId },
      orderBy: { timestamp: 'desc' }
    });

    if (!latestEvent) {
      throw new Error('Tidak ada event ditemukan untuk group ini');
    }

    // Gunakan event terbaru untuk prediksi
    return predictErrorCause(latestEvent.id);
  } catch (error) {
    console.error('Error predicting group cause:', error);
    throw error;
  }
}

/**
 * Generate penjelasan untuk penyebab error berdasarkan jenis penyebab
 */
function generateExplanation(cause: string, event: any): string {
  // Daftar penjelasan template berdasarkan penyebab
  const explanationTemplates: Record<string, string> = {
    'NetworkError': 'Kesalahan ini terjadi karena masalah koneksi jaringan. Periksa konektivitas internet pengguna atau status layanan backend.',
    'ValidationError': 'Kesalahan ini terjadi karena input data tidak valid. Periksa validasi form atau parameter request yang dikirim.',
    'AuthenticationError': 'Kesalahan ini terjadi karena masalah otentikasi. Periksa token atau kredensial pengguna yang mungkin tidak valid atau kedaluwarsa.',
    'PermissionError': 'Kesalahan ini terjadi karena pengguna tidak memiliki izin yang cukup untuk mengakses resource yang diminta.',
    'DatabaseError': 'Kesalahan ini terjadi karena masalah dengan database. Periksa koneksi database atau query yang dijalankan.',
    'ResourceNotFound': 'Kesalahan ini terjadi karena resource yang diminta tidak ditemukan. Periksa ID atau path yang digunakan untuk mengakses resource.',
    'ServerError': 'Kesalahan ini terjadi karena masalah internal server. Periksa log server untuk informasi lebih lanjut.',
    'ClientError': 'Kesalahan ini terjadi karena masalah pada sisi client. Periksa kode JavaScript atau implementasi client.',
    'ExternalServiceError': 'Kesalahan ini terjadi karena layanan eksternal yang digunakan aplikasi mengalami gangguan. Periksa status layanan tersebut.',
    'MemoryError': 'Kesalahan ini terjadi karena aplikasi kehabisan memori. Periksa penggunaan memori atau memory leak dalam aplikasi.',
    'RenderingError': 'Kesalahan ini terjadi saat rendering UI. Periksa komponen atau template yang digunakan.',
    'SyntaxError': 'Kesalahan ini terjadi karena kesalahan sintaks dalam kode. Periksa syntax pada file yang terkait dengan error.'
  };

  // Jika ada template untuk penyebab ini, gunakan
  if (cause in explanationTemplates) {
    return explanationTemplates[cause];
  }

  // Template default jika tidak ada yang cocok
  return `Kemungkinan penyebab error adalah ${cause}. Periksa kode dan log untuk informasi lebih lanjut.`;
} 