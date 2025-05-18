'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  FiChevronDown, 
  FiFilter, 
  FiSearch, 
  FiExternalLink,
  FiArrowUp,
  FiArrowDown 
} from 'react-icons/fi';
import Link from 'next/link';

interface ErrorBreakdownItem {
  id: string;
  errorType: string;
  rootCause: string;
  environment: string;
  browser: string;
  occurrences: number;
  lastOccurred: string;
  resolution: {
    status: 'resolved' | 'unresolved' | 'ignored';
    time?: string;
  };
}

interface RCAErrorBreakdownTableProps {
  data: ErrorBreakdownItem[];
}

export function RCAErrorBreakdownTable({ data }: RCAErrorBreakdownTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ErrorBreakdownItem | 'resolution.status', 
    direction: 'ascending' | 'descending'
  }>({
    key: 'occurrences',
    direction: 'descending'
  });

  // Jika tidak ada data, tampilkan pesan
  if (!data || data.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Tidak ada data breakdown tersedia
      </div>
    );
  }

  // Filter data berdasarkan search term
  const filteredData = data.filter(item => 
    item.errorType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.rootCause.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.environment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fungsi untuk sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortConfig.key === 'resolution.status') {
      if (a.resolution.status < b.resolution.status) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a.resolution.status > b.resolution.status) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    } else {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    }
  });

  // Fungsi untuk mengubah sort
  const requestSort = (key: keyof ErrorBreakdownItem | 'resolution.status') => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction: direction as 'ascending' | 'descending' });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Terselesaikan</Badge>;
      case 'unresolved':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Belum Diselesaikan</Badge>;
      case 'ignored':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Diabaikan</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <FiSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari error..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FiFilter className="mr-2 h-4 w-4" />
              Filter
              <FiChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setSearchTerm('production')}>
              Environment: Production
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm('development')}>
              Environment: Development
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm('resolved')}>
              Status: Terselesaikan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm('unresolved')}>
              Status: Belum Terselesaikan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="w-[180px] cursor-pointer"
                onClick={() => requestSort('errorType')}
              >
                <div className="flex items-center">
                  Error Type
                  {sortConfig.key === 'errorType' && (
                    sortConfig.direction === 'ascending' ? 
                      <FiArrowUp className="ml-1 h-4 w-4" /> : 
                      <FiArrowDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => requestSort('rootCause')}
              >
                <div className="flex items-center">
                  Root Cause
                  {sortConfig.key === 'rootCause' && (
                    sortConfig.direction === 'ascending' ? 
                      <FiArrowUp className="ml-1 h-4 w-4" /> : 
                      <FiArrowDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => requestSort('environment')}
              >
                <div className="flex items-center">
                  Environment
                  {sortConfig.key === 'environment' && (
                    sortConfig.direction === 'ascending' ? 
                      <FiArrowUp className="ml-1 h-4 w-4" /> : 
                      <FiArrowDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="text-right cursor-pointer"
                onClick={() => requestSort('occurrences')}
              >
                <div className="flex items-center justify-end">
                  Jumlah
                  {sortConfig.key === 'occurrences' && (
                    sortConfig.direction === 'ascending' ? 
                      <FiArrowUp className="ml-1 h-4 w-4" /> : 
                      <FiArrowDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => requestSort('resolution.status')}
              >
                <div className="flex items-center">
                  Status
                  {sortConfig.key === 'resolution.status' && (
                    sortConfig.direction === 'ascending' ? 
                      <FiArrowUp className="ml-1 h-4 w-4" /> : 
                      <FiArrowDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.errorType}</TableCell>
                <TableCell>{item.rootCause}</TableCell>
                <TableCell>{item.environment}</TableCell>
                <TableCell className="text-right">{item.occurrences}</TableCell>
                <TableCell>{getStatusBadge(item.resolution.status)}</TableCell>
                <TableCell>
                  <Link 
                    href={`/projects/[id]/groups/${item.id}`}
                    as={`/projects/${item.id.split('_')[0]}/groups/${item.id}`}
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    Detail <FiExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Menampilkan {sortedData.length} dari {data.length} error
      </div>
    </div>
  );
} 