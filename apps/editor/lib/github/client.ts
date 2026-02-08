// GitHub API client for repository operations

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: {
    login: string
  }
  default_branch: string
  private: boolean
}

export interface GitHubContent {
  name: string
  path: string
  sha: string
  type: 'file' | 'dir'
  content?: string // Base64 encoded
}

export interface GitHubPullRequest {
  number: number
  html_url: string
  title: string
  state: string
}

export interface GitHubCommit {
  sha: string
  html_url: string
}

const GITHUB_API = 'https://api.github.com'

async function githubFetch<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `GitHub API error: ${response.status}`)
  }

  return response.json()
}

/**
 * List repositories the user has access to
 */
export async function listRepos(accessToken: string): Promise<GitHubRepo[]> {
  const repos = await githubFetch<GitHubRepo[]>(
    '/user/repos?sort=updated&per_page=100',
    accessToken
  )
  return repos
}

/**
 * Get trail files from a repository
 * Searches for *.trail.json files or files in a tours/ directory
 */
export async function getTrails(
  owner: string,
  repo: string,
  accessToken: string
): Promise<GitHubContent[]> {
  const trails: GitHubContent[] = []

  // Try to find trails in common locations
  const searchPaths = ['', 'tours', 'trails', 'src/trails', 'src/tours']

  for (const basePath of searchPaths) {
    try {
      const endpoint = basePath
        ? `/repos/${owner}/${repo}/contents/${basePath}`
        : `/repos/${owner}/${repo}/contents`

      const contents = await githubFetch<GitHubContent[]>(endpoint, accessToken)

      for (const item of contents) {
        if (item.type === 'file' && item.name.endsWith('.trail.json')) {
          trails.push(item)
        }
      }
    } catch {
      // Directory doesn't exist or no access
    }
  }

  return trails
}

/**
 * Get a single trail file
 */
export async function getTrail(
  owner: string,
  repo: string,
  path: string,
  accessToken: string
): Promise<{ content: string; sha: string }> {
  const file = await githubFetch<GitHubContent>(
    `/repos/${owner}/${repo}/contents/${path}`,
    accessToken
  )

  if (!file.content) {
    throw new Error('File has no content')
  }

  // Decode base64 content
  const content = atob(file.content.replace(/\n/g, ''))
  return { content, sha: file.sha }
}

/**
 * Create or update a file in the repository
 */
export async function commitFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  accessToken: string,
  sha?: string,
  branch?: string
): Promise<GitHubCommit> {
  const body: Record<string, string> = {
    message,
    content: btoa(content), // Base64 encode
  }

  if (sha) {
    body.sha = sha
  }

  if (branch) {
    body.branch = branch
  }

  const result = await githubFetch<{ commit: GitHubCommit }>(
    `/repos/${owner}/${repo}/contents/${path}`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    }
  )

  return result.commit
}

/**
 * Create a new branch
 */
export async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
  baseBranch: string,
  accessToken: string
): Promise<void> {
  // Get the SHA of the base branch
  const ref = await githubFetch<{ object: { sha: string } }>(
    `/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`,
    accessToken
  )

  // Create new branch
  await githubFetch(
    `/repos/${owner}/${repo}/git/refs`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha,
      }),
    }
  )
}

/**
 * Create a pull request
 */
export async function createPullRequest(
  owner: string,
  repo: string,
  title: string,
  body: string,
  headBranch: string,
  baseBranch: string,
  accessToken: string
): Promise<GitHubPullRequest> {
  const pr = await githubFetch<GitHubPullRequest>(
    `/repos/${owner}/${repo}/pulls`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        title,
        body,
        head: headBranch,
        base: baseBranch,
      }),
    }
  )

  return pr
}

/**
 * Full flow: Create branch, commit trail, create PR
 */
export async function createTrailPR(
  owner: string,
  repo: string,
  trail: object,
  trailPath: string,
  prTitle: string,
  accessToken: string
): Promise<GitHubPullRequest> {
  // Get repo info for default branch
  const repoInfo = await githubFetch<GitHubRepo>(
    `/repos/${owner}/${repo}`,
    accessToken
  )

  const baseBranch = repoInfo.default_branch
  const branchName = `trailguide/update-${Date.now()}`

  // Create branch
  await createBranch(owner, repo, branchName, baseBranch, accessToken)

  // Commit the trail
  const trailContent = JSON.stringify(trail, null, 2)
  await commitFile(
    owner,
    repo,
    trailPath,
    trailContent,
    prTitle,
    accessToken,
    undefined,
    branchName
  )

  // Create PR
  const pr = await createPullRequest(
    owner,
    repo,
    prTitle,
    'Updated via Trailguide Pro Editor',
    branchName,
    baseBranch,
    accessToken
  )

  return pr
}
