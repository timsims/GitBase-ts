import { Metadata } from 'next'
import { ArticleList } from '@/components/ArticleList'
import { getSortedPostsData } from '@/lib/posts'
import { Article } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Read our latest articles on web development, GitHub tips, and best practices.',
}

export default function Articles() {
  const { success, data = [] } = getSortedPostsData()
  const articles: Article[] = success ? data : []

  return (
    <div className="container mx-auto py-12">
      <ArticleList articles={articles} showMoreLink={false} />
    </div>
  )
}