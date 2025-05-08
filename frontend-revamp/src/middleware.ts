import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Rute yang tidak memerlukan autentikasi
  const isPublicPath = path === '/' || path === '/login' || path === '/register';
  
  // Cek autentikasi dari token
  const token = request.cookies.get('authToken')?.value || '';
  
  // Redirect ke login jika mengakses rute private tanpa token
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Redirect ke dashboard jika mengakses login/register dengan token
  if (isPublicPath && path !== '/' && token) {
    return NextResponse.redirect(new URL('/projects', request.url));
  }
  
  return NextResponse.next();
}

// Tentukan rute yang akan dijalankan middleware
export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/projects/:path*',
  ],
}; 