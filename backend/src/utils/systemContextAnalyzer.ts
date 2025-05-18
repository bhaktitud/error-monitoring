import prisma from '../models/prisma';
import { subDays } from 'date-fns';

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
 * Interface untuk data jaringan
 */
export interface NetworkData {
  method: string;
  statusCode: number | null;
  path: string | null;
  query: Record<string, any> | null;
  params: Record<string, any> | null;
  headers: Record<string, any> | null;
}

/**
 * Interface untuk data browser/device
 */
export interface BrowserDeviceData {
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  deviceType: string | null;
  screenSize: string | null;
  language: string | null;
}

/**
 * Class untuk menganalisis konteks sistem saat error terjadi
 */
export class SystemContextAnalyzer {
  /**
   * Ekstrak dan analisis data browser/OS/device untuk project tertentu
   * @param projectId ID project
   * @param timeframe Jangka waktu dalam hari (default: 7)
   * @param limit Batas jumlah hasil (default: 10)
   */
  async analyzeBrowserDeviceData(
    projectId: string,
    timeframe: number = 7,
    limit: number = 10
  ): Promise<{
    browserData: SystemConditionGroup;
    osData: SystemConditionGroup;
    deviceData: SystemConditionGroup;
  }> {
    const startDate = subDays(new Date(), timeframe);

    // Ambil semua event dalam jangka waktu tertentu
    const events = await prisma.event.findMany({
      where: {
        projectId,
        timestamp: {
          gte: startDate
        }
      },
      select: {
        browser: true,
        browserVersion: true,
        os: true,
        osVersion: true,
        deviceType: true,
        screenSize: true,
        language: true
      }
    });

    const totalEvents = events.length;

    // Analisis browser
    const browsers: Record<string, number> = {};
    events.forEach(event => {
      const browser = event.browser || 'unknown';
      browsers[browser] = (browsers[browser] || 0) + 1;
    });

    // Analisis OS
    const operatingSystems: Record<string, number> = {};
    events.forEach(event => {
      const os = event.os || 'unknown';
      operatingSystems[os] = (operatingSystems[os] || 0) + 1;
    });

    // Analisis device type
    const deviceTypes: Record<string, number> = {};
    events.forEach(event => {
      const deviceType = event.deviceType || 'unknown';
      deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;
    });

    // Hitung error untuk setiap browser
    const browserErrors = await this.getErrorCountByCondition(projectId, 'browser', startDate);
    const osErrors = await this.getErrorCountByCondition(projectId, 'os', startDate);
    const deviceErrors = await this.getErrorCountByCondition(projectId, 'deviceType', startDate);

    // Format hasil browser
    const browserData: SystemConditionGroup = {
      name: 'Browser',
      conditions: Object.entries(browsers)
        .map(([name, count]) => ({
          name,
          value: name,
          count,
          percentage: (count / totalEvents) * 100,
          errorCount: browserErrors[name] || 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit),
      totalEvents
    };

    // Format hasil OS
    const osData: SystemConditionGroup = {
      name: 'Operating System',
      conditions: Object.entries(operatingSystems)
        .map(([name, count]) => ({
          name,
          value: name,
          count,
          percentage: (count / totalEvents) * 100,
          errorCount: osErrors[name] || 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit),
      totalEvents
    };

    // Format hasil device
    const deviceData: SystemConditionGroup = {
      name: 'Device Type',
      conditions: Object.entries(deviceTypes)
        .map(([name, count]) => ({
          name,
          value: name,
          count,
          percentage: (count / totalEvents) * 100,
          errorCount: deviceErrors[name] || 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit),
      totalEvents
    };

    return { browserData, osData, deviceData };
  }

  /**
   * Analisis data jaringan dan request yang terkait dengan error
   * @param projectId ID project
   * @param timeframe Jangka waktu dalam hari (default: 7)
   * @param limit Batas jumlah hasil (default: 10)
   */
  async analyzeNetworkData(
    projectId: string,
    timeframe: number = 7,
    limit: number = 10
  ): Promise<{
    methodData: SystemConditionGroup;
    statusCodeData: SystemConditionGroup;
    pathData: SystemConditionGroup;
  }> {
    const startDate = subDays(new Date(), timeframe);

    // Ambil semua event dalam jangka waktu tertentu
    const events = await prisma.event.findMany({
      where: {
        projectId,
        timestamp: {
          gte: startDate
        }
      },
      select: {
        method: true,
        statusCode: true,
        path: true,
        query: true,
        params: true,
        headers: true
      }
    });

    const totalEvents = events.length;

    // Analisis method
    const methods: Record<string, number> = {};
    events.forEach(event => {
      const method = event.method || 'unknown';
      methods[method] = (methods[method] || 0) + 1;
    });

    // Analisis status code
    const statusCodes: Record<string, number> = {};
    events.forEach(event => {
      const statusCode = event.statusCode ? event.statusCode.toString() : 'unknown';
      statusCodes[statusCode] = (statusCodes[statusCode] || 0) + 1;
    });

    // Analisis path
    const paths: Record<string, number> = {};
    events.forEach(event => {
      const path = event.path || 'unknown';
      paths[path] = (paths[path] || 0) + 1;
    });

    // Hitung error untuk setiap kondisi
    const methodErrors = await this.getErrorCountByCondition(projectId, 'method', startDate);
    const statusErrors = await this.getErrorCountByCondition(projectId, 'statusCode', startDate);
    const pathErrors = await this.getErrorCountByCondition(projectId, 'path', startDate);

    // Format hasil method
    const methodData: SystemConditionGroup = {
      name: 'HTTP Method',
      conditions: Object.entries(methods)
        .map(([name, count]) => ({
          name,
          value: name,
          count,
          percentage: (count / totalEvents) * 100,
          errorCount: methodErrors[name] || 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit),
      totalEvents
    };

    // Format hasil status code
    const statusCodeData: SystemConditionGroup = {
      name: 'Status Code',
      conditions: Object.entries(statusCodes)
        .map(([name, count]) => ({
          name,
          value: parseInt(name) || 0,
          count,
          percentage: (count / totalEvents) * 100,
          errorCount: statusErrors[name] || 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit),
      totalEvents
    };

    // Format hasil path
    const pathData: SystemConditionGroup = {
      name: 'Path',
      conditions: Object.entries(paths)
        .map(([name, count]) => ({
          name,
          value: name,
          count,
          percentage: (count / totalEvents) * 100,
          errorCount: pathErrors[name] || 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit),
      totalEvents
    };

    return { methodData, statusCodeData, pathData };
  }

  /**
   * Identifikasi pola kondisi lingkungan yang menyebabkan error
   * @param projectId ID project
   * @param errorGroupId ID group error (optional)
   * @param timeframe Jangka waktu dalam hari (default: 7)
   */
  async identifyErrorPatterns(
    projectId: string,
    errorGroupId?: string,
    timeframe: number = 7
  ): Promise<{
    environmentPatterns: Record<string, any>;
    correlations: Array<{ condition: string; value: string; errorRate: number; confidence: number }>;
    recommendations: Array<{ factor: string; explanation: string }>;
  }> {
    const startDate = subDays(new Date(), timeframe);

    // Query parameter untuk filter
    const whereCondition = errorGroupId
      ? {
          projectId,
          timestamp: { gte: startDate },
          groupId: errorGroupId
        }
      : {
          projectId,
          timestamp: { gte: startDate }
        };

    // Ambil data untuk analisis pola
    const events = await prisma.event.findMany({
      where: whereCondition,
      select: {
        browser: true,
        browserVersion: true,
        os: true,
        osVersion: true,
        deviceType: true,
        method: true,
        statusCode: true,
        path: true,
        groupId: true,
        environment: true,
        release: true
      }
    });

    // Hitung total event dan event yang error
    const totalEvents = events.length;
    
    // Jika tidak ada data, return pattern kosong
    if (totalEvents === 0) {
      return {
        environmentPatterns: {},
        correlations: [],
        recommendations: []
      };
    }

    // Analisis kondisi lingkungan
    const patterns: Record<string, any> = {};
    
    // Fungsi untuk menganalisis satu faktor
    const analyzeFactor = (factorName: string, accessor: (event: any) => string | null) => {
      const factorCounts: Record<string, { total: number; errorCount: number }> = {};
      
      events.forEach(event => {
        const value = accessor(event) || 'unknown';
        
        if (!factorCounts[value]) {
          factorCounts[value] = { total: 0, errorCount: 0 };
        }
        
        factorCounts[value].total += 1;
        
        // Jika event memiliki groupId, hitung sebagai error
        if (event.groupId) {
          factorCounts[value].errorCount += 1;
        }
      });
      
      return factorCounts;
    };
    
    // Analisis berbagai faktor
    patterns.browser = analyzeFactor('browser', e => e.browser);
    patterns.os = analyzeFactor('os', e => e.os);
    patterns.deviceType = analyzeFactor('deviceType', e => e.deviceType);
    patterns.method = analyzeFactor('method', e => e.method);
    patterns.statusCode = analyzeFactor('statusCode', e => e.statusCode?.toString());
    patterns.environment = analyzeFactor('environment', e => e.environment);
    patterns.release = analyzeFactor('release', e => e.release);
    
    // Hitung korelasi
    const correlations: Array<{ condition: string; value: string; errorRate: number; confidence: number }> = [];
    
    // Fungsi untuk menghitung korelasi untuk satu faktor
    const calculateCorrelations = (
      factorName: string,
      factorData: Record<string, { total: number; errorCount: number }>
    ) => {
      Object.entries(factorData).forEach(([value, { total, errorCount }]) => {
        // Hanya faktor dengan minimal 5 event yang dipertimbangkan
        if (total >= 5) {
          const errorRate = (errorCount / total) * 100;
          const sampleConfidence = Math.min(100, (total / totalEvents) * 100);
          
          correlations.push({
            condition: factorName,
            value,
            errorRate,
            confidence: sampleConfidence
          });
        }
      });
    };
    
    // Hitung korelasi untuk semua faktor
    Object.entries(patterns).forEach(([factorName, factorData]) => {
      calculateCorrelations(factorName, factorData);
    });
    
    // Urutkan korelasi berdasarkan error rate
    correlations.sort((a, b) => b.errorRate - a.errorRate);
    
    // Buat rekomendasi
    const recommendations = correlations
      .filter(correlation => correlation.errorRate > 50 && correlation.confidence > 20)
      .map(correlation => ({
        factor: `${correlation.condition}: ${correlation.value}`,
        explanation: `Error rate tinggi (${correlation.errorRate.toFixed(1)}%) dalam kondisi ini dengan confidence ${correlation.confidence.toFixed(1)}%`
      }));
    
    return {
      environmentPatterns: patterns,
      correlations: correlations.slice(0, 10),
      recommendations: recommendations.slice(0, 5)
    };
  }

  /**
   * Helper method untuk mendapatkan jumlah error untuk setiap kondisi
   */
  private async getErrorCountByCondition(
    projectId: string,
    conditionField: string,
    startDate: Date
  ): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    
    // Ambil event yang memiliki groupId (merupakan error)
    const errorEvents = await prisma.event.findMany({
      where: {
        projectId,
        timestamp: {
          gte: startDate
        },
        NOT: {
          groupId: null
        }
      },
      select: {
        [conditionField]: true
      }
    });
    
    // Hitung jumlah error untuk setiap nilai kondisi
    errorEvents.forEach(event => {
      const value = (event as any)[conditionField] || 'unknown';
      result[value] = (result[value] || 0) + 1;
    });
    
    return result;
  }

  /**
   * Mendapatkan filter error berdasarkan kondisi sistem
   * @param projectId ID project
   * @param conditions Kondisi untuk filter
   */
  async getFilteredErrors(
    projectId: string,
    conditions: Record<string, string | number>
  ) {
    const whereConditions: any = {
      projectId,
    };
    
    // Tambahkan setiap kondisi ke where clause
    Object.entries(conditions).forEach(([key, value]) => {
      whereConditions[key] = value;
    });
    
    // Query event dengan kondisi tersebut
    const events = await prisma.event.findMany({
      where: whereConditions,
      include: {
        group: {
          select: {
            id: true,
            errorType: true,
            message: true,
            status: true,
            count: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 50
    });
    
    // Kelompokkan error berdasarkan groupId
    const groupedErrors: Record<string, any> = {};
    
    events.forEach(event => {
      if (event.group) {
        if (!groupedErrors[event.group.id]) {
          groupedErrors[event.group.id] = {
            ...event.group,
            events: []
          };
        }
        
        groupedErrors[event.group.id].events.push(event);
      }
    });
    
    return Object.values(groupedErrors);
  }
} 