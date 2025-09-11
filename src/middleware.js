import { NextResponse } from 'next/server';

// Define protected routes
const protectedRoutes = [
  '/admin',
  '/Userdashboard',
  '/schedule',
  '/trends',
  '/doctors',
  '/configure',
  '/roles-permission',
  '/report'
];

// Define admin-only routes
const adminOnlyRoutes = [
  '/admin',
  '/configure',
  '/roles-permission',
  '/report'
];

export function middleware(request) {
  // Temporarily disable middleware to debug authentication flow
  // We'll re-enable it once the authentication is working
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|login|register).*)',
  ],
};
