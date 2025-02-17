import { NextResponse } from 'next/server'

interface LogoutResponse {
  message: string
}

export async function POST(): Promise<NextResponse<LogoutResponse>> {
  try {
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )

    // Clear auth cookie
    response.cookies.set({
      name: 'auth_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { message: 'Failed to logout' },
      { status: 500 }
    )
  }
}