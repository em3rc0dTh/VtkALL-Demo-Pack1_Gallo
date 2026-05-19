import { NextResponse } from 'next/server';

export function proxy(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Proteger dashboard si no hay token
  if (pathname.startsWith('/admin/dashboard')) {
    if (!token) {
      const url = new URL('/admin/login', request.url);
      return NextResponse.redirect(url);
    }
  }

  // Redirigir fuera de login si ya hay token activo
  if (pathname === '/admin/login') {
    if (token) {
      const url = new URL('/admin/dashboard', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/login'],
};
