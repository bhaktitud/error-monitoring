'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectsAPI, GroupsAPI } from '@/lib/api';
import { FiArrowLeft, FiSearch, FiPackage } from 'react-icons/fi';

interface SearchResult {
  id: string;
  type: 'project' | 'group';
  title: string;
  subtitle?: string;
  projectId?: string;
}

export default function GlobalSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (queryParam) {
      handleSearch();
    }
  }, [queryParam]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Cari proyek
      const projects = await ProjectsAPI.getProjects();
      const filteredProjects = projects.filter(
        project => project.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Ambil groups dari semua proyek yang sesuai (ini bisa dikembangkan lebih lanjut)
      let allGroups: SearchResult[] = [];
      
      for (const project of filteredProjects.slice(0, 3)) { // Batasi hanya 3 proyek untuk performa
        try {
          const groups = await GroupsAPI.getGroups(project.id);
          const filteredGroups = groups
            .filter(group => 
              group.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
              group.errorType.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 5); // Batasi hanya 5 grup per proyek
          
          const mappedGroups = filteredGroups.map(group => ({
            id: group.id,
            type: 'group' as const,
            title: group.errorType,
            subtitle: group.message,
            projectId: project.id
          }));
          
          allGroups = [...allGroups, ...mappedGroups];
        } catch (err) {
          console.error(`Error fetching groups for project ${project.id}:`, err);
        }
      }
      
      // Gabungkan hasil
      const mappedProjects = filteredProjects.map(project => ({
        id: project.id,
        type: 'project' as const,
        title: project.name,
        subtitle: `Created: ${new Date(project.createdAt).toLocaleDateString('id-ID')}`
      }));
      
      setResults([...mappedProjects, ...allGroups]);
    } catch (err) {
      console.error('Error searching:', err);
      setError('Terjadi kesalahan saat mencari. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    handleSearch();
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'project') {
      router.push(`/projects/${result.id}`);
    } else if (result.type === 'group' && result.projectId) {
      router.push(`/projects/${result.projectId}/groups/${result.id}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/projects')}
              className="mr-4"
            >
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Proyek
            </Button>
            <h1 className="text-2xl font-bold">Pencarian Global</h1>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400 h-4 w-4" />
                </div>
                <Input
                  type="text"
                  placeholder="Cari proyek atau error..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Mencari...' : 'Cari'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">
              {results.length} hasil ditemukan untuk &quot;{queryParam}&quot;
            </h2>
          </div>

          {loading ? (
            <div className="text-center p-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Mencari...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {/* Projects Section */}
              {results.filter(r => r.type === 'project').length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-2">Proyek</h3>
                  <div className="space-y-2">
                    {results
                      .filter(r => r.type === 'project')
                      .map((result) => (
                        <div 
                          key={`${result.type}-${result.id}`}
                          className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleResultClick(result)}
                        >
                          <div className="flex items-start">
                            <div className="mr-3 mt-1">
                              <FiPackage className="text-blue-500 h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-medium text-blue-600">{result.title}</h3>
                              {result.subtitle && (
                                <p className="text-sm text-gray-500">{result.subtitle}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Errors Section */}
              {results.filter(r => r.type === 'group').length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-2">Error Groups</h3>
                  <div className="space-y-2">
                    {results
                      .filter(r => r.type === 'group')
                      .map((result) => (
                        <div 
                          key={`${result.type}-${result.id}`}
                          className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleResultClick(result)}
                        >
                          <div className="flex flex-col">
                            <h3 className="font-medium text-blue-600">{result.title}</h3>
                            {result.subtitle && (
                              <p className="text-sm text-gray-700 mt-1">{result.subtitle}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : queryParam ? (
            <div className="text-center p-12 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                <FiSearch className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Tidak ada hasil</h3>
              <p className="text-gray-500">
                Tidak ada data yang cocok dengan kata kunci &quot;{queryParam}&quot;.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
} 