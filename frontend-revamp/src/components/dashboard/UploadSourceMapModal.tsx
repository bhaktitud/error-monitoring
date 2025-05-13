import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProjectsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { FiUploadCloud, FiLoader, FiFile } from 'react-icons/fi';

interface UploadSourceMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onUploadSuccess: () => void;
}

export const UploadSourceMapModal: React.FC<UploadSourceMapModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId, 
  onUploadSuccess 
}) => {
  const [release, setRelease] = useState('');
  const [sourceFile, setSourceFile] = useState('');
  const [minifiedFile, setMinifiedFile] = useState(''); // Opsional
  const [environment, setEnvironment] = useState(''); // Opsional
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !release || !sourceFile) {
      toast.error('Harap isi semua field yang wajib diisi (Rilis, File Sumber, dan pilih file .map)');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('sourceMapFile', selectedFile);
    formData.append('release', release);
    formData.append('sourceFile', sourceFile);
    if (minifiedFile) formData.append('minifiedFile', minifiedFile);
    if (environment) formData.append('environment', environment);

    try {
      await ProjectsAPI.uploadSourceMap(projectId, formData);
      toast.success(`Source map untuk rilis ${release} berhasil diunggah.`);
      onUploadSuccess();
      resetForm();
    } catch (error: unknown) {
      console.error('Error uploading source map:', error);
      let errorMessage = 'Gagal mengunggah source map';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        errorMessage = axiosError.response?.data?.error || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setRelease('');
    setSourceFile('');
    setMinifiedFile('');
    setEnvironment('');
    setSelectedFile(null);
    // Reset file input value
    const fileInput = document.getElementById('sourceMapFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleClose = () => {
    if (isUploading) return; // Jangan tutup jika sedang upload
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Upload Source Map</DialogTitle>
          <DialogDescription>
            Unggah file .map beserta informasi rilis untuk menerjemahkan stack trace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="release">
              Rilis <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="release" 
              value={release} 
              onChange={(e) => setRelease(e.target.value)} 
              placeholder="cth: 1.0.0, v2.1-beta" 
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sourceFile">
              File Sumber <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="sourceFile" 
              value={sourceFile} 
              onChange={(e) => setSourceFile(e.target.value)} 
              placeholder="cth: https://cdn.example.com/app.min.js"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minifiedFile">
              File Minified <span className="text-xs">(Ops)</span>
            </Label>
            <Input 
              id="minifiedFile" 
              value={minifiedFile} 
              onChange={(e) => setMinifiedFile(e.target.value)} 
              placeholder="Kosongkan jika sama dengan File Sumber"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="environment">
              Lingkungan <span className="text-xs">(Ops)</span>
            </Label>
            <Input 
              id="environment" 
              value={environment} 
              onChange={(e) => setEnvironment(e.target.value)} 
              placeholder="cth: production, staging"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sourceMapFile">
              File .map <span className="text-destructive">*</span>
            </Label>
            <div>
              <Input 
                id="sourceMapFile" 
                type="file" 
                onChange={handleFileChange} 
                accept=".map"
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                required
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <FiFile className="mr-1"/> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
              Batal
            </Button>
            <Button type="submit" disabled={isUploading || !selectedFile}>
              {isUploading ? (
                <><FiLoader className="mr-2 h-4 w-4 animate-spin" /> Mengunggah...</>
              ) : (
                <><FiUploadCloud className="mr-2 h-4 w-4" /> Upload</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 