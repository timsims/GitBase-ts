import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import matter from 'gray-matter'
import { Article } from '@/lib/types'

interface ArticleContent extends Article {
  content: string
}

interface ArticleResponse {
  success: boolean
  data?: Article | Article[] | ArticleContent
  message?: string
  error?: string
}

interface GitHubConfig {
  owner: string
  repo: string
  token: string
}

const githubConfig: GitHubConfig = {
  owner: process.env.GITHUB_OWNER || '',
  repo: process.env.GITHUB_REPO || '',
  token: process.env.GITHUB_TOKEN || ''
}

const octokit = new Octokit({
  auth: githubConfig.token
})

const PATHS = {
  articlesJson: 'data/json/articles.json',
  mdFolder: 'data/md'
} as const

function validateGithubConfig(): string | null {
  if (!githubConfig.owner) return 'GITHUB_OWNER is not set'
  if (!githubConfig.repo) return 'GITHUB_REPO is not set'
  if (!githubConfig.token) return 'GITHUB_TOKEN is not set'
  return null
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ArticleResponse>> {
  const configError = validateGithubConfig()
  if (configError) {
    console.error(configError)
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const sync = searchParams.get('sync')
  const path = searchParams.get('path')

  try {
    if (path) {
      // Fetch single article
      try {
        const { data } = await octokit.repos.getContent({
          owner: githubConfig.owner,
          repo: githubConfig.repo,
          path: decodeURIComponent(path),
        })

        if ('content' in data) {
          const content = Buffer.from(data.content, 'base64').toString('utf8')
          const { data: frontMatter, content: articleContent } = matter(content)

          return NextResponse.json({
            success: true,
            data: {
              ...frontMatter,
              content: articleContent,
              path: data.path,
            } as ArticleContent
          })
        }
        throw new Error('Invalid content data received from GitHub')
      } catch (error) {
        console.error('Error fetching article:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch article' },
          { status: 500 }
        )
      }
    }

    if (sync === 'true') {
      await syncArticles()
    }

    const { data } = await octokit.repos.getContent({
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      path: PATHS.articlesJson,
    })

    if (!('content' in data)) {
      throw new Error('Invalid content data received from GitHub')
    }

    const content = Buffer.from(data.content, 'base64').toString('utf8')
    const articles = JSON.parse(content) as Article[]

    return NextResponse.json({ success: true, data: articles })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ArticleResponse>> {
  const configError = validateGithubConfig()
  if (configError) {
    console.error(configError)
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 }
    )
  }

  try {
    const { article } = await request.json() as { article: ArticleContent }

    // Update the MD file
    await updateMdFile(article)

    // Sync articles
    await syncArticles()

    return NextResponse.json({
      success: true,
      message: 'Article updated successfully'
    })
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

async function syncArticles(): Promise<void> {
  try {
    // Fetch all MD files
    const { data: files } = await octokit.repos.getContent({
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      path: PATHS.mdFolder,
    })

    if (!Array.isArray(files)) {
      throw new Error('Invalid response from GitHub')
    }

    const mdFiles = files.filter(file => file.name.endsWith('.md'))

    const articles = await Promise.all(mdFiles.map(async file => {
      const { data } = await octokit.repos.getContent({
        owner: githubConfig.owner,
        repo: githubConfig.repo,
        path: file.path,
      })

      if (!('content' in data)) {
        throw new Error(`Invalid content data for file: ${file.path}`)
      }

      const content = Buffer.from(data.content, 'base64').toString('utf8')
      const { data: frontMatter } = matter(content)

      // Fetch the last commit for this file
      const { data: commits } = await octokit.repos.listCommits({
        owner: githubConfig.owner,
        repo: githubConfig.repo,
        path: file.path,
        per_page: 1
      })

      const lastModified = commits[0]?.commit.committer.date || new Date().toISOString()

      return {
        title: frontMatter.title || '',
        description: frontMatter.description || '',
        date: frontMatter.date || new Date().toISOString(),
        lastModified,
        path: file.path,
      } as Article
    }))

    // Update articles.json
    const { data: currentFile } = await octokit.repos.getContent({
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      path: PATHS.articlesJson,
    })

    if (!('sha' in currentFile)) {
      throw new Error('Invalid file data received from GitHub')
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      path: PATHS.articlesJson,
      message: 'Sync articles',
      content: Buffer.from(JSON.stringify(articles, null, 2)).toString('base64'),
      sha: currentFile.sha,
    })
  } catch (error) {
    console.error('Error syncing articles:', error)
    throw error
  }
}

async function updateMdFile(article: ArticleContent): Promise<void> {
  try {
    const { data: currentFile } = await octokit.repos.getContent({
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      path: article.path,
    })

    if (!('content' in currentFile) || !('sha' in currentFile)) {
      throw new Error('Invalid file data received from GitHub')
    }

    const currentContent = Buffer.from(currentFile.content, 'base64').toString('utf8')
    const { data: frontMatter } = matter(currentContent)

    const updatedFrontMatter = {
      ...frontMatter,
      title: article.title,
      description: article.description,
      lastModified: new Date().toISOString(),
    }

    const updatedContent = matter.stringify(article.content, updatedFrontMatter)

    await octokit.repos.createOrUpdateFileContents({
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      path: article.path,
      message: `Update article: ${article.title}`,
      content: Buffer.from(updatedContent).toString('base64'),
      sha: currentFile.sha,
    })
  } catch (error) {
    console.error('Error updating MD file:', error)
    throw error
  }
}