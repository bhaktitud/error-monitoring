import React, { useState, useEffect } from 'react';
import { ErrorPredictorAPI } from '../../lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
  Alert,
  AlertTitle,
  AlertDescription,
  Progress,
} from '../ui';
import { BarChart, BarChartItem } from '../charts/BarChart';

interface ErrorPredictionViewProps {
  eventId?: string;
  groupId?: string;
}

interface PredictionResult {
  eventId: string;
  groupId?: string;
  probableCauses: Array<{
    cause: string;
    probability: number;
    explanation?: string;
  }>;
  predictionTime: number;
  modelVersion: string;
  createdAt: string;
}

const ErrorPredictionView: React.FC<ErrorPredictionViewProps> = ({ eventId, groupId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        setError(null);

        let result;
        if (eventId) {
          result = await ErrorPredictorAPI.getEventPrediction(eventId);
        } else if (groupId) {
          result = await ErrorPredictorAPI.getGroupPrediction(groupId);
        } else {
          throw new Error('Baik eventId atau groupId harus disediakan');
        }

        setPrediction(result);
      } catch (err) {
        setError('Gagal memuat prediksi error: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [eventId, groupId]);

  // Mengubah data prediksi ke format yang sesuai untuk BarChart
  const getChartData = (): BarChartItem[] => {
    if (!prediction || !prediction.probableCauses || prediction.probableCauses.length === 0) {
      return [];
    }

    return prediction.probableCauses.slice(0, 5).map(cause => ({
      name: cause.cause,
      value: Math.round(cause.probability * 100),
    }));
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Prediksi Penyebab Error</CardTitle>
          <CardDescription>
            Menganalisis error dengan model machine learning
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Prediksi Penyebab Error</CardTitle>
          <CardDescription>
            Menganalisis error dengan model machine learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Gagal memuat prediksi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!prediction || !prediction.probableCauses || prediction.probableCauses.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Prediksi Penyebab Error</CardTitle>
          <CardDescription>
            Menganalisis error dengan model machine learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Tidak ada prediksi tersedia</AlertTitle>
            <AlertDescription>
              Model belum dilatih atau tidak cukup data untuk membuat prediksi.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Prediksi Penyebab Error</CardTitle>
        <CardDescription>
          Hasil analisis menggunakan model machine learning (v{prediction.modelVersion})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <BarChart 
            data={getChartData()} 
            title="Kemungkinan Penyebab" 
            tooltipPrefix="Probabilitas: "
            tooltipSuffix="%" 
          />
        </div>

        <div className="space-y-4">
          {prediction.probableCauses.slice(0, 3).map((cause, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="font-medium">{cause.cause}</div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(cause.probability * 100)}%
                </div>
              </div>
              <Progress value={cause.probability * 100} />
              {cause.explanation && (
                <p className="text-sm text-muted-foreground mt-1">{cause.explanation}</p>
              )}
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          Prediksi dibuat dalam {prediction.predictionTime}ms pada{' '}
          {new Date(prediction.createdAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorPredictionView; 