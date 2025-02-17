import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || ''
const DOMAIN = process.env.DOMAIN || 'localhost'

interface JWTPayload {
  authenticated: boolean
  domain: string
  iat?: number
  exp?: number
}

export function verifyToken(token: string): boolean {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set')
    return false
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload

    // Check if we're in a development environment
    if (process.env.NODE_ENV === 'development') {
      // In development, we'll accept 'localhost' or '127.0.0.1'
      return decoded && (decoded.domain === 'localhost' || decoded.domain === '127.0.0.1')
    } else {
      // In production, strictly check the domain
      return decoded && decoded.domain === DOMAIN
    }
  } catch (error) {
    console.error('Token verification failed:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

export function createToken(): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set')
  }

  try {
    const payload: JWTPayload = {
      authenticated: true,
      domain: DOMAIN
    }

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
  } catch (error) {
    throw new Error(`Failed to create token: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}