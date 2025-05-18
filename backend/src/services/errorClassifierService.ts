import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { 
  ErrorDataItem, 
  extractErrorFeatures, 
  featuresToArray, 
  createFeatureMap, 
  createLabelMap,
  labelToIndex,
  indexToLabel,
  generateTrainingDataset
} from '../utils/datasetGenerator';

// Path penyimpanan model
const MODEL_DIR = path.join(__dirname, '../../models');
const MODEL_PATH = path.join(MODEL_DIR, 'error_classifier');
const FEATURE_MAP_PATH = path.join(MODEL_DIR, 'feature_map.json');
const LABEL_MAP_PATH = path.join(MODEL_DIR, 'label_map.json');

/**
 * Class untuk ErrorClassifier menggunakan TensorFlow.js
 */
export class ErrorClassifier {
  private model: tf.Sequential | null = null;
  private featureMap: Map<string, number> = new Map();
  private labelMap: Map<string, number> = new Map();
  private isModelLoaded = false;

  /**
   * Cek apakah model sudah dilatih
   */
  async isModelTrained(): Promise<boolean> {
    try {
      return fs.existsSync(MODEL_PATH);
    } catch (error) {
      console.error('Error checking model existence:', error);
      return false;
    }
  }

  /**
   * Muat model dari disk jika ada
   */
  async loadModel(): Promise<boolean> {
    try {
      // Cek apakah direktori 'models' ada
      if (!fs.existsSync(MODEL_DIR)) {
        console.log('Models directory does not exist');
        return false;
      }

      // Cek apakah model tersimpan ada
      if (!fs.existsSync(MODEL_PATH)) {
        console.log('Model does not exist');
        return false;
      }

      // Muat model
      try {
        this.model = await tf.loadLayersModel(`file://${MODEL_PATH}/model.json`) as tf.Sequential;
        console.log('Model loaded successfully');
      } catch (loadError) {
        console.error('Error loading model:', loadError);
        return false;
      }

      // Muat feature map
      if (fs.existsSync(FEATURE_MAP_PATH)) {
        const featureMapData = JSON.parse(fs.readFileSync(FEATURE_MAP_PATH, 'utf-8'));
        this.featureMap = new Map(Object.entries(featureMapData));
        console.log('Feature map loaded successfully');
      } else {
        console.log('Feature map does not exist');
        return false;
      }

      // Muat label map
      if (fs.existsSync(LABEL_MAP_PATH)) {
        const labelMapData = JSON.parse(fs.readFileSync(LABEL_MAP_PATH, 'utf-8'));
        this.labelMap = new Map(Object.entries(labelMapData));
        console.log('Label map loaded successfully');
      } else {
        console.log('Label map does not exist');
        return false;
      }

      this.isModelLoaded = true;
      return true;
    } catch (error) {
      console.error('Error loading model:', error);
      return false;
    }
  }

  /**
   * Simpan model, feature map, dan label map ke disk
   */
  private async saveModel(): Promise<void> {
    // Buat direktori jika belum ada
    if (!fs.existsSync(MODEL_DIR)) {
      fs.mkdirSync(MODEL_DIR, { recursive: true });
    }

    // Simpan model
    await this.model!.save(`file://${MODEL_PATH}`);
    console.log('Model saved to:', MODEL_PATH);

    // Simpan feature map sebagai JSON
    const featureMapObj = Object.fromEntries(this.featureMap);
    fs.writeFileSync(FEATURE_MAP_PATH, JSON.stringify(featureMapObj, null, 2));
    console.log('Feature map saved to:', FEATURE_MAP_PATH);

    // Simpan label map sebagai JSON
    const labelMapObj = Object.fromEntries(this.labelMap);
    fs.writeFileSync(LABEL_MAP_PATH, JSON.stringify(labelMapObj, null, 2));
    console.log('Label map saved to:', LABEL_MAP_PATH);
  }

  /**
   * Buat dan latih model
   */
  async trainModel(dataset?: ErrorDataItem[]): Promise<void> {
    try {
      // Jika dataset tidak diberikan, ambil dari database
      if (!dataset) {
        dataset = await generateTrainingDataset();
      }

      // Cek apakah dataset cukup untuk melatih model
      if (dataset.length < 10) {
        throw new Error('Dataset terlalu kecil untuk melatih model, minimal dibutuhkan 10 item');
      }

      console.log(`Training model with ${dataset.length} samples`);

      // Buat feature map dan label map
      this.featureMap = createFeatureMap(dataset);
      this.labelMap = createLabelMap(dataset);

      console.log(`Feature map size: ${this.featureMap.size}`);
      console.log(`Label map size: ${this.labelMap.size}`);

      // Ekstrak fitur dan label
      const features: number[][] = [];
      const labels: number[] = [];

      for (const item of dataset) {
        const itemFeatures = extractErrorFeatures(item);
        const featureArray = featuresToArray(itemFeatures, this.featureMap);
        features.push(featureArray);
        
        const labelIndex = labelToIndex(item.probableCause, this.labelMap);
        labels.push(labelIndex);
      }

      // Siapkan data training
      const xs = tf.tensor2d(features);
      const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), this.labelMap.size);

      // Buat model sequential baru
      this.model = tf.sequential();
      
      // Input layer
      this.model.add(tf.layers.dense({
        inputShape: [this.featureMap.size],
        units: 128,
        activation: 'relu'
      }));
      
      // Dropout layer untuk mencegah overfitting
      this.model.add(tf.layers.dropout({ rate: 0.5 }));
      
      // Hidden layer
      this.model.add(tf.layers.dense({
        units: 64,
        activation: 'relu'
      }));
      
      // Dropout layer
      this.model.add(tf.layers.dropout({ rate: 0.3 }));
      
      // Output layer
      this.model.add(tf.layers.dense({
        units: this.labelMap.size,
        activation: 'softmax'
      }));

      // Compile model
      this.model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      // Latih model
      await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(
              `Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc.toFixed(4)}, ` +
              `val_loss = ${logs?.val_loss.toFixed(4)}, val_accuracy = ${logs?.val_acc.toFixed(4)}`
            );
          }
        }
      });

      // Simpan model
      await this.saveModel();
      
      // Bebaskan memori yang digunakan
      xs.dispose();
      ys.dispose();

      this.isModelLoaded = true;
      console.log('Training completed and model saved');
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }

  /**
   * Prediksi kelas dari error
   */
  async predict(item: ErrorDataItem): Promise<Array<{ cause: string; probability: number }>> {
    if (!this.isModelLoaded) {
      const loaded = await this.loadModel();
      if (!loaded) {
        throw new Error('Model belum dilatih atau gagal dimuat');
      }
    }

    try {
      // Ekstrak fitur
      const features = extractErrorFeatures(item);
      const featureArray = featuresToArray(features, this.featureMap);
      
      // Konversi ke tensor
      const input = tf.tensor2d([featureArray]);
      
      // Lakukan prediksi
      const predictions = this.model!.predict(input) as tf.Tensor;
      
      // Ubah hasil prediksi ke array
      const predictionData = await predictions.data();
      
      // Buat array hasil
      const result: Array<{ cause: string; probability: number }> = [];
      
      // Susun hasilnya ke bentuk yang kita butuhkan
      for (let i = 0; i < predictionData.length; i++) {
        const label = indexToLabel(i, this.labelMap);
        result.push({
          cause: label,
          probability: predictionData[i]
        });
      }
      
      // Bebaskan memori
      input.dispose();
      predictions.dispose();
      
      // Urutkan berdasarkan probabilitas tertinggi
      return result.sort((a, b) => b.probability - a.probability);
    } catch (error) {
      console.error('Error predicting:', error);
      throw error;
    }
  }

  /**
   * Evaluasi model dengan data testing
   */
  async evaluateModel(testData: ErrorDataItem[]): Promise<{ accuracy: number; confusionMatrix: number[][] }> {
    if (!this.isModelLoaded) {
      const loaded = await this.loadModel();
      if (!loaded) {
        throw new Error('Model belum dilatih atau gagal dimuat');
      }
    }
    
    try {
      // Siapkan data test
      const testFeatures: number[][] = [];
      const testLabels: number[] = [];
      
      for (const item of testData) {
        const itemFeatures = extractErrorFeatures(item);
        const featureArray = featuresToArray(itemFeatures, this.featureMap);
        testFeatures.push(featureArray);
        
        const labelIndex = labelToIndex(item.probableCause, this.labelMap);
        testLabels.push(labelIndex);
      }
      
      // Konversi ke tensor
      const xs = tf.tensor2d(testFeatures);
      const ys = tf.oneHot(tf.tensor1d(testLabels, 'int32'), this.labelMap.size);
      
      // Evaluasi model
      const result = await this.model!.evaluate(xs, ys) as tf.Tensor[];
      const loss = result[0].dataSync()[0];
      const accuracy = result[1].dataSync()[0];
      
      console.log(`Evaluation - Loss: ${loss.toFixed(4)}, Accuracy: ${accuracy.toFixed(4)}`);
      
      // Buat confusion matrix
      const confusionMatrix: number[][] = Array(this.labelMap.size)
        .fill(0)
        .map(() => Array(this.labelMap.size).fill(0));
      
      // Prediksi untuk tiap item
      const predictions = this.model!.predict(xs) as tf.Tensor;
      const predictionArray = await predictions.argMax(1).dataSync();
      
      // Isi confusion matrix
      for (let i = 0; i < testLabels.length; i++) {
        const trueLabel = testLabels[i];
        const predLabel = predictionArray[i];
        confusionMatrix[trueLabel][predLabel]++;
      }
      
      // Bebaskan memori
      xs.dispose();
      ys.dispose();
      predictions.dispose();
      result.forEach(t => t.dispose());
      
      return {
        accuracy,
        confusionMatrix
      };
    } catch (error) {
      console.error('Error evaluating model:', error);
      throw error;
    }
  }
}

// Singleton instance
export const errorClassifier = new ErrorClassifier();