import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Routes protégées
  const isAdminRoute = pathname.startsWith('/admin');
  const isSuperAdminRoute = pathname.startsWith('/super-admin');

  // Si c'est une route protégée et pas de session auth
  // Note: Next.js middleware ne peut pas directement accéder à Firebase Auth
  // La vérification réelle se fait côté client dans les pages

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/super-admin/:path*']
};