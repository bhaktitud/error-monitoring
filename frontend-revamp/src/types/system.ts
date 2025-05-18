/**
 * Interface untuk kondisi sistem
 */
export interface SystemCondition {
  name: string;
  value: string | number | boolean;
  count: number;
  percentage: number;
  errorCount: number;
}

/**
 * Interface untuk grup kondisi sistem
 */
export interface SystemConditionGroup {
  name: string;
  conditions: SystemCondition[];
  totalEvents: number;
}

/**
 * Interface untuk data konteks sistem lengkap
 */
export interface SystemContextData {
  browserData: SystemConditionGroup;
  osData: SystemConditionGroup;
  deviceData: SystemConditionGroup;
  methodData: SystemConditionGroup;
  statusCodeData: SystemConditionGroup;
  pathData: SystemConditionGroup;
  correlations: Array<{ 
    condition: string; 
    value: string; 
    errorRate: number; 
    confidence: number 
  }>;
  recommendations: Array<{ 
    factor: string; 
    explanation: string 
  }>;
} 