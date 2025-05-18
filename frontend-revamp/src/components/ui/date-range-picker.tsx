'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (dateRange: DateRange) => void;
  align?: 'center' | 'end' | 'start';
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onChange,
  align = 'start',
  className,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange>({
    from: dateRange.from,
    to: dateRange.to,
  });

  // Preset options for date range
  const presets = [
    {
      name: 'Hari Ini',
      dates: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      name: '7 Hari Terakhir',
      dates: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    },
    {
      name: '30 Hari Terakhir',
      dates: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    },
    {
      name: '90 Hari Terakhir',
      dates: {
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    },
  ];

  // Apply date range and close popover
  const onApply = () => {
    if (date.from && date.to) {
      onChange(date);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            size="sm"
            className={cn(
              'justify-start text-left font-normal w-[240px]',
              !dateRange.from && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'dd MMM yy', { locale: id })} -{' '}
                  {format(dateRange.to, 'dd MMM yy', { locale: id })}
                </>
              ) : (
                format(dateRange.from, 'dd MMMM yyyy', { locale: id })
              )
            ) : (
              <span>Pilih tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex">
            <div className="border-r p-2 space-y-2">
              {presets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start font-normal"
                  onClick={() => {
                    setDate(preset.dates);
                    onChange(preset.dates);
                  }}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
            <div className="p-2">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate || { from: undefined, to: undefined });
                }}
                numberOfMonths={2}
                locale={id}
              />
              <div className="flex justify-end gap-2 py-2 px-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDate(dateRange);
                  }}
                >
                  Batal
                </Button>
                <Button size="sm" onClick={onApply}>
                  Terapkan
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 