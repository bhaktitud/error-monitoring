import * as tf from '@tensorflow/tfjs-node';
import { bertErrorAnalyzer } from '../src/services/bertErrorAnalyzerService';
import { advancedErrorPredictor } from '../src/services/advancedErrorPredictorService';
import { errorClusteringService } from '../src/services/errorClusteringService';
import { cacheService } from '../src/services/cacheService';
import prisma from '../src/models/prisma';
import { ErrorDataItem, generateTrainingDataset } from '../src/utils/datasetGenerator';
import { parseStackTrace } from '../src/utils/stackTraceParser';
import fs from 'fs';
import path from 'path';

/**
 * Script untuk menjalankan benchmark performa pada sistem RCA LogRaven
 * dengan berbagai beban untuk menguji kinerja dan skalabilitas
 */

interface PerformanceResult {
  // Request info
  requestsPerSecond: number;
  totalRequests: number;
  successfulRequests: number;
  
  // Latency metrics
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  maxLatency: number;
  minLatency: number;
  
  // Model metrics
  bertLatency: number;
  bertCachedLatency: number;
  ensembleLatency: number;
  ensembleCachedLatency: number;
  clusteringLatency: number;
  clusteringCachedLatency: number;
  
  // Resource usage
  memoryUsageMB: number;
  cpuUsage: number;
  
  // Cache performance
  cacheSize: number;
  cacheHitRate: number;
  
  // Timestamp
  timestamp: string;
}

async function getSampleErrors(count: number): Promise<ErrorDataItem[]> {
  // Ambil sample error dari database
  const events = await prisma.event.findMany({
    where: {
      stacktrace: {
        not: null
      }
    },
    take: count
  });
  
  return events.map(event => {
    const stackFrames = event.stacktrace ? parseStackTrace(event.stacktrace) : [];
    
    return {
      id: event.id,
      message: event.message,
      errorType: event.errorType,
      stacktrace: event.stacktrace || '',
      stacktraceText: event.stacktrace || '',
      stackFrames,
      browser: event.browser || '',
      os: event.os || '',
      url: event.url || '',
      userAgent: event.userAgent || '',
      probableCause: '',
      metadata: {}
    };
  });
}

async function benchmarkSingleError(item: ErrorDataItem, withCache: boolean = false): Promise<{
  bertTime: number;
  ensembleTime: number;
  clusteringTime: number;
  totalTime: number;
}> {
  // Clear cache if needed
  if (!withCache) {
    cacheService.clear();
  }
  
  // Benchmark BERT
  const bertStartTime = Date.now();
  await bertErrorAnalyzer.analyzeError(item);
  const bertTime = Date.now() - bertStartTime;
  
  // Benchmark Ensemble
  const ensembleStartTime = Date.now();
  await advancedErrorPredictor.predict(item);
  const ensembleTime = Date.now() - ensembleStartTime;
  
  // Benchmark Clustering
  const clusteringStartTime = Date.now();
  await errorClusteringService.clusterNewError(item);
  const clusteringTime = Date.now() - clusteringStartTime;
  
  return {
    bertTime,
    ensembleTime,
    clusteringTime,
    totalTime: bertTime + ensembleTime + clusteringTime
  };
}

async function runConcurrentBenchmark(
  items: ErrorDataItem[],
  concurrentRequests: number
): Promise<PerformanceResult> {
  console.log(`Running benchmark with ${concurrentRequests} concurrent requests...`);
  
  // Clear cache first
  cacheService.clear();
  
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  const cpuUsageStart = process.cpuUsage();
  const startTime = Date.now();
  
  // Create batches of concurrent requests
  const latencies: number[] = [];
  let successfulRequests = 0;
  
  // Process items in batches to simulate concurrent requests
  for (let i = 0; i < items.length; i += concurrentRequests) {
    const batch = items.slice(i, i + concurrentRequests);
    const batchStartTime = Date.now();
    
    // Run all requests in this batch concurrently
    const batchPromises = batch.map(async (item) => {
      const itemStartTime = Date.now();
      try {
        // Perform the complete analysis pipeline
        await bertErrorAnalyzer.analyzeError(item);
        await advancedErrorPredictor.predict(item);
        await errorClusteringService.clusterNewError(item);
        
        successfulRequests++;
        const itemLatency = Date.now() - itemStartTime;
        latencies.push(itemLatency);
        return itemLatency;
      } catch (error) {
        console.error(`Error processing item ${item.id}:`, error);
        return -1; // Mark as failed
      }
    });
    
    // Wait for all requests in this batch to complete
    await Promise.all(batchPromises);
    
    const batchTime = Date.now() - batchStartTime;
    console.log(`Batch ${i / concurrentRequests + 1} completed in ${batchTime}ms`);
  }
  
  const endTime = Date.now();
  const cpuUsageEnd = process.cpuUsage(cpuUsageStart);
  const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  
  // Calculate CPU usage as percentage
  const cpuUsagePercent = (cpuUsageEnd.user + cpuUsageEnd.system) / 1000 / ((endTime - startTime) / 10);
  
  // Sort latencies for percentile calculations
  latencies.sort((a, b) => a - b);
  
  // Get cache statistics
  const cacheStats = cacheService.getStats();
  
  // Calculate metrics
  const totalTime = endTime - startTime;
  const avgLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
  const p95Index = Math.floor(latencies.length * 0.95);
  const p99Index = Math.floor(latencies.length * 0.99);
  
  // Run a single benchmark with and without cache to get model-specific metrics
  const sampleItem = items[0];
  const noCacheBenchmark = await benchmarkSingleError(sampleItem, false);
  const withCacheBenchmark = await benchmarkSingleError(sampleItem, true);
  
  return {
    requestsPerSecond: (successfulRequests / totalTime) * 1000,
    totalRequests: items.length,
    successfulRequests,
    
    avgLatency,
    p95Latency: latencies[p95Index],
    p99Latency: latencies[p99Index],
    maxLatency: latencies[latencies.length - 1],
    minLatency: latencies[0],
    
    bertLatency: noCacheBenchmark.bertTime,
    bertCachedLatency: withCacheBenchmark.bertTime,
    ensembleLatency: noCacheBenchmark.ensembleTime,
    ensembleCachedLatency: withCacheBenchmark.ensembleTime,
    clusteringLatency: noCacheBenchmark.clusteringTime,
    clusteringCachedLatency: withCacheBenchmark.clusteringTime,
    
    memoryUsageMB: endMemory - startMemory,
    cpuUsage: cpuUsagePercent,
    
    cacheSize: cacheStats.keys,
    cacheHitRate: cacheStats.hitRate,
    
    timestamp: new Date().toISOString()
  };
}

async function saveResultsToFile(results: PerformanceResult[]): Promise<void> {
  const resultsDir = path.join(__dirname, '../benchmark_results');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const filename = path.join(resultsDir, `benchmark_${new Date().toISOString().replace(/:/g, '-')}.json`);
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${filename}`);
}

async function runBenchmark(): Promise<void> {
  try {
    console.log('Starting performance benchmark...');
    
    // Initialize models
    await bertErrorAnalyzer.loadModel();
    await advancedErrorPredictor.loadModel();
    await errorClusteringService.initialize();
    
    // Load sample errors for benchmarking
    const sampleItems = await getSampleErrors(100);
    
    if (sampleItems.length === 0) {
      console.error('No sample errors found for benchmarking');
      return;
    }
    
    console.log(`Loaded ${sampleItems.length} sample errors for benchmarking`);
    
    // Define different load scenarios
    const concurrencyLevels = [1, 5, 10, 20, 50];
    const results: PerformanceResult[] = [];
    
    // Run benchmark for each concurrency level
    for (const concurrency of concurrencyLevels) {
      console.log(`\n=== Running benchmark with ${concurrency} concurrent requests ===\n`);
      
      // Take a subset of items for this concurrency level
      const itemsToUse = sampleItems.slice(0, Math.min(concurrency * 10, sampleItems.length));
      
      const result = await runConcurrentBenchmark(itemsToUse, concurrency);
      results.push(result);
      
      console.log('\nResults:');
      console.log(`Requests/sec: ${result.requestsPerSecond.toFixed(2)}`);
      console.log(`Avg latency: ${result.avgLatency.toFixed(2)}ms`);
      console.log(`P95 latency: ${result.p95Latency}ms`);
      console.log(`Memory usage: ${result.memoryUsageMB.toFixed(2)}MB`);
      console.log(`Cache hit rate: ${(result.cacheHitRate * 100).toFixed(2)}%\n`);
      
      // Give some time for GC and to avoid overloading
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Save results to file
    await saveResultsToFile(results);
    
    console.log('Benchmark completed successfully!');
  } catch (error) {
    console.error('Error running benchmark:', error);
  } finally {
    // Clean up
    await prisma.$disconnect();
  }
}

// Run the benchmark
runBenchmark().catch(console.error); 