/**
 * Membuat query string dari object parameter
 * @param params - Object parameter yang akan diubah menjadi query string
 * @returns String query parameter dengan prefix '?' jika ada parameter
 */
export function createQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  
  const searchParams = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
} 