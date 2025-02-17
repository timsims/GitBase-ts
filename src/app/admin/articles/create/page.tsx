'use client'

import { useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface NewArticle {
  title: string
  description: string
  content: string
  slug: string
}

interface CreateArticleResponse {
  success: boolean
  error?: string
}

export default function CreateArticlePage() {
  const [article, setArticle] = useState<NewArticle>({
    title: '',
    description: '',
    content: '',
    slug: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setArticle(prev => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  const validateArticle = (): string | null => {
    if (!article.title.trim()) return 'Title is required'
    if (!article.description.trim()) return 'Description is required'
    if (!article.content.trim()) return 'Content is required'
    if (!article.slug.trim()) return 'Slug is required'

    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) {
      return 'Slug must contain only lowercase letters, numbers, and hyphens'
    }

    return null
  }

  const handleSave = async () => {
    const validationError = validateArticle()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/articles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article),
      })

      const data: CreateArticleResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create article')
      }

      router.push('/admin/articles')
    } catch (error) {
      console.error('Error creating article:', error)
      setError(error instanceof Error ? error.message : 'Failed to create article')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create New Article</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/articles')}
        >
          Back to Articles
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <Input
            id="title"
            name="title"
            value={article.title}
            onChange={handleInputChange}
            placeholder="Article Title"
            disabled={isLoading}
            aria-label="Article Title"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <Input
            id="description"
            name="description"
            value={article.description}
            onChange={handleInputChange}
            placeholder="Article Description"
            disabled={isLoading}
            aria-label="Article Description"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="text-sm font-medium">
            Slug
          </label>
          <Input
            id="slug"
            name="slug"
            value={article.slug}
            onChange={handleInputChange}
            placeholder="Article Slug (e.g., my-new-article)"
            disabled={isLoading}
            aria-label="Article Slug"
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            required
          />
          <p className="text-sm text-muted-foreground">
            Use lowercase letters, numbers, and hyphens only
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="text-sm font-medium">
            Content
          </label>
          <Textarea
            id="content"
            name="content"
            value={article.content}
            onChange={handleInputChange}
            placeholder="Article Content (Markdown)"
            rows={20}
            disabled={isLoading}
            aria-label="Article Content"
            className="font-mono"
            required
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isLoading || !article.title.trim() || !article.content.trim()}
          >
            {isLoading ? 'Creating...' : 'Create Article'}
          </Button>
        </div>
      </div>
    </div>
  )
}