import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const { pathname } = url;
  
  // Skip middleware for Next.js internal routes and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Extract subdomain (e.g., "jett" from "jett.localhost:3000")
  const parts = hostname.split('.');
  
  // Check if there's a subdomain (more than just "localhost:3000" or "millerstorm.tech")
  // Only rewrite if there's a subdomain before the main domain
  if (parts.length >= 3 && parts[0] !== 'www' && !parts[0].includes(':')) {
    const subdomain = parts[0];
    
    // Rewrite to /[username] route
    url.pathname = `/${subdomain}${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
