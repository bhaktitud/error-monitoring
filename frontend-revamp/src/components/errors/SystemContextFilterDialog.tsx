'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SystemCondition } from '@/types/system';
import { Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SystemContextFilterDialogProps {
  projectId: string;
  browserData?: SystemCondition[];
  osData?: SystemCondition[];
  deviceData?: SystemCondition[];
  methodData?: SystemCondition[];
  statusCodeData?: SystemCondition[];
}

export function SystemContextFilterDialog({
  projectId,
  browserData = [],
  osData = [],
  deviceData = [],
  methodData = [],
  statusCodeData = [],
}: SystemContextFilterDialogProps) {
  const router = useRouter();
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string | number>>({});
  const [open, setOpen] = useState(false);

  // Tambahkan filter ke state
  const addFilter = (key: string, value: string | number) => {
    setSelectedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Hapus filter dari state
  const removeFilter = (key: string) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  // Apply filter dan tutup dialog
  const applyFilters = async () => {
    try {
      // Generate query string dari filter yang dipilih
      const queryParams = new URLSearchParams();
      
      // Tambahkan filter ke query
      Object.entries(selectedFilters).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
      
      // Navigate ke halaman yang sama dengan query params
      router.push(`/projects/${projectId}/errors?${queryParams.toString()}`);
      
      // Tutup dialog
      setOpen(false);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  // Reset filter
  const resetFilters = () => {
    setSelectedFilters({});
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Filter className="h-3.5 w-3.5" />
          <span>Filter by System</span>
          {Object.keys(selectedFilters).length > 0 && (
            <Badge variant="secondary" className="ml-1 rounded-sm px-1 font-normal">
              {Object.keys(selectedFilters).length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Errors by System Conditions</DialogTitle>
          <DialogDescription>
            Select conditions to filter errors by browsers, devices, network, and more.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-4">
          {/* Browser Filter */}
          <div className="grid gap-2">
            <Label htmlFor="browser">Browser</Label>
            <Select
              value={selectedFilters.browser as string || ""}
              onValueChange={(value) => value ? addFilter('browser', value) : removeFilter('browser')}
            >
              <SelectTrigger id="browser">
                <SelectValue placeholder="Select browser" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All browsers</SelectItem>
                {browserData.map((browser) => (
                  <SelectItem key={browser.name} value={browser.name}>
                    {browser.name} ({browser.errorCount} errors)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operating System Filter */}
          <div className="grid gap-2">
            <Label htmlFor="os">Operating System</Label>
            <Select
              value={selectedFilters.os as string || ""}
              onValueChange={(value) => value ? addFilter('os', value) : removeFilter('os')}
            >
              <SelectTrigger id="os">
                <SelectValue placeholder="Select OS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All operating systems</SelectItem>
                {osData.map((os) => (
                  <SelectItem key={os.name} value={os.name}>
                    {os.name} ({os.errorCount} errors)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Device Type Filter */}
          <div className="grid gap-2">
            <Label htmlFor="deviceType">Device Type</Label>
            <Select
              value={selectedFilters.deviceType as string || ""}
              onValueChange={(value) => value ? addFilter('deviceType', value) : removeFilter('deviceType')}
            >
              <SelectTrigger id="deviceType">
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All device types</SelectItem>
                {deviceData.map((device) => (
                  <SelectItem key={device.name} value={device.name}>
                    {device.name} ({device.errorCount} errors)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* HTTP Method Filter */}
          <div className="grid gap-2">
            <Label htmlFor="method">HTTP Method</Label>
            <Select
              value={selectedFilters.method as string || ""}
              onValueChange={(value) => value ? addFilter('method', value) : removeFilter('method')}
            >
              <SelectTrigger id="method">
                <SelectValue placeholder="Select HTTP method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All HTTP methods</SelectItem>
                {methodData.map((method) => (
                  <SelectItem key={method.name} value={method.name}>
                    {method.name} ({method.errorCount} errors)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Code Filter */}
          <div className="grid gap-2">
            <Label htmlFor="statusCode">Status Code</Label>
            <Select
              value={selectedFilters.statusCode as string || ""}
              onValueChange={(value) => {
                if (value) {
                  // Convert string ke number jika dipilih
                  addFilter('statusCode', parseInt(value, 10));
                } else {
                  removeFilter('statusCode');
                }
              }}
            >
              <SelectTrigger id="statusCode">
                <SelectValue placeholder="Select status code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All status codes</SelectItem>
                {statusCodeData.map((code) => (
                  <SelectItem key={code.name} value={code.value.toString()}>
                    {code.name} ({code.errorCount} errors)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter yang sudah dipilih */}
        {Object.keys(selectedFilters).length > 0 && (
          <div className="mt-2 space-y-2">
            <Label>Selected Filters</Label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(selectedFilters).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="gap-1">
                  {key}: {value}
                  <button
                    className="ml-1 rounded-full hover:bg-muted"
                    onClick={() => removeFilter(key)}
                  >
                    ✕
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={resetFilters}>
            Reset
          </Button>
          <Button onClick={applyFilters} disabled={Object.keys(selectedFilters).length === 0}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 