import Link from 'next/link'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Article } from '@/lib/types'

interface ArticleListProps {
  articles: Article[]
  showMoreLink?: boolean
}

export function ArticleList({ articles, showMoreLink = true }: ArticleListProps) {
  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tighter">Articles</h2>
        {showMoreLink && (
          <Link href="/posts" className="text-blue-600 hover:text-blue-800 transition-colors">
            More articles →
          </Link>
        )}
      </div>
      <div className="space-y-6">
        {articles.map((article) => (
          <Card key={article.path}>
            <CardHeader>
              <Link
                href={`/posts/${article.path.replace(/^data\/md\/(.+)\.md$/, '$1')}`}
                className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
              >
                <CardTitle>{article.title}</CardTitle>
                →
              </Link>
              <CardDescription>{article.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}