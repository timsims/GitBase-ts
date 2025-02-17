import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || '')
const DOMAIN = process.env.DOMAIN || 'localhost'

interface JWTPayload {
  authenticated: boolean
  domain: string
  iat?: number
  exp?: number
}

export async function verifyToken(token: string): Promise<boolean> {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set')
    return false
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const jwtPayload = payload as JWTPayload

    // Check if we're in a development environment
    if (process.env.NODE_ENV === 'development') {
      // In development, we'll accept 'localhost' or '127.0.0.1'
      return Boolean(jwtPayload && (jwtPayload.domain === 'localhost' || jwtPayload.domain === '127.0.0.1'))
    } else {
      // In production, strictly check the domain
      return Boolean(jwtPayload && jwtPayload.domain === DOMAIN)
    }
  } catch (error) {
    console.error('Token verification failed:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

export async function createToken(): Promise<string> {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set')
  }

  try {
    const token = await new SignJWT({ authenticated: true, domain: DOMAIN })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET)

    return token
  } catch (error) {
    throw new Error(`Failed to create token: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}