import prisma from '../models/prisma';
import { parseStackTrace } from './stackTraceParser';

// Tipe data untuk item dalam dataset
export interface ErrorDataItem {
  id: string;
  errorType: string;
  message: string;
  stacktraceText: string;
  stackFrames: Array<{
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
    functionName?: string;
  }>;
  browser?: string;
  os?: string;
  statusCode?: number;
  environment?: string;
  // probableCause adalah label yang kita gunakan untuk klasifikasi
  probableCause: string;
}

/**
 * Fungsi untuk mengekstrak fitur dari sebuah error
 */
export function extractErrorFeatures(item: ErrorDataItem): Record<string, number> {
  const features: Record<string, number> = {};
  
  // Fitur dari tipe error
  features['errorType_' + item.errorType] = 1;
  
  // Fitur dari status code (jika ada)
  if (item.statusCode) {
    features['statusCode_' + item.statusCode] = 1;
  }
  
  // Fitur dari browser (jika ada)
  if (item.browser) {
    features['browser_' + item.browser] = 1;
  }
  
  // Fitur dari OS (jika ada)
  if (item.os) {
    features['os_' + item.os] = 1;
  }
  
  // Fitur dari environment (jika ada)
  if (item.environment) {
    features['env_' + item.environment] = 1;
  }
  
  // Ekstrak kata kunci dari pesan error
  const messageWords = item.message
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  for (const word of messageWords) {
    features['msg_' + word] = (features['msg_' + word] || 0) + 1;
  }
  
  // Ekstrak kata kunci dari stack trace, fokus pada nama file dan fungsi
  for (const frame of item.stackFrames) {
    if (frame.fileName) {
      const filenameParts = frame.fileName.split('/');
      const filename = filenameParts[filenameParts.length - 1];
      features['file_' + filename] = (features['file_' + filename] || 0) + 1;
    }
    
    if (frame.functionName) {
      features['func_' + frame.functionName] = (features['func_' + frame.functionName] || 0) + 1;
    }
  }
  
  return features;
}

/**
 * Fungsi untuk mengonversi fitur menjadi array tensor yang dapat digunakan TensorFlow
 */
export function featuresToArray(features: Record<string, number>, featureMap: Map<string, number>): number[] {
  const featureArray = new Array(featureMap.size).fill(0);
  
  for (const [feature, value] of Object.entries(features)) {
    if (featureMap.has(feature)) {
      featureArray[featureMap.get(feature)!] = value;
    }
  }
  
  return featureArray;
}

/**
 * Fungsi untuk mengambil dataset dari errorGroup dan rootCauseAnalysis yang sudah ada
 */
export async function generateTrainingDataset(): Promise<ErrorDataItem[]> {
  // Ambil semua RootCauseAnalysis yang sudah selesai
  const analyses = await prisma.rootCauseAnalysis.findMany({
    where: {
      status: 'completed',
      // Hanya ambil analisis yang memiliki probableCauses
      probableCauses: {
        not: '[]'
      }
    },
    include: {
      event: true,
      errorGroup: true
    }
  });
  
  const dataset: ErrorDataItem[] = [];
  
  for (const analysis of analyses) {
    try {
      const probableCauses = JSON.parse(analysis.probableCauses as string) as Array<{
        cause: string;
        probability: number;
      }>;
      
      // Skip jika tidak ada probable cause
      if (!probableCauses || probableCauses.length === 0) continue;
      
      // Ambil cause dengan probability tertinggi
      const topCause = probableCauses.reduce((prev, current) => 
        (prev.probability > current.probability) ? prev : current
      );
      
      // Skip jika probabilitasnya rendah (<0.5)
      if (topCause.probability < 0.5) continue;
      
      // Parse stacktrace
      const stackFrames = analysis.event.stacktrace 
        ? parseStackTrace(analysis.event.stacktrace)
        : [];
      
      // Buat item dataset
      const dataItem: ErrorDataItem = {
        id: analysis.eventId,
        errorType: analysis.event.errorType,
        message: analysis.event.message,
        stacktraceText: analysis.event.stacktrace || '',
        stackFrames,
        browser: analysis.event.browser || undefined,
        os: analysis.event.os || undefined,
        statusCode: analysis.event.statusCode || undefined,
        environment: analysis.event.environment || undefined,
        probableCause: topCause.cause
      };
      
      dataset.push(dataItem);
    } catch (error) {
      console.error('Error processing analysis:', error);
      continue;
    }
  }
  
  return dataset;
}

/**
 * Fungsi untuk membuat peta fitur
 */
export function createFeatureMap(dataset: ErrorDataItem[]): Map<string, number> {
  const featureSet = new Set<string>();
  
  // Kumpulkan semua fitur yang mungkin
  for (const item of dataset) {
    const features = extractErrorFeatures(item);
    for (const feature of Object.keys(features)) {
      featureSet.add(feature);
    }
  }
  
  // Buat peta fitur ke indeks
  const featureMap = new Map<string, number>();
  Array.from(featureSet).forEach((feature, index) => {
    featureMap.set(feature, index);
  });
  
  return featureMap;
}

/**
 * Fungsi untuk membuat peta label
 */
export function createLabelMap(dataset: ErrorDataItem[]): Map<string, number> {
  const labelSet = new Set<string>();
  
  // Kumpulkan semua label yang mungkin
  for (const item of dataset) {
    labelSet.add(item.probableCause);
  }
  
  // Buat peta label ke indeks
  const labelMap = new Map<string, number>();
  Array.from(labelSet).forEach((label, index) => {
    labelMap.set(label, index);
  });
  
  return labelMap;
}

/**
 * Fungsi untuk mengonversi label menjadi indeks
 */
export function labelToIndex(label: string, labelMap: Map<string, number>): number {
  return labelMap.get(label) || 0;
}

/**
 * Fungsi untuk mengonversi indeks menjadi label
 */
export function indexToLabel(index: number, labelMap: Map<string, number>): string {
  const reversedMap = new Map(Array.from(labelMap.entries()).map(([key, value]) => [value, key]));
  return reversedMap.get(index) || 'unknown';
} 