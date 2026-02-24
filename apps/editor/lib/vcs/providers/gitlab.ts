import type {
  VCSProvider,
  VCSRepo,
  VCSFile,
  VCSCommitResult,
  VCSPullRequest,
} from '../types'

const GITLAB_API = 'https://gitlab.com/api/v4'

interface GLProject {
  id: number
  name: string
  path: string
  path_with_namespace: string
  namespace: { path: string }
  default_branch: string
  visibility: 'public' | 'internal' | 'private'
}

interface GLTreeItem {
  id: string
  name: string
  type: 'blob' | 'tree'
  path: string
}

interface GLFile {
  content: string
  encoding: string
  last_commit_id: string
  file_name: string
  file_path: string
}

interface GLMR {
  iid: number
  web_url: string
  title: string
  state: string
}

interface GLFileResponse {
  file_path: string
  branch: string
}

export class GitLabProvider implements VCSProvider {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${GITLAB_API}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        (error as { message?: string }).message || `GitLab API error: ${response.status}`
      )
    }

    return response.json()
  }

  private projectId(owner: string, repo: string): string {
    return encodeURIComponent(`${owner}/${repo}`)
  }

  async listRepos(): Promise<VCSRepo[]> {
    const projects = await this.fetch<GLProject[]>(
      '/projects?membership=true&order_by=last_activity_at&per_page=100'
    )
    return projects.map((p) => ({
      id: p.id,
      name: p.path,
      fullName: p.path_with_namespace,
      owner: p.namespace.path,
      defaultBranch: p.default_branch || 'main',
      private: p.visibility === 'private',
    }))
  }

  async getTrails(owner: string, repo: string, branch?: string): Promise<VCSFile[]> {
    const trails: VCSFile[] = []
    const pid = this.projectId(owner, repo)
    const searchPaths = ['', 'tours', 'trails', 'src/trails', 'src/tours']
    const ref = branch ? encodeURIComponent(branch) : 'HEAD'

    for (const basePath of searchPaths) {
      try {
        const pathParam = basePath ? `&path=${encodeURIComponent(basePath)}` : ''
        const items = await this.fetch<GLTreeItem[]>(
          `/projects/${pid}/repository/tree?ref=${ref}&per_page=100${pathParam}`
        )

        for (const item of items) {
          if (item.type === 'blob' && item.name.endsWith('.trail.json')) {
            trails.push({ name: item.name, path: item.path, sha: item.id })
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
    const pid = this.projectId(owner, repo)
    const filePath = encodeURIComponent(path)
    const ref = branch ? encodeURIComponent(branch) : 'HEAD'

    const file = await this.fetch<GLFile>(
      `/projects/${pid}/repository/files/${filePath}?ref=${ref}`
    )

    const content = atob(file.content.replace(/\n/g, ''))
    return { content, sha: file.last_commit_id }
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
    const pid = this.projectId(owner, repo)
    const filePath = encodeURIComponent(path)
    // Use default branch if none specified
    const targetBranch = branch || (await this.getDefaultBranch(owner, repo))

    const body = {
      branch: targetBranch,
      content: btoa(content),
      encoding: 'base64',
      commit_message: message,
    }

    // If sha is provided the file exists; use PUT (update). Otherwise try POST (create).
    const method = sha ? 'PUT' : 'POST'

    try {
      await this.fetch<GLFileResponse>(
        `/projects/${pid}/repository/files/${filePath}`,
        { method, body: JSON.stringify(body) }
      )
    } catch (err) {
      // If POST fails because file already exists, retry with PUT
      if (!sha && err instanceof Error && err.message.includes('already exists')) {
        await this.fetch<GLFileResponse>(
          `/projects/${pid}/repository/files/${filePath}`,
          { method: 'PUT', body: JSON.stringify(body) }
        )
      } else {
        throw err
      }
    }

    // GitLab file create/update API doesn't return a commit object —
    // fetch the latest commit on the branch to get sha + url
    const commits = await this.fetch<Array<{ id: string; web_url: string }>>(
      `/projects/${pid}/repository/commits?ref_name=${encodeURIComponent(branch || 'HEAD')}&per_page=1`
    )
    const latest = commits[0]
    return { sha: latest?.id ?? '', url: latest?.web_url ?? '' }
  }

  private async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const pid = this.projectId(owner, repo)
    const project = await this.fetch<GLProject>(`/projects/${pid}`)
    return project.default_branch || 'main'
  }

  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    baseBranch: string
  ): Promise<void> {
    const pid = this.projectId(owner, repo)
    await this.fetch(`/projects/${pid}/repository/branches`, {
      method: 'POST',
      body: JSON.stringify({ branch: branchName, ref: baseBranch }),
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
    const pid = this.projectId(owner, repo)
    const mr = await this.fetch<GLMR>(`/projects/${pid}/merge_requests`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        description: body,
        source_branch: headBranch,
        target_branch: baseBranch,
      }),
    })

    return { number: mr.iid, url: mr.web_url, title: mr.title, state: mr.state }
  }

  async createTrailPR(
    owner: string,
    repo: string,
    trail: object,
    trailPath: string,
    prTitle: string
  ): Promise<VCSPullRequest> {
    const baseBranch = await this.getDefaultBranch(owner, repo)
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
