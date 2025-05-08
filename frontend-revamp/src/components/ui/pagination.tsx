import React from 'react';
import { Button } from './button';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxPageButtons?: number;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  maxPageButtons = 5 
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Logika untuk menentukan halaman mana yang ditampilkan
  const getPageButtons = () => {
    const buttons = [];
    
    // Jika total halaman kurang dari atau sama dengan maxPageButtons, tampilkan semua
    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(i);
      }
      return buttons;
    }
    
    // Jika halaman saat ini dekat dengan awal
    if (currentPage <= Math.ceil(maxPageButtons / 2)) {
      for (let i = 1; i <= maxPageButtons - 1; i++) {
        buttons.push(i);
      }
      buttons.push(totalPages);
      return buttons;
    }
    
    // Jika halaman saat ini dekat dengan akhir
    if (currentPage >= totalPages - Math.floor(maxPageButtons / 2)) {
      buttons.push(1);
      for (let i = totalPages - (maxPageButtons - 2); i <= totalPages; i++) {
        buttons.push(i);
      }
      return buttons;
    }
    
    // Jika halaman saat ini di tengah
    buttons.push(1);
    for (let i = currentPage - Math.floor((maxPageButtons - 3) / 2); i <= currentPage + Math.ceil((maxPageButtons - 3) / 2); i++) {
      buttons.push(i);
    }
    buttons.push(totalPages);
    return buttons;
  };

  const pageButtons = getPageButtons();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <FiChevronLeft />
      </Button>
      
      {pageButtons.map((page, index) => {
        // Tambahkan ellipsis jika ada gap
        if (index > 0 && page > pageButtons[index - 1] + 1) {
          return (
            <React.Fragment key={`ellipsis-${index}`}>
              <span className="px-2">...</span>
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            </React.Fragment>
          );
        }
        
        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <FiChevronRight />
      </Button>
    </div>
  );
} 