declare module 'ml-kmeans' {
  export function kmeans(
    dataset: number[][],
    clusters: number,
    options?: {
      seed?: number;
      maxIterations?: number;
      tolerance?: number;
      withIterations?: boolean;
      initialization?: 'random' | 'kmeans++';
      distanceFunction?: (a: number[], b: number[]) => number;
    }
  ): {
    clusters: number[];
    centroids: number[][];
    iterations: number;
    converged: boolean;
  };
} 