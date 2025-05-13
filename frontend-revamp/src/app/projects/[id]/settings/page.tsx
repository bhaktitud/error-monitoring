'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FiSave, FiTrash2, FiAlertTriangle, FiCopy, FiLoader, FiCpu, FiUploadCloud } from 'react-icons/fi';
import { ProjectsAPI, SourceMap } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadSourceMapModal } from '@/components/dashboard/UploadSourceMapModal';

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<{
    id: string;
    name: string;
    dsn: string;
    createdAt: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    enableGlobalErrorHandling: true,
    enableConsoleIntegration: true,
    enableSourceMaps: false,
    ignoredErrors: '',
    allowedDomains: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sourceMaps, setSourceMaps] = useState<SourceMap[]>([]);
  const [isLoadingSourceMaps, setIsLoadingSourceMaps] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteSourceMapDialog, setShowDeleteSourceMapDialog] = useState(false);
  const [sourceMapToDelete, setSourceMapToDelete] = useState<SourceMap | null>(null);
  const [isDeletingSourceMap, setIsDeletingSourceMap] = useState(false);

  useEffect(() => {
    // Fetch project data
    const fetchProject = async () => {
      try {
        setLoading(true);
        const projectData = await ProjectsAPI.getProject(projectId);
        setProject(projectData);
        setFormData({
          ...formData,
          name: projectData.name
        });
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Gagal memuat data proyek');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  // Fungsi untuk fetch source maps
  const fetchSourceMaps = async () => {
    if (!projectId) return;
    setIsLoadingSourceMaps(true);
    try {
      const maps = await ProjectsAPI.getSourceMaps(projectId);
      setSourceMaps(maps);
    } catch (error) {
      console.error('Error fetching source maps:', error);
      toast.error('Gagal memuat source maps');
    } finally {
      setIsLoadingSourceMaps(false);
    }
  };

  // useEffect untuk fetch source maps
  useEffect(() => {
    fetchSourceMaps();
  }, [projectId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Integrasi dengan API untuk menyimpan perubahan
      await ProjectsAPI.updateProject(projectId, formData);
      
      toast.success('Pengaturan berhasil disimpan');
    } catch (error) {
      console.error('Error saving project settings:', error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    
    try {
      // Panggil API untuk menghapus proyek
      await ProjectsAPI.deleteProject(projectId);
      
      toast.success('Proyek berhasil dihapus');
      // Ubah navigasi ke dashboard atau halaman utama alih-alih /projects
      localStorage.removeItem('lastProjectId'); // Hapus dari localStorage
      router.push('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Gagal menghapus proyek');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const copyDsn = async () => {
    if (project?.dsn) {
      await navigator.clipboard.writeText(project.dsn);
      toast.success('DSN telah disalin ke clipboard!');
    }
  };

  const openDeleteSourceMapDialog = (sourceMap: SourceMap) => {
    setSourceMapToDelete(sourceMap);
    setShowDeleteSourceMapDialog(true);
  };

  const handleDeleteSourceMap = async () => {
    if (!sourceMapToDelete) return;
    
    setIsDeletingSourceMap(true);
    try {
      await ProjectsAPI.deleteSourceMap(projectId, sourceMapToDelete.id);
      toast.success(`Source map untuk rilis ${sourceMapToDelete.release} berhasil dihapus`);
      setShowDeleteSourceMapDialog(false);
      setSourceMapToDelete(null);
      fetchSourceMaps(); // Refresh list
    } catch (error) {
      console.error('Error deleting source map:', error);
      toast.error('Gagal menghapus source map');
    } finally {
      setIsDeletingSourceMap(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="flex justify-center items-center h-96">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-muted-foreground">Memuat pengaturan proyek...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectId={projectId}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold">Pengaturan Proyek</h1>
        </div>
      </div>


      <Tabs defaultValue="general">
        <TabsList className="w-full max-w-md grid grid-cols-4 p-1 rounded-lg">
          <TabsTrigger 
            value="general" 
            className="rounded-md py-2 transition-all"
          >
            Umum
          </TabsTrigger>
          <TabsTrigger 
            value="sdk" 
            className="rounded-md py-2 transition-all"
          >
            SDK
          </TabsTrigger>
          <TabsTrigger 
            value="sourcemaps" 
            className="rounded-md py-2 transition-all"
          >
            <FiCpu className="mr-2" /> Source Maps
          </TabsTrigger>
          <TabsTrigger 
            value="danger" 
            className="rounded-md py-2 transition-all text-destructive"
          >
            Danger Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Proyek</CardTitle>
              <CardDescription>
                Informasi dasar tentang proyek Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Proyek</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="Nama proyek"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ID Proyek</Label>
                  <Input
                    value={project?.id || ''}
                    readOnly
                    className="bg-muted opacity-70"
                  />
                </div>

                <div className="space-y-2">
                  <Label>DSN (Data Source Name)</Label>
                  <div className="flex">
                    <Input
                      value={project?.dsn || ''}
                      readOnly
                      className="rounded-r-none bg-muted text-muted-foreground"
                    />
                    <Button 
                      type="button"
                      onClick={copyDsn} 
                      variant="outline" 
                      className="rounded-l-none"
                    >
                      <FiCopy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2 h-4 w-4" />
                        Simpan Perubahan
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sdk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrasi SDK LogRaven</CardTitle>
              <CardDescription>
                Salin DSN di bawah ini dan pasang pada konfigurasi SDK LogRaven di aplikasi Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Label>Cara Install SDK</Label>
                <pre className="bg-muted rounded p-4 text-sm overflow-x-auto">
{`npm install @lograven/sdk
# atau
yarn add @lograven/sdk
# atau
pnpm add @lograven/sdk`}
                </pre>
                <Label>DSN Proyek Anda</Label>
                <div className="flex gap-2">
                  <Input
                    value={project?.dsn || ''}
                    readOnly
                    className="font-mono bg-muted text-muted-foreground"
                  />
                  <Button type="button" variant="outline" onClick={copyDsn}>
                    <FiCopy className="h-4 w-4" />
                  </Button>
                </div>
                <Label className="mt-4">Contoh Penggunaan di Aplikasi (JavaScript)</Label>
                <pre className="bg-muted rounded p-4 text-sm overflow-x-auto">
{`// Contoh inisialisasi LogRaven SDK
import lograven from '@lograven/sdk';

lograven.init({
  dsn: '${project?.dsn || 'DSN_PROYEK_ANDA'}'
});

// Atau jika menggunakan require()
// const lograven = require('lograven');
// lograven.init({ dsn: '${project?.dsn || 'DSN_PROYEK_ANDA'}' });
`}
                </pre>
                <Label className="mt-4">Integrasi di Middleware Express.js</Label>
                <pre className="bg-muted rounded p-4 text-sm overflow-x-auto">
{`const lograven = require('@lograven/sdk');

lograven.init({
  dsn: '${project?.dsn || 'DSN_PROYEK_ANDA'}'
});

// Pasang middleware sebelum route lain
app.use(lograven.middleware());

// ...route dan error handler lain
`}
                </pre>
                <Label className="mt-4">Integrasi di Next.js (API Route/Middleware)</Label>
                <pre className="bg-muted rounded p-4 text-sm overflow-x-auto">
{`import lograven from '@lograven/sdk';

lograven.init({
  dsn: '${project?.dsn || 'DSN_PROYEK_ANDA'}'
});

export default function handler(req, res) {
  lograven.captureRequest(req, res);
  // ...logic API Anda
}
`}
                </pre>
                <p className="text-muted-foreground text-xs mt-2">
                  Pastikan Anda sudah menginstall SDK <span className="font-mono">lograven</span> di aplikasi Anda.<br />
                  Untuk dokumentasi lebih lengkap, kunjungi <a href="https://docs.lograven.com" target="_blank" rel="noopener noreferrer" className="underline text-primary">docs.lograven.com</a>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sourcemaps" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kelola Source Maps</CardTitle>
                <CardDescription>
                  Upload dan kelola source maps untuk rilis aplikasi Anda.
                </CardDescription>
              </div>
              <Button onClick={() => setShowUploadModal(true)}>
                <FiUploadCloud className="mr-2" /> Upload Source Map
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingSourceMaps ? (
                <div className="flex justify-center items-center h-40">
                  <FiLoader className="animate-spin h-8 w-8 text-primary" />
                </div>
              ) : sourceMaps.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Belum ada source map yang diunggah untuk proyek ini.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rilis</TableHead>
                      <TableHead>File Sumber</TableHead>
                      <TableHead>Lingkungan</TableHead>
                      <TableHead>Tgl Upload</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sourceMaps.map((sm) => (
                      <TableRow key={sm.id}>
                        <TableCell className="font-medium">{sm.release}</TableCell>
                        <TableCell>{sm.sourceFile}</TableCell>
                        <TableCell>{sm.environment || '-'}</TableCell>
                        <TableCell>{new Date(sm.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Dialog open={showDeleteSourceMapDialog && sourceMapToDelete?.id === sm.id} onOpenChange={(isOpen) => {
                            if (!isOpen) {
                              setShowDeleteSourceMapDialog(false);
                              setSourceMapToDelete(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => openDeleteSourceMapDialog(sm)}
                                className="text-destructive hover:text-destructive"
                              >
                                <FiTrash2 />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Hapus Source Map</DialogTitle>
                                <DialogDescription>
                                  Apakah Anda yakin ingin menghapus source map untuk rilis 
                                  <span className="font-semibold">{sourceMapToDelete?.release}</span> file 
                                  <span className="font-mono text-sm">{sourceMapToDelete?.filename}</span>?
                                  Tindakan ini tidak dapat dibatalkan.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setShowDeleteSourceMapDialog(false)}>
                                  Batal
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  onClick={handleDeleteSourceMap}
                                  disabled={isDeletingSourceMap}
                                >
                                  {isDeletingSourceMap ? (
                                    <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <FiTrash2 className="mr-2 h-4 w-4" />
                                  )}
                                  Hapus Permanen
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Tindakan yang bisa merusak atau menghapus data proyek
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="rounded-md border border-destructive/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-destructive">Hapus Proyek</h4>
                      <p className="text-sm text-muted-foreground">
                        Menghapus proyek ini dan semua data terkait secara permanen. Tindakan ini tidak dapat dibatalkan.
                      </p>
                    </div>
                    
                    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <FiTrash2 className="mr-2 h-4 w-4" />
                          Hapus Proyek
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Hapus Proyek</DialogTitle>
                          <DialogDescription>
                            Apakah Anda yakin ingin menghapus proyek ini? Semua data terkait akan dihapus secara permanen dan tidak dapat dipulihkan.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Alert variant="destructive" className="mt-4">
                          <FiAlertTriangle className="h-4 w-4 mr-2" />
                          <AlertTitle>Peringatan</AlertTitle>
                          <AlertDescription>
                            Tindakan ini akan menghapus semua data, error grup, event, dan konfigurasi terkait proyek ini.
                            Pastikan Anda memiliki cadangan data jika diperlukan.
                          </AlertDescription>
                        </Alert>
                        
                        <DialogFooter className="mt-4">
                          <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Batal
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleDeleteProject}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                                Menghapus...
                              </>
                            ) : (
                              <>
                                <FiTrash2 className="mr-2 h-4 w-4" />
                                Hapus Permanen
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UploadSourceMapModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
        projectId={projectId} 
        onUploadSuccess={() => { fetchSourceMaps(); setShowUploadModal(false); }} 
      />

    </DashboardLayout>
  );
} 