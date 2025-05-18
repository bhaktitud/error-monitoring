'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FiDownload, FiFileText, FiBarChart2, FiTable } from 'react-icons/fi';
import { ErrorInsightAPI } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

interface DownloadReportPopoverProps {
  projectId: string;
}

export function DownloadReportPopover({ projectId }: DownloadReportPopoverProps) {
  const [format, setFormat] = useState('pdf');
  const [period, setPeriod] = useState('7days');
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState({
    includeCharts: true,
    includeRawData: false,
    includeRecommendations: true,
    includeSystemInfo: true,
  });

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      // Mengirim permintaan untuk mengunduh laporan
      const response = await ErrorInsightAPI.downloadRCAReport(projectId, {
        format,
        period,
        ...options
      });
      
      // Menggunakan API browser untuk mengunduh file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Buat nama file yang sesuai
      const date = new Date().toISOString().split('T')[0];
      const extension = format === 'excel' ? 'xlsx' : format;
      link.setAttribute('download', `rca-report-${date}.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: 'Laporan berhasil diunduh',
        description: 'Laporan analisis root cause telah berhasil diunduh',
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: 'Gagal mengunduh laporan',
        description: 'Terjadi kesalahan saat mengunduh laporan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <FiDownload className="mr-2 h-4 w-4" />
          Unduh Laporan
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Unduh Laporan RCA</h4>
          <p className="text-sm text-muted-foreground">
            Konfigurasi dan unduh laporan analisis root cause
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="report-format">Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger id="report-format">
                <SelectValue placeholder="Pilih format" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="pdf">
                  <div className="flex items-center">
                    <FiFileText className="mr-2 h-4 w-4" />
                    PDF
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center">
                    <FiTable className="mr-2 h-4 w-4" />
                    Excel
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center">
                    <FiBarChart2 className="mr-2 h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="report-period">Periode</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger id="report-period">
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="7days">7 hari terakhir</SelectItem>
                <SelectItem value="30days">30 hari terakhir</SelectItem>
                <SelectItem value="90days">90 hari terakhir</SelectItem>
                <SelectItem value="all">Semua waktu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Opsi</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-charts" 
                  checked={options.includeCharts}
                  onCheckedChange={(checked) => 
                    setOptions({...options, includeCharts: checked as boolean})
                  }
                />
                <label 
                  htmlFor="include-charts" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Sertakan Grafik
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-raw-data" 
                  checked={options.includeRawData}
                  onCheckedChange={(checked) => 
                    setOptions({...options, includeRawData: checked as boolean})
                  }
                />
                <label 
                  htmlFor="include-raw-data" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Sertakan Data Mentah
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-recommendations" 
                  checked={options.includeRecommendations}
                  onCheckedChange={(checked) => 
                    setOptions({...options, includeRecommendations: checked as boolean})
                  }
                />
                <label 
                  htmlFor="include-recommendations" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Sertakan Rekomendasi
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-system-info" 
                  checked={options.includeSystemInfo}
                  onCheckedChange={(checked) => 
                    setOptions({...options, includeSystemInfo: checked as boolean})
                  }
                />
                <label 
                  htmlFor="include-system-info" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Sertakan Informasi Sistem
                </label>
              </div>
            </div>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleDownload}
            disabled={isLoading}
          >
            {isLoading ? 'Mengunduh...' : 'Unduh Laporan'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
} 