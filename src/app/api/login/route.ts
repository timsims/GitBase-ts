import { NextRequest, NextResponse } from 'next/server'
import { createToken } from '@/lib/auth'

interface LoginRequest {
  password: string
}

interface LoginResponse {
  message: string
}

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    const { password } = await request.json() as LoginRequest

    if (!process.env.ACCESS_PASSWORD) {
      console.error('ACCESS_PASSWORD environment variable is not set')
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (password === process.env.ACCESS_PASSWORD) {
      const token = await createToken()

      const response = NextResponse.json(
        { message: 'Login successful' },
        { status: 200 }
      )

      // Set auth cookie
      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600, // 1 hour
        path: '/',
      })

      return response
    }

    return NextResponse.json(
      { message: 'Invalid password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}