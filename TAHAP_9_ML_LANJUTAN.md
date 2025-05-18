# Tahap 9: Machine Learning Lanjutan

## Implementasi Model BERT untuk Analisis Error Message

File implementasi: `backend/src/services/bertErrorAnalyzerService.ts`

### Fitur:
- Menggunakan Universal Sentence Encoder (USE) dari TensorFlow.js sebagai model yang lebih ringan namun tetap menggunakan prinsip Transformer untuk embedding teks
- Mengekstrak embedding semantik dari pesan error dan stack trace
- Menghitung similaritas antar error berdasarkan representasi vektor
- Dapat menemukan error yang mirip secara semantik meskipun teksnya berbeda
- Memprediksi penyebab error berdasarkan error yang sudah ada dan mirip

### API Endpoints:
- `POST /api/ml/bert/train` - Melatih model BERT dengan dataset dari database
- `GET /api/ml/analyze/bert/:eventId` - Menganalisis error dengan model BERT

## Implementasi Model Ensemble untuk Prediksi Error yang Lebih Akurat

File implementasi: `backend/src/services/advancedErrorPredictorService.ts`

### Fitur:
- Menggabungkan beberapa model machine learning untuk hasil prediksi yang lebih akurat:
  1. Model TensorFlow dengan arsitektur neural network yang lebih kompleks
  2. Model KNN (K-Nearest Neighbors) untuk pattern matching berdasarkan fitur
  3. Model BERT untuk analisis semantik
- Memberikan bobot pada setiap model berdasarkan akurasi dan relevansi
- Menghitung confidence score berdasarkan tingkat konsensus antar model
- Menghasilkan metrik evaluasi yang lebih lengkap (akurasi, F1 score, confusion matrix)

### API Endpoints:
- `POST /api/ml/ensemble/train` - Melatih model ensemble
- `POST /api/ml/ensemble/evaluate` - Mengevaluasi performa model
- `GET /api/ml/analyze/ensemble/:eventId` - Menganalisis error dengan model ensemble

## Implementasi Algoritma Clustering untuk Pengelompokan Error

File implementasi: `backend/src/services/errorClusteringService.ts`

### Fitur:
- Menggunakan algoritma K-means untuk mengelompokkan error berdasarkan similaritas semantik
- Otomatis menentukan jumlah cluster optimal berdasarkan dataset
- Menggabungkan error berdasarkan kemiripan tipe, pesan, dan stack trace
- Menghasilkan deskripsi dan nama cluster yang bermakna secara otomatis
- Dapat menentukan cluster untuk error baru yang datang

### API Endpoints:
- `POST /api/ml/clustering/run` - Menjalankan proses clustering pada semua error
- `GET /api/ml/clusters` - Mendapatkan daftar semua cluster
- `GET /api/ml/clusters/:clusterId` - Mendapatkan detail cluster dan error yang terkait
- `GET /api/ml/cluster-error/:eventId` - Menentukan cluster untuk error baru

## Integrasi dengan Sistem

Semua fitur ML lanjutan ini terintegrasi dengan sistem utama melalui:
1. Controller `mlController.ts` yang mengatur alur logika bisnis
2. Routes `mlRoutes.ts` yang mendefinisikan endpoint API
3. Konfigurasi routes di `config/routes.ts` untuk menambahkan routes ke aplikasi

## Teknologi

- TensorFlow.js untuk deep learning
- Universal Sentence Encoder untuk embedding semantik
- K-means (ml-kmeans) untuk clustering
- KNN (ml-knn) untuk pattern matching
- Node.js dan Express untuk API 