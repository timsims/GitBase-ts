import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

interface AuthCheckResponse {
  isLoggedIn: boolean
  message?: string
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<AuthCheckResponse>> {
  try {
    const token = request.cookies.get('auth_token')?.value
    const isLoggedIn = token ? verifyToken(token) : false

    return NextResponse.json({ isLoggedIn })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      {
        isLoggedIn: false,
        message: 'Failed to verify authentication status'
      },
      { status: 500 }
    )
  }
}