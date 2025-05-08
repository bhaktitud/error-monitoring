/**
 * Format tanggal ke format yang sesuai untuk UI
 * @param dateString ISO string tanggal yang akan diformat
 * @returns String tanggal yang sudah diformat
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  // Cek apakah tanggal valid
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Format tanggal relatif (misalnya "5 menit yang lalu")
 * @param dateString ISO string tanggal yang akan diformat
 * @returns String tanggal relatif
 */
export function formatRelativeDate(dateString: string): string {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  // Cek apakah tanggal valid
  if (isNaN(date.getTime())) return '-';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'Baru saja';
  } else if (diffMin < 60) {
    return `${diffMin} menit yang lalu`;
  } else if (diffHour < 24) {
    return `${diffHour} jam yang lalu`;
  } else if (diffDay < 30) {
    return `${diffDay} hari yang lalu`;
  } else {
    return formatDate(dateString);
  }
} 