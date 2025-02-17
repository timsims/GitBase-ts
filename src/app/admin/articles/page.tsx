'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Article } from '@/lib/types'

interface AuthResponse {
  isLoggedIn: boolean
  message?: string
}

interface ArticleResponse {
  success: boolean
  data?: Article[]
  error?: string
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/check-auth')
      const data: AuthResponse = await response.json()

      if (!data.isLoggedIn) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/login')
    }
  }, [router])

  const fetchArticles = useCallback(async (sync = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/articles${sync ? '?sync=true' : ''}`)
      if (!response.ok) {
        throw new Error('Failed to fetch articles')
      }

      const { success, data, error: responseError }: ArticleResponse = await response.json()

      if (!success) {
        throw new Error(responseError || 'Failed to fetch articles')
      }

      setArticles(data || [])
    } catch (error) {
      console.error('Error fetching articles:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch articles. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
    fetchArticles()
  }, [checkAuth, fetchArticles])

  const handleSync = useCallback(() => {
    fetchArticles(true)
  }, [fetchArticles])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[200px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md" role="alert">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Article Management</h1>

      <div className="flex justify-between items-center">
        <Link href="/admin">
          <Button variant="outline">Back to Admin Dashboard</Button>
        </Link>
        <div className="flex gap-2">
          <Button
            onClick={handleSync}
            disabled={isLoading}
          >
            {isLoading ? 'Syncing...' : 'Sync Articles'}
          </Button>
          <Link href="/admin/articles/create">
            <Button>Create New Article</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => (
              <TableRow key={article.path}>
                <TableCell className="font-medium">{article.title}</TableCell>
                <TableCell>{article.description}</TableCell>
                <TableCell>
                  {new Date(article.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </TableCell>
                <TableCell>
                  {new Date(article.lastModified).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell>
                  <Link href={`/admin/articles/edit?path=${encodeURIComponent(article.path)}`}>
                    <Button variant="secondary" size="sm">
                      Edit
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {articles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No articles found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}