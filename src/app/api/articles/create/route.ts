import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import matter from 'gray-matter'
import { Article } from '@/lib/types'

interface CreateArticleRequest {
  title: string
  description: string
  content: string
  slug: string
}

interface CreateArticleResponse {
  success: boolean
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

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateArticleResponse>> {
  const configError = validateGithubConfig()
  if (configError) {
    console.error(configError)
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 }
    )
  }

  try {
    const { title, description, content, slug } = await request.json() as CreateArticleRequest

    // Validate required fields
    if (!title?.trim() || !description?.trim() || !content?.trim() || !slug?.trim()) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json(
        { success: false, error: 'Invalid slug format' },
        { status: 400 }
      )
    }

    const path = `${PATHS.mdFolder}/${slug}.md`

    // Check if file already exists
    try {
      await octokit.repos.getContent({
        owner: githubConfig.owner,
        repo: githubConfig.repo,
        path,
      })
      return NextResponse.json(
        { success: false, error: 'Article with this slug already exists' },
        { status: 400 }
      )
    } catch (error) {
      // 404 means file doesn't exist, which is what we want
      if (error instanceof Error && 'status' in error && error.status !== 404) {
        throw error
      }
    }

    // Create new file
    const fileContent = matter.stringify(content, {
      title,
      description,
      date: new Date().toISOString(),
    })

    await octokit.repos.createOrUpdateFileContents({
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      path,
      message: `Create new article: ${title}`,
      content: Buffer.from(fileContent).toString('base64'),
    })

    // Sync articles
    await syncArticles()

    return NextResponse.json({
      success: true,
      message: 'Article created successfully'
    })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create article'
      },
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

    const mdFiles = files.filter(file => 'name' in file && file.name.endsWith('.md'))

    const articles = await Promise.all(mdFiles.map(async file => {
      if (!('path' in file)) {
        throw new Error(`Invalid file data for file: ${file}`)
      }

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

      const lastModified = commits[0]?.commit.committer?.date || new Date().toISOString()

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