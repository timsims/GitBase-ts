'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface AuthResponse {
  isLoggedIn: boolean
  message?: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback: React.ReactNode
}

function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      event.preventDefault()
      setHasError(true)
      // Log to your error reporting service
      console.error('Error caught by boundary:', event.error)
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) return <>{fallback}</>
  return <>{children}</>
}

const LoadingFallback = () => (
  <div className="space-y-4 max-w-4xl mx-auto p-4">
    <Skeleton className="h-8 w-full max-w-[300px]" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-[400px] w-full" />
  </div>
)

const ErrorFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <Alert variant="destructive" className="max-w-md">
      <AlertDescription>
        Something went wrong while loading the editor. Please try refreshing the page.
      </AlertDescription>
    </Alert>
    <Button
      variant="outline"
      onClick={() => window.location.reload()}
    >
      Retry
    </Button>
  </div>
)

// Dynamically import the ArticleEditor component
const ArticleEditor = dynamic(
  () => import('@/components/ArticleEditor').then(mod => mod.ArticleEditor),
  {
    loading: LoadingFallback,
    ssr: false
  }
)

export default function ArticleEditorPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/check-auth', {
        // Add cache control headers
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to verify authentication')
      }

      const data: AuthResponse = await response.json()

      if (!data.isLoggedIn) {
        router.push('/login')
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setError(error instanceof Error ? error.message : 'Failed to authenticate. Please try again.')
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (mounted) {
        await checkAuth()
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <LoadingFallback />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setError(null)
              checkAuth()
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Article</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/articles')}
        >
          Back to Articles
        </Button>
      </div>

      <ErrorBoundary fallback={<ErrorFallback />}>
        <Suspense fallback={<LoadingFallback />}>
          <ArticleEditor />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}