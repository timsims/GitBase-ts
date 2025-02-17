'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Github } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NavItem {
  path: string
  label: string
}

interface AuthResponse {
  isLoggedIn: boolean
  message?: string
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home' },
  { path: '/resources', label: 'Resources' },
  { path: '/posts', label: 'Articles' },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkLoginStatus = useCallback(async () => {
    if (!isLoading) return
    setError(null)

    try {
      const response = await fetch('/api/check-auth')
      if (!response.ok) {
        throw new Error('Failed to check authentication status')
      }

      const data: AuthResponse = await response.json()
      setIsLoggedIn(data.isLoggedIn)
    } catch (error) {
      console.error('Failed to check auth status:', error)
      setError('Failed to verify authentication status')
      setIsLoggedIn(false)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      if (isMounted) {
        await checkLoginStatus()
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [checkLoginStatus])

  const handleLogout = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/logout', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Logout failed')
      }

      setIsLoggedIn(false)
      router.push('/')
    } catch (error) {
      console.error('Failed to logout:', error)
      setError('Failed to logout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold">GitBase</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  item.path === pathname && "text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/qiayue/gitbase"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub Repository"
          >
            <Github className="h-5 w-5" />
          </Link>
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          {!isLoading && (
            isLoggedIn ? (
              <>
                <Link href="/admin">
                  <Button variant="ghost">Admin</Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging out...' : 'Logout'}
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button>Login</Button>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  )
}