import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, AlertTriangle, FileCode, Info } from "lucide-react";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Type Definitions
interface Deployment {
  id: string;
  version: string;
  environment: string;
  commitHash?: string;
  commitMessage?: string;
  authorName?: string;
  deployedAt: string;
  status: string;
}

interface ErrorCount {
  date: string;
  count: number;
}

interface FileChange {
  filename: string;
  changeType: 'added' | 'modified' | 'deleted';
  changes: number;
}

interface DeploymentImpact {
  deployment: {
    id: string;
    version: string;
    environment: string;
    commitHash?: string;
    deployedAt: string;
  };
  errorTrend: {
    before: number;
    after: number;
    percentChange: number;
  };
  newErrorGroups: Array<{
    id: string;
    message: string;
    count: number;
    firstSeen: string;
  }>;
  potentialCulprits: Array<{
    file: string;
    changeCount: number;
    errorCorrelation: number;
  }>;
}

interface CodeChangesAnalysisProps {
  projectId: string;
}

// Anotasi untuk deployment
interface AnnotationOptions {
  type: string;
  borderColor: string;
  borderWidth: number;
  label: {
    content: string;
    enabled: boolean;
    position: string;
  };
  scaleID: string;
  value: number;
}

const CodeChangesAnalysisView: React.FC<CodeChangesAnalysisProps> = ({ projectId }) => {
  // State untuk data
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [errorTimeline, setErrorTimeline] = useState<ErrorCount[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<string>('');
  const [deploymentImpact, setDeploymentImpact] = useState<DeploymentImpact | null>(null);
  const [codeChanges, setCodeChanges] = useState<FileChange[]>([]);
  const [previousDeployment, setPreviousDeployment] = useState<string>('');
  const [environment, setEnvironment] = useState<string>('production');
  const [loading, setLoading] = useState<boolean>(true);
  const [timeWindow, setTimeWindow] = useState<number>(24);

  // Efek untuk memuat deployments
  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        setLoading(true);
        // API endpoint ini harus sesuai dengan rute yang telah didefinisikan
        const response = await fetch(`/api/deployments/projects/${projectId}?environment=${environment}`);
        
        if (!response.ok) {
          throw new Error('Gagal mengambil data deployment');
        }
        
        const data = await response.json();
        setDeployments(data.deployments || []);
        
        if (data.deployments && data.deployments.length > 0) {
          // Set deployment terakhir sebagai yang dipilih
          setSelectedDeployment(data.deployments[0].id);
          
          // Jika ada deployment kedua, set sebagai previous
          if (data.deployments.length > 1) {
            setPreviousDeployment(data.deployments[1].id);
          }
        }
      } catch (error) {
        console.error('Error fetching deployments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchDeployments();
    }
  }, [projectId, environment]);

  // Efek untuk memuat data deployment impact saat deployment dipilih
  useEffect(() => {
    const fetchDeploymentImpact = async () => {
      if (!selectedDeployment) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/insights/deployments/${selectedDeployment}/impact?timeWindow=${timeWindow}`);
        
        if (!response.ok) {
          throw new Error('Gagal mengambil data dampak deployment');
        }
        
        const data = await response.json();
        setDeploymentImpact(data);
      } catch (error) {
        console.error('Error fetching deployment impact:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDeployment) {
      fetchDeploymentImpact();
    }
  }, [selectedDeployment, timeWindow]);

  // Efek untuk memuat perubahan kode antara dua deployment
  useEffect(() => {
    const fetchCodeChanges = async () => {
      if (!selectedDeployment || !previousDeployment) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/insights/deployments/${previousDeployment}/changes/${selectedDeployment}`);
        
        if (!response.ok) {
          throw new Error('Gagal mengambil data perubahan kode');
        }
        
        const data = await response.json();
        setCodeChanges(data.changedFiles || []);
      } catch (error) {
        console.error('Error fetching code changes:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDeployment && previousDeployment) {
      fetchCodeChanges();
    }
  }, [selectedDeployment, previousDeployment]);

  // Efek untuk memuat timeline error
  useEffect(() => {
    const fetchErrorTimeline = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        // Endpoint ini mungkin perlu disesuaikan dengan API yang sebenarnya
        const response = await fetch(`/api/stats/projects/${projectId}/errors/timeline?days=30`);
        
        if (!response.ok) {
          throw new Error('Gagal mengambil data timeline error');
        }
        
        const data = await response.json();
        setErrorTimeline(data.timeline || []);
      } catch (error) {
        console.error('Error fetching error timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchErrorTimeline();
    }
  }, [projectId]);

  // Menyiapkan data untuk chart error + deployment
  const prepareChartData = () => {
    // Sortir timeline berdasarkan tanggal
    const sortedTimeline = [...errorTimeline].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Ambil tanggal-tanggal deployment untuk ditampilkan sebagai anotasi
    const deploymentDates = deployments.map(d => ({
      date: new Date(d.deployedAt),
      version: d.version
    }));
    
    // Siapkan labels (tanggal) dan data (jumlah error)
    const labels = sortedTimeline.map(item => format(new Date(item.date), 'dd/MM'));
    const errorData = sortedTimeline.map(item => item.count);
    
    // Anotasi untuk deployment
    const annotations: Record<string, AnnotationOptions> = deploymentDates.reduce((acc: Record<string, AnnotationOptions>, deployment, index) => {
      const deploymentDateStr = format(deployment.date, 'dd/MM');
      const labelIndex = labels.indexOf(deploymentDateStr);
      
      if (labelIndex !== -1) {
        acc[`deployment-${index}`] = {
          type: 'line',
          borderColor: 'rgba(255, 0, 0, 0.8)',
          borderWidth: 2,
          label: {
            content: `Deploy: ${deployment.version}`,
            enabled: true,
            position: 'top'
          },
          scaleID: 'x',
          value: labelIndex
        };
      }
      
      return acc;
    }, {});
    
    return {
      labels,
      datasets: [
        {
          label: 'Jumlah Error',
          data: errorData,
          borderColor: 'rgba(53, 162, 235, 1)',
          backgroundColor: 'rgba(53, 162, 235, 0.1)',
          fill: true,
          tension: 0.4
        }
      ],
      annotations
    };
  };

  // Render loading state
  if (loading && !deployments.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Memuat data...</span>
      </div>
    );
  }

  // Format persentase perubahan error
  const formatPercentChange = (value: number) => {
    const formattedValue = Math.abs(Math.round(value));
    return value >= 0
      ? `+${formattedValue}%`
      : `-${formattedValue}%`;
  };

  // Mendapatkan kelas CSS berdasarkan status perubahan
  const getChangeStatusClass = (value: number) => {
    if (value > 10) return "text-red-500";
    if (value < -10) return "text-green-500";
    return "text-orange-400";
  };

  // Mendapatkan ikon berdasarkan jenis perubahan file
  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Added</Badge>;
      case 'deleted':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Deleted</Badge>;
      case 'modified':
      default:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Modified</Badge>;
    }
  };

  // Render data
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Analisis Perubahan Kode vs Error</CardTitle>
              <CardDescription>
                Memvisualisasikan hubungan antara deployment dan error yang muncul
              </CardDescription>
            </div>
            
            <div className="flex space-x-2">
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={timeWindow.toString()} onValueChange={(value) => setTimeWindow(parseInt(value))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Jendela Waktu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 jam</SelectItem>
                  <SelectItem value="12">12 jam</SelectItem>
                  <SelectItem value="24">24 jam</SelectItem>
                  <SelectItem value="48">48 jam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Select value={selectedDeployment} onValueChange={setSelectedDeployment}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Deployment" />
              </SelectTrigger>
              <SelectContent>
                {deployments.map((deployment) => (
                  <SelectItem key={deployment.id} value={deployment.id}>
                    {deployment.version} - {format(new Date(deployment.deployedAt), 'dd/MM/yyyy HH:mm')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={previousDeployment} onValueChange={setPreviousDeployment}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Deployment Sebelumnya" />
              </SelectTrigger>
              <SelectContent>
                {deployments
                  .filter(d => d.id !== selectedDeployment)
                  .map((deployment) => (
                    <SelectItem key={deployment.id} value={deployment.id}>
                      {deployment.version} - {format(new Date(deployment.deployedAt), 'dd/MM/yyyy HH:mm')}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          {deploymentImpact && (
            <div className="mb-8">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="p-4">
                  <div className="font-semibold text-sm text-muted-foreground mb-2">
                    Error Sebelum
                  </div>
                  <div className="text-2xl font-bold">
                    {deploymentImpact.errorTrend.before}
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="font-semibold text-sm text-muted-foreground mb-2">
                    Error Sesudah
                  </div>
                  <div className="text-2xl font-bold">
                    {deploymentImpact.errorTrend.after}
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="font-semibold text-sm text-muted-foreground mb-2">
                    Perubahan
                  </div>
                  <div className={`text-2xl font-bold ${getChangeStatusClass(deploymentImpact.errorTrend.percentChange)}`}>
                    {formatPercentChange(deploymentImpact.errorTrend.percentChange)}
                  </div>
                </Card>
              </div>
              
              {deploymentImpact.potentialCulprits.length > 0 && (
                <Card className="p-4 mb-6">
                  <CardTitle className="text-lg mb-4">File yang Berpotensi Menyebabkan Error</CardTitle>
                  <div className="space-y-2">
                    {deploymentImpact.potentialCulprits.map((culprit, index) => (
                      <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                        <div className="flex-1 truncate">
                          <FileCode className="inline mr-2 h-4 w-4" />
                          {culprit.file}
                        </div>
                        <div className="w-40">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Progress value={culprit.errorCorrelation * 100} className="h-2" />
                              </TooltipTrigger>
                              <TooltipContent>
                                Korelasi dengan error: {Math.round(culprit.errorCorrelation * 100)}%
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
          
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="timeline">Timeline Error & Deployment</TabsTrigger>
              <TabsTrigger value="codeChanges">Perubahan Kode</TabsTrigger>
              <TabsTrigger value="newErrors">Error Baru</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="h-[350px]">
              {errorTimeline.length > 0 ? (
                <Line 
                  data={prepareChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Jumlah Error'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Tanggal'
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Info className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Data timeline tidak tersedia</span>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="codeChanges">
              <div className="rounded-md border">
                <div className="p-3 border-b bg-muted/50">
                  <div className="font-medium">Daftar File yang Berubah</div>
                </div>
                <div className="divide-y max-h-[300px] overflow-auto">
                  {codeChanges.length > 0 ? (
                    codeChanges.map((file, index) => (
                      <div key={index} className="p-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <FileCode className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-mono text-sm">{file.filename}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getChangeTypeIcon(file.changeType)}
                          <Badge variant="secondary">{file.changes} perubahan</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      Tidak ada perubahan kode ditemukan atau pilih dua deployment untuk membandingkan
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="newErrors">
              <div className="rounded-md border">
                <div className="p-3 border-b bg-muted/50">
                  <div className="font-medium">Error Baru Setelah Deployment</div>
                </div>
                <div className="divide-y max-h-[300px] overflow-auto">
                  {deploymentImpact && deploymentImpact.newErrorGroups.length > 0 ? (
                    deploymentImpact.newErrorGroups.map((error, index) => (
                      <div key={index} className="p-3">
                        <div className="flex items-start mb-1">
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-1" />
                          <div>
                            <div className="font-medium">{error.message}</div>
                            <div className="text-sm text-muted-foreground flex items-center mt-1">
                              <span className="mr-3">Terjadi {error.count} kali</span>
                              <span>Pertama kali: {format(new Date(error.firstSeen), 'dd/MM/yyyy HH:mm')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      Tidak ada error baru yang terdeteksi setelah deployment ini
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeChangesAnalysisView; 