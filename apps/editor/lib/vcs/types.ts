export type VCSProviderType = 'github' | 'gitlab'

export interface VCSRepo {
  id: number
  name: string
  fullName: string
  owner: string
  defaultBranch: string
  private: boolean
}

export interface VCSFile {
  name: string
  path: string
  sha: string
}

export interface VCSCommitResult {
  sha: string
  url: string
}

export interface VCSPullRequest {
  number: number
  url: string
  title: string
  state: string
}

export interface VCSProvider {
  listRepos(): Promise<VCSRepo[]>

  listBranches(owner: string, repo: string): Promise<string[]>

  getTrails(owner: string, repo: string, branch?: string): Promise<VCSFile[]>

  getTrail(
    owner: string,
    repo: string,
    path: string,
    branch?: string
  ): Promise<{ content: string; sha: string }>

  commitFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
    branch?: string
  ): Promise<VCSCommitResult>

  createBranch(
    owner: string,
    repo: string,
    branchName: string,
    baseBranch: string
  ): Promise<void>

  createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    headBranch: string,
    baseBranch: string
  ): Promise<VCSPullRequest>

  createTrailPR(
    owner: string,
    repo: string,
    trail: object,
    trailPath: string,
    prTitle: string,
    baseBranch?: string
  ): Promise<VCSPullRequest>
}
