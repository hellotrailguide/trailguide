import type {
  VCSProvider,
  VCSRepo,
  VCSFile,
  VCSCommitResult,
  VCSPullRequest,
} from '../types'

const GITHUB_API = 'https://api.github.com'

interface GHRepo {
  id: number
  name: string
  full_name: string
  owner: { login: string }
  default_branch: string
  private: boolean
}

interface GHContent {
  name: string
  path: string
  sha: string
  type: 'file' | 'dir'
  content?: string
}

interface GHPR {
  number: number
  html_url: string
  title: string
  state: string
}

interface GHCommit {
  sha: string
  html_url: string
}

export class GitHubProvider implements VCSProvider {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${GITHUB_API}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error((error as { message?: string }).message || `GitHub API error: ${response.status}`)
    }

    return response.json()
  }

  async listBranches(owner: string, repo: string): Promise<string[]> {
    const branches = await this.fetch<Array<{ name: string }>>(
      `/repos/${owner}/${repo}/branches?per_page=100`
    )
    return branches.map((b) => b.name)
  }

  async listRepos(): Promise<VCSRepo[]> {
    const repos = await this.fetch<GHRepo[]>('/user/repos?sort=updated&per_page=100')
    return repos.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner.login,
      defaultBranch: r.default_branch,
      private: r.private,
    }))
  }

  async getTrails(owner: string, repo: string, branch?: string): Promise<VCSFile[]> {
    const trails: VCSFile[] = []
    const searchPaths = ['', 'tours', 'trails', 'src/trails', 'src/tours']
    const refParam = branch ? `?ref=${encodeURIComponent(branch)}` : ''

    for (const basePath of searchPaths) {
      try {
        const endpoint = basePath
          ? `/repos/${owner}/${repo}/contents/${basePath}${refParam}`
          : `/repos/${owner}/${repo}/contents${refParam}`

        const contents = await this.fetch<GHContent[]>(endpoint)

        for (const item of contents) {
          if (item.type === 'file' && item.name.endsWith('.trail.json')) {
            trails.push({ name: item.name, path: item.path, sha: item.sha })
          }
        }
      } catch {
        // Directory doesn't exist or no access
      }
    }

    return trails
  }

  async getTrail(
    owner: string,
    repo: string,
    path: string,
    branch?: string
  ): Promise<{ content: string; sha: string }> {
    const refParam = branch ? `?ref=${encodeURIComponent(branch)}` : ''
    const file = await this.fetch<GHContent>(`/repos/${owner}/${repo}/contents/${path}${refParam}`)

    if (!file.content) {
      throw new Error('File has no content')
    }

    const content = atob(file.content.replace(/\n/g, ''))
    return { content, sha: file.sha }
  }

  async commitFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
    branch?: string
  ): Promise<VCSCommitResult> {
    const body: Record<string, string> = {
      message,
      content: btoa(content),
    }

    if (sha) body.sha = sha
    if (branch) body.branch = branch

    const result = await this.fetch<{ commit: GHCommit }>(
      `/repos/${owner}/${repo}/contents/${path}`,
      { method: 'PUT', body: JSON.stringify(body) }
    )

    return { sha: result.commit.sha, url: result.commit.html_url }
  }

  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    baseBranch: string
  ): Promise<void> {
    const ref = await this.fetch<{ object: { sha: string } }>(
      `/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`
    )

    await this.fetch(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha,
      }),
    })
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    headBranch: string,
    baseBranch: string
  ): Promise<VCSPullRequest> {
    const pr = await this.fetch<GHPR>(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({ title, body, head: headBranch, base: baseBranch }),
    })

    return { number: pr.number, url: pr.html_url, title: pr.title, state: pr.state }
  }

  async createTrailPR(
    owner: string,
    repo: string,
    trail: object,
    trailPath: string,
    prTitle: string,
    baseBranch?: string
  ): Promise<VCSPullRequest> {
    if (!baseBranch) {
      const repoInfo = await this.fetch<GHRepo>(`/repos/${owner}/${repo}`)
      baseBranch = repoInfo.default_branch
    }
    const branchName = `trailguide/update-${Date.now()}`

    await this.createBranch(owner, repo, branchName, baseBranch)

    const trailContent = JSON.stringify(trail, null, 2)
    await this.commitFile(owner, repo, trailPath, trailContent, prTitle, undefined, branchName)

    return this.createPullRequest(
      owner,
      repo,
      prTitle,
      'Updated via Trailguide Pro Editor',
      branchName,
      baseBranch
    )
  }
}
