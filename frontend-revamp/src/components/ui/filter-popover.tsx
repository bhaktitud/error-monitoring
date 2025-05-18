'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { FiFilter, FiX } from 'react-icons/fi';

interface FilterOptions {
  [key: string]: string[];
}

interface FilterValues {
  [key: string]: string;
}

interface FilterPopoverProps {
  filter: FilterValues;
  onFilterChange: (filter: FilterValues) => void;
  options: FilterOptions;
}

export function FilterPopover({ filter, onFilterChange, options }: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [tempFilter, setTempFilter] = useState<FilterValues>(filter);

  // Jumlah filter aktif (filter tidak termasuk 'all')
  const activeFilterCount = Object.values(filter).filter(val => val !== 'all').length;

  const handleFilterChange = (key: string, value: string) => {
    setTempFilter(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    onFilterChange(tempFilter);
    setOpen(false);
  };

  const resetFilters = () => {
    const resetValues: FilterValues = {};
    Object.keys(options).forEach(key => {
      resetValues[key] = 'all';
    });
    
    setTempFilter(resetValues);
    onFilterChange(resetValues);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <FiFilter className="h-3.5 w-3.5" />
          Filter
          {activeFilterCount > 0 && (
            <Badge className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filter</h4>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
          
          {Object.entries(options).map(([key, values]) => (
            <div key={key} className="space-y-2">
              <Label className="capitalize">{key}</Label>
              <div className="flex flex-wrap gap-1">
                {values.map(value => (
                  <Badge
                    key={value}
                    variant={tempFilter[key] === value ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => handleFilterChange(key, value)}
                  >
                    {value === 'all' ? 'Semua' : value}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          
          <Separator />
          
          <div className="flex justify-end">
            <Button 
              variant="secondary" 
              size="sm" 
              className="mr-2"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button 
              size="sm"
              onClick={applyFilters}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 