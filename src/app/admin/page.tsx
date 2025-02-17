'use client'

import { useState, useEffect, useCallback, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Resource } from '@/lib/types'

interface AuthResponse {
  isLoggedIn: boolean
  message?: string
}

type ResourceInput = Omit<Resource, 'id'>

export default function AdminPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [newResource, setNewResource] = useState<ResourceInput>({
    name: '',
    description: '',
    url: ''
  })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/check-auth')
      const data: AuthResponse = await response.json()

      if (!data.isLoggedIn) {
        router.push('/login')
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setError('Failed to authenticate. Please try again.')
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
    fetchResources()
  }, [checkAuth])

  const fetchResources = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/resources?source=github')
      if (!response.ok) {
        throw new Error('Failed to fetch resources')
      }

      const { success, data, error } = await response.json()
      if (!success) {
        throw new Error(error || 'Failed to fetch resources')
      }

      setResources(data)
    } catch (error) {
      console.error('Error fetching resources:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch resources. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    index: number | null = null
  ) => {
    const { name, value } = e.target

    if (index !== null) {
      setResources(prevResources => {
        const updated = [...prevResources]
        updated[index] = { ...updated[index], [name]: value }
        return updated
      })
    } else {
      setNewResource(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
  }

  const validateResource = (resource: ResourceInput): string | null => {
    if (!resource.name.trim()) return 'Name is required'
    if (!resource.url.trim()) return 'URL is required'
    if (!resource.description.trim()) return 'Description is required'

    try {
      new URL(resource.url)
    } catch {
      return 'Invalid URL format'
    }

    return null
  }

  const handleSave = async (index: number) => {
    const updatedResources = [...resources]

    if (index === -1) {
      const validationError = validateResource(newResource)
      if (validationError) {
        setError(validationError)
        return
      }
      updatedResources.push(newResource)
    } else {
      const validationError = validateResource(updatedResources[index])
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedResources),
      })

      const { success, error: responseError } = await response.json()
      if (!success) {
        throw new Error(responseError || 'Failed to save resources')
      }

      await fetchResources()
      setEditingIndex(null)

      if (index === -1) {
        setNewResource({ name: '', description: '', url: '' })
      }
    } catch (error) {
      console.error('Error saving resources:', error)
      setError(error instanceof Error ? error.message : 'Failed to save resources. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div>
        <Link href="/admin/articles">
          <Button>Manage Articles</Button>
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Resource Management</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource, index) => (
              <TableRow key={resource.url}>
                <TableCell>
                  {editingIndex === index ? (
                    <Input
                      name="name"
                      value={resource.name}
                      onChange={(e) => handleInputChange(e, index)}
                      placeholder="Resource name"
                    />
                  ) : (
                    resource.name
                  )}
                </TableCell>
                <TableCell>
                  {editingIndex === index ? (
                    <Input
                      name="description"
                      value={resource.description}
                      onChange={(e) => handleInputChange(e, index)}
                      placeholder="Resource description"
                    />
                  ) : (
                    resource.description
                  )}
                </TableCell>
                <TableCell>
                  {editingIndex === index ? (
                    <Input
                      name="url"
                      value={resource.url}
                      onChange={(e) => handleInputChange(e, index)}
                      placeholder="Resource URL"
                      type="url"
                    />
                  ) : (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {resource.url}
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => editingIndex === index ? handleSave(index) : handleEdit(index)}
                    variant={editingIndex === index ? "default" : "secondary"}
                    disabled={isLoading}
                  >
                    {editingIndex === index ? 'Save' : 'Edit'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>
                <Input
                  name="name"
                  value={newResource.name}
                  onChange={(e) => handleInputChange(e)}
                  placeholder="New resource name"
                  disabled={isLoading}
                />
              </TableCell>
              <TableCell>
                <Input
                  name="description"
                  value={newResource.description}
                  onChange={(e) => handleInputChange(e)}
                  placeholder="New resource description"
                  disabled={isLoading}
                />
              </TableCell>
              <TableCell>
                <Input
                  name="url"
                  value={newResource.url}
                  onChange={(e) => handleInputChange(e)}
                  placeholder="New resource URL"
                  type="url"
                  disabled={isLoading}
                />
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => handleSave(-1)}
                  disabled={isLoading || !newResource.name.trim() || !newResource.url.trim()}
                >
                  Add New
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}