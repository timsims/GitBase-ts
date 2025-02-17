import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Resource } from '@/lib/types'

interface ResourceListProps {
  resources: Resource[]
  showMoreLink?: boolean
}

export function ResourceList({ resources, showMoreLink = true }: ResourceListProps) {
  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tighter">Resources</h2>
        {showMoreLink && (
          <Link href="/resources" className="text-blue-600 hover:text-blue-800 transition-colors">
            More resources →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {resources.map((resource) => (
          <Card key={resource.url}>
            <CardHeader>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
              >
                <CardTitle>{resource.name}</CardTitle>
                <ExternalLink size={16} />
              </a>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}