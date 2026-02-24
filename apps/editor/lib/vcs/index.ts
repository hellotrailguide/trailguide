import type { VCSProvider, VCSProviderType } from './types'
import { GitHubProvider } from './providers/github'
import { GitLabProvider } from './providers/gitlab'

export function getVCSProvider(type: VCSProviderType, accessToken: string): VCSProvider {
  switch (type) {
    case 'github':
      return new GitHubProvider(accessToken)
    case 'gitlab':
      return new GitLabProvider(accessToken)
    default:
      throw new Error(`Unsupported VCS provider: ${type}`)
  }
}

export type { VCSProvider, VCSProviderType, VCSRepo, VCSFile, VCSCommitResult, VCSPullRequest } from './types'
