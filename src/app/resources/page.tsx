import fs from 'fs'
import path from 'path'
import { Metadata } from 'next'
import { ResourceList } from '@/components/ResourceList'
import { Resource } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Explore our curated list of resources for web development, GitHub, and more.',
}

export default function Resources() {
  const resourcesPath = path.join(process.cwd(), 'data', 'json', 'resources.json')
  let resources: Resource[] = []

  try {
    const fileContents = fs.readFileSync(resourcesPath, 'utf8')
    resources = JSON.parse(fileContents) as Resource[]
  } catch (error) {
    console.error('Error reading resources:', error)
    // Return empty array if file cannot be read
  }

  return (
    <div className="container mx-auto py-12">
      <ResourceList resources={resources} showMoreLink={false} />
    </div>
  )
}