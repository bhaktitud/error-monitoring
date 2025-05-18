/**
 * Tipe error yang didukung sistem
 */
export enum ErrorType {
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
  DEPENDENCY_ERROR = 'DEPENDENCY_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  API_ERROR = 'API_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Informasi konteks error
 */
export interface ErrorContext {
  framework?: string;
  library?: string;
  version?: string;
  environment?: string;
  browser?: string;
  os?: string;
  code?: string;
  variables?: Record<string, any>;
}

/**
 * Rekomendasi solusi untuk error
 */
export interface SolutionRecommendation {
  id: string;
  errorId: string;
  title: string;
  description: string;
  codeExample: string;
  confidence: number;
  source: 'knowledge_base' | 'generic' | 'ml' | 'user_feedback';
  relevanceScore: number;
  createdAt: Date;
}

/**
 * Model error lengkap dengan konteks dan stack trace
 */
export interface ErrorModel {
  id: string;
  type: ErrorType;
  message: string;
  location?: {
    file?: string;
    lineNumber?: number;
    columnNumber?: number;
  };
  stackTrace?: StackTraceItem[];
  context?: ErrorContext;
  rootCauseAnalysis?: RootCauseAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Item stack trace
 */
export interface StackTraceItem {
  id: string;
  errorId: string;
  functionName: string;
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
  isNative?: boolean;
  order: number;
}

/**
 * Analisis root cause
 */
export interface RootCauseAnalysis {
  id: string;
  errorId: string;
  rootCause: string;
  confidence: number;
  analysisDetails: string;
  createdAt: Date;
} 