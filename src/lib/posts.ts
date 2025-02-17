import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import { Article, SingleItemResponse } from './types'

const postsDirectory = path.join(process.cwd(), 'data', 'md')

export interface PostData extends Article {
  id: string;
  contentHtml?: string;
}

export function getSortedPostsData(): SingleItemResponse<Article[]> {
  try {
    // Get file names under /data/md
    const fileNames = fs.readdirSync(postsDirectory)
    const allPostsData = fileNames.map((fileName): Article => {
      // Remove ".md" from file name to get id
      const id = fileName.replace(/\.md$/, '')

      // Read markdown file as string
      const fullPath = path.join(postsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')

      // Use gray-matter to parse the post metadata section
      const matterResult = matter(fileContents)

      return {
        title: matterResult.data.title || '',
        description: matterResult.data.description || '',
        date: matterResult.data.date || new Date().toISOString(),
        lastModified: matterResult.data.lastModified || new Date().toISOString(),
        path: `data/md/${fileName}`
      }
    })

    // Sort posts by date
    const sortedPosts = allPostsData.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return {
      success: true,
      data: sortedPosts
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Failed to get posts data'
    }
  }
}

export async function getPostData(slug: string): Promise<SingleItemResponse<PostData>> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents)

    // Use remark to convert markdown into HTML string
    const processedContent = await remark()
      .use(html)
      .process(matterResult.content)
    const contentHtml = processedContent.toString()

    const postData: PostData = {
      id: slug,
      title: matterResult.data.title || '',
      description: matterResult.data.description || '',
      date: matterResult.data.date || new Date().toISOString(),
      lastModified: matterResult.data.lastModified || new Date().toISOString(),
      path: `data/md/${slug}.md`,
      contentHtml
    }

    return {
      success: true,
      data: postData
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get post data'
    }
  }
}

// Deprecated: Use getPostData instead
export async function getPostData2(id: string): Promise<SingleItemResponse<PostData>> {
  return getPostData(id)
}