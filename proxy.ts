import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the session cookie (managed by the app after authentication)
  const session = request.cookies.get('__session')?.value;

  // 1. Redirection: Unauthenticated users visiting protected pages
  if (!session && pathname.startsWith('/hub')) {
    const url = new URL('/signin', request.url);
    // Optional: Return the user back to the requested page after login
    // url.searchParams.set('callbackUrl', encodeURIComponent(pathname));
    return NextResponse.redirect(url);
  }

  // 2. Redirection: Authenticated users visiting auth pages
  if (session && (pathname === '/signin' || pathname === '/')) {
    return NextResponse.redirect(new URL('/hub/items', request.url));
  }

  return NextResponse.next();
}

// Config to optimize performance: skip proxy for static assets, api, etc.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
