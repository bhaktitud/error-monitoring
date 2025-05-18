declare module 'ml-knn' {
  export default class KNN {
    constructor(dataset: number[][], labels: number[], options?: { k?: number });
    
    predict(dataset: number[][]): number[];
    
    toJSON(): any;
    
    static load(model: any): KNN;
  }
} 