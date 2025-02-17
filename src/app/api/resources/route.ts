import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { Octokit } from '@octokit/rest'
import { Resource } from '@/lib/types'

interface ResourceResponse {
  success: boolean
  data?: Resource[]
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

const PATHS = {
  githubPath: 'data/json/resources.json',
  localPath: path.join(process.cwd(), 'data', 'json', 'resources.json')
} as const

const octokit = new Octokit({
  auth: githubConfig.token
})

function validateGithubConfig(): string | null {
  if (!githubConfig.owner) return 'GITHUB_OWNER is not set'
  if (!githubConfig.repo) return 'GITHUB_REPO is not set'
  if (!githubConfig.token) return 'GITHUB_TOKEN is not set'
  return null
}

async function getResourcesFromGitHub(): Promise<Resource[]> {
  try {
    const { data } = await octokit.repos.getContent({
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      path: PATHS.githubPath,
    })

    if (!('content' in data)) {
      throw new Error('Invalid content data received from GitHub')
    }

    const content = Buffer.from(data.content, 'base64').toString('utf8')
    return JSON.parse(content) as Resource[]
  } catch (error) {
    console.error('Error fetching resources from GitHub:', error)
    throw error
  }
}

function getLocalResources(): Resource[] {
  try {
    return JSON.parse(fs.readFileSync(PATHS.localPath, 'utf8')) as Resource[]
  } catch (error) {
    console.error('Error reading local resources:', error)
    throw error
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ResourceResponse>> {
  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source')

  try {
    if (source === 'github') {
      const configError = validateGithubConfig()
      if (configError) {
        console.error(configError)
        return NextResponse.json(
          { success: false, error: 'Server configuration error' },
          { status: 500 }
        )
      }

      const resources = await getResourcesFromGitHub()
      return NextResponse.json({ success: true, data: resources })
    } else {
      // Default to local file for homepage
      const resources = getLocalResources()
      return NextResponse.json({ success: true, data: resources })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Error fetching resources:', errorMessage)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ResourceResponse>> {
  const configError = validateGithubConfig()
  if (configError) {
    console.error(configError)
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 }
    )
  }

  try {
    const updatedResources = (await request.json()) as Resource[]

    // Validate resources
    if (!Array.isArray(updatedResources) || !updatedResources.every(isValidResource)) {
      return NextResponse.json(
        { success: false, error: 'Invalid resource data' },
        { status: 400 }
      )
    }

    const { data: currentFile } = await octokit.repos.getContent({
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      path: PATHS.githubPath,
    })

    if (!('sha' in currentFile)) {
      throw new Error('Invalid file data received from GitHub')
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      path: PATHS.githubPath,
      message: 'Update resources',
      content: Buffer.from(JSON.stringify(updatedResources, null, 2)).toString('base64'),
      sha: currentFile.sha,
    })

    return NextResponse.json({
      success: true,
      data: updatedResources
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Error updating resources:', errorMessage)
    return NextResponse.json(
      { success: false, error: 'Failed to update resources' },
      { status: 500 }
    )
  }
}

function isValidResource(resource: unknown): resource is Resource {
  if (!resource || typeof resource !== 'object') return false

  const { name, description, url } = resource as Partial<Resource>

  return (
    typeof name === 'string' &&
    typeof description === 'string' &&
    typeof url === 'string' &&
    name.trim() !== '' &&
    url.trim() !== ''
  )
}