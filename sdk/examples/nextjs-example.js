/**
 * Contoh penggunaan SDK di Next.js API Route (Pages Router)
 */

// pages/api/hello.js
import ErrorReporting from '../../sdk';

// Inisialisasi SDK - ini sebaiknya dilakukan di file terpisah seperti lib/error-reporting.js
ErrorReporting.init({
  dsn: 'your-project-dsn',
  apiUrl: 'https://your-api-url.com',
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
});

// Bungkus handler dengan middleware dari SDK
export default ErrorReporting.nextApiMiddleware(async (req, res) => {
  try {
    // Logika API Route
    const { name = 'World' } = req.query;
    
    ErrorReporting.addBreadcrumb({
      category: 'api',
      message: 'Processing request',
      data: { query: req.query }
    });
    
    // Simulasi operasi database
    await simulateDatabaseOperation();
    
    return res.status(200).json({ message: `Hello, ${name}!` });
  } catch (error) {
    // Error akan ditangkap oleh middleware
    throw error;
  }
});

async function simulateDatabaseOperation() {
  // Simulasi operasi yang berhasil atau gagal secara acak
  const success = Math.random() > 0.3;
  
  if (!success) {
    const error = new Error('Database connection failed');
    error.code = 'DB_CONNECTION_ERROR';
    throw error;
  }
  
  return { success: true };
}

/**
 * Contoh penggunaan SDK di Next.js App Router (middleware.js)
 */

// middleware.js
import { NextResponse } from 'next/server';
import ErrorReporting from './sdk';

// Inisialisasi SDK
ErrorReporting.init({
  dsn: 'your-project-dsn',
  apiUrl: 'https://your-api-url.com',
  environment: process.env.NODE_ENV,
});

export async function middleware(request) {
  try {
    // Middleware logic - misalnya autentikasi
    const token = request.cookies.get('token')?.value;
    
    // Track request sebagai breadcrumb
    ErrorReporting.addBreadcrumb({
      category: 'middleware',
      message: `Request to ${request.nextUrl.pathname}`,
      data: { 
        path: request.nextUrl.pathname,
        hasToken: !!token 
      }
    });
    
    if (!token && isProtectedRoute(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    // Tangkap error di middleware
    ErrorReporting.captureException(error, {
      url: request.url,
      method: request.method,
      path: request.nextUrl.pathname,
      extraContext: {
        cookies: sanitizeCookies(request.cookies),
      }
    });
    
    // Tetap perlu mengembalikan response
    return NextResponse.next();
  }
}

function isProtectedRoute(pathname) {
  const protectedPaths = ['/dashboard', '/profile', '/settings'];
  return protectedPaths.some(path => pathname.startsWith(path));
}

function sanitizeCookies(cookies) {
  // Hanya simpan nama cookies, bukan nilai
  return Array.from(cookies.keys());
}

// Tentukan path yang perlu diproses oleh middleware
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

/**
 * Contoh penggunaan SDK di Next.js App Router (Route Handler)
 */

// app/api/posts/route.js
import { NextResponse } from 'next/server';
import ErrorReporting from '../../../sdk';
import { withErrorReporting } from '../../../sdk';

// Inisialisasi SDK
ErrorReporting.init({
  dsn: 'your-project-dsn',
  environment: process.env.NODE_ENV,
});

export const GET = withErrorReporting(
  async (request) => {
    try {
      // Get posts logic
      const posts = await fetchPosts();
      
      return NextResponse.json({ posts });
    } catch (error) {
      // Error akan ditangkap oleh middleware withErrorReporting
      // tetapi kita juga bisa menambahkan konteks tambahan
      error.customContext = { source: 'posts-api' };
      throw error;
    }
  }
);

export const POST = withErrorReporting(
  async (request) => {
    try {
      const data = await request.json();
      
      // Validasi
      if (!data.title) {
        const error = new Error('Title is required');
        error.status = 400;
        throw error;
      }
      
      // Simpan post
      const newPost = await createPost(data);
      
      return NextResponse.json({ post: newPost }, { status: 201 });
    } catch (error) {
      if (error.status === 400) {
        // Format error response untuk validation errors
        return NextResponse.json(
          { error: error.message }, 
          { status: 400 }
        );
      }
      
      // Error akan ditangkap oleh middleware withErrorReporting
      throw error;
    }
  }
);

async function fetchPosts() {
  // Simulasi fetch posts
  return [
    { id: 1, title: 'Hello World' },
    { id: 2, title: 'Next.js is awesome' }
  ];
}

async function createPost(data) {
  // Simulasi create post
  return { 
    id: Math.floor(Math.random() * 1000),
    ...data,
    createdAt: new Date().toISOString()
  };
} 