import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Paths that require authentication
const PROTECTED_PATHS = [
  '/admin',
  '/api/articles/create',
  '/api/articles/edit',
  '/api/articles/delete'
]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check if the path should be protected
  const isProtectedPath = PROTECTED_PATHS.some(protectedPath =>
    path.startsWith(protectedPath)
  )

  if (isProtectedPath) {
    // Get the token from the cookies
    const token = request.cookies.get('auth_token')?.value

    // Verify the token
    const isAuthenticated = token ? await verifyToken(token) : false

    if (!isAuthenticated) {
      // If it's an API route, return 401 Unauthorized
      if (path.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // For admin routes, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

// Configure the paths that trigger the middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/articles/:path*'
  ]
}