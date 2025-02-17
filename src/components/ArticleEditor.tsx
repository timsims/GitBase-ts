'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Article } from '@/lib/types'

interface EditableArticle extends Omit<Article, 'lastModified'> {
  content: string
}

interface ArticleApiResponse {
  success: boolean
  data?: EditableArticle
  message?: string
}

interface ValidationError {
  field: keyof EditableArticle
  message: string
}

function validateArticle(article: EditableArticle): ValidationError[] {
  const errors: ValidationError[] = []

  if (!article.title.trim()) {
    errors.push({ field: 'title', message: 'Title is required' })
  } else if (article.title.length > 100) {
    errors.push({ field: 'title', message: 'Title must be less than 100 characters' })
  }

  if (!article.description.trim()) {
    errors.push({ field: 'description', message: 'Description is required' })
  } else if (article.description.length > 200) {
    errors.push({ field: 'description', message: 'Description must be less than 200 characters' })
  }

  if (!article.content.trim()) {
    errors.push({ field: 'content', message: 'Content is required' })
  }

  return errors
}

export function ArticleEditor() {
  const [article, setArticle] = useState<EditableArticle>({
    title: '',
    description: '',
    content: '',
    path: '',
    date: new Date().toISOString()
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const searchParams = useSearchParams()
  const path = searchParams.get('path')

  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (!path) {
        setApiError('No article path provided')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/articles?path=${encodeURIComponent(decodeURIComponent(path))}`)
        if (!response.ok) {
          throw new Error('Failed to fetch article')
        }

        const { success, data, message }: ArticleApiResponse = await response.json()

        if (!success || !data) {
          throw new Error(message || 'Failed to fetch article data')
        }

        if (mounted) {
          setArticle(data)
          setIsDirty(false)
        }
      } catch (error) {
        console.error('Error fetching article:', error)
        if (mounted) {
          setApiError(error instanceof Error ? error.message : 'Failed to fetch article. Please try again.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [path])

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setArticle((prev) => ({ ...prev, [name]: value }))
    setIsDirty(true)
    setValidationErrors([])
    if (apiError) setApiError(null)
  }

  const handleSave = async () => {
    const errors = validateArticle(article)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsSaving(true)
    setApiError(null)
    setValidationErrors([])

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article }),
      })

      const { success, message }: ArticleApiResponse = await response.json()

      if (!success) {
        throw new Error(message || 'Failed to save article')
      }

      setIsDirty(false)
    } catch (error) {
      console.error('Error saving article:', error)
      setApiError(error instanceof Error ? error.message : 'Failed to save article. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <p className="text-muted-foreground">Loading article...</p>
      </div>
    )
  }

  const getFieldError = (field: keyof EditableArticle) =>
    validationErrors.find(error => error.field === field)?.message

  return (
    <div className="space-y-4 max-w-4xl mx-auto p-4">
      {apiError && (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Input
          name="title"
          value={article.title}
          onChange={handleInputChange}
          placeholder="Article Title"
          className="text-lg font-medium"
          aria-label="Article Title"
          aria-invalid={!!getFieldError('title')}
          aria-describedby={getFieldError('title') ? 'title-error' : undefined}
          required
        />
        {getFieldError('title') && (
          <p id="title-error" className="text-sm text-destructive">
            {getFieldError('title')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Input
          name="description"
          value={article.description}
          onChange={handleInputChange}
          placeholder="Article Description"
          className="text-gray-600"
          aria-label="Article Description"
          aria-invalid={!!getFieldError('description')}
          aria-describedby={getFieldError('description') ? 'description-error' : undefined}
          required
        />
        {getFieldError('description') && (
          <p id="description-error" className="text-sm text-destructive">
            {getFieldError('description')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Textarea
          name="content"
          value={article.content}
          onChange={handleInputChange}
          placeholder="Article Content (Markdown supported)"
          rows={20}
          className="font-mono"
          aria-label="Article Content"
          aria-invalid={!!getFieldError('content')}
          aria-describedby={getFieldError('content') ? 'content-error' : undefined}
          required
        />
        {getFieldError('content') && (
          <p id="content-error" className="text-sm text-destructive">
            {getFieldError('content')}
          </p>
        )}
      </div>

      <div className="flex justify-between items-center">
        {isDirty && (
          <p className="text-sm text-muted-foreground">
            You have unsaved changes
          </p>
        )}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}