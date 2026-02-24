import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitHubProvider } from './github'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function okResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    json: async () => body,
  } as Response)
}

function errorResponse(status: number, message: string) {
  return Promise.resolve({
    ok: false,
    status,
    json: async () => ({ message }),
  } as Response)
}

describe('GitHubProvider', () => {
  let provider: GitHubProvider

  beforeEach(() => {
    provider = new GitHubProvider('test-token')
    mockFetch.mockReset()
  })

  describe('listRepos', () => {
    it('returns mapped repos', async () => {
      mockFetch.mockResolvedValueOnce(okResponse([
        {
          id: 1,
          name: 'my-repo',
          full_name: 'user/my-repo',
          owner: { login: 'user' },
          default_branch: 'main',
          private: false,
        },
      ]))

      const repos = await provider.listRepos()

      expect(repos).toHaveLength(1)
      expect(repos[0]).toEqual({
        id: 1,
        name: 'my-repo',
        fullName: 'user/my-repo',
        owner: 'user',
        defaultBranch: 'main',
        private: false,
      })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/user/repos?sort=updated&per_page=100',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      )
    })

    it('throws on API error', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(401, 'Bad credentials'))
      await expect(provider.listRepos()).rejects.toThrow('Bad credentials')
    })
  })

  describe('getTrail', () => {
    it('decodes base64 content and returns sha', async () => {
      const content = JSON.stringify({ id: 'tour-1', steps: [] })
      const encoded = btoa(content)

      mockFetch.mockResolvedValueOnce(okResponse({
        name: 'tour-1.trail.json',
        path: 'trails/tour-1.trail.json',
        sha: 'abc123',
        type: 'file',
        content: encoded,
      }))

      const result = await provider.getTrail('user', 'my-repo', 'trails/tour-1.trail.json')

      expect(result.content).toBe(content)
      expect(result.sha).toBe('abc123')
    })

    it('throws when file has no content', async () => {
      mockFetch.mockResolvedValueOnce(okResponse({
        name: 'tour-1.trail.json',
        path: 'trails/tour-1.trail.json',
        sha: 'abc123',
        type: 'file',
        content: undefined,
      }))

      await expect(provider.getTrail('user', 'my-repo', 'trails/tour-1.trail.json'))
        .rejects.toThrow('File has no content')
    })
  })

  describe('getTrails', () => {
    it('returns trail files found across search paths', async () => {
      // Root path returns a .trail.json file
      mockFetch.mockResolvedValueOnce(okResponse([
        { name: 'onboarding.trail.json', path: 'onboarding.trail.json', sha: 'sha1', type: 'file' },
        { name: 'README.md', path: 'README.md', sha: 'sha2', type: 'file' },
      ]))
      // tours/ path returns another trail file
      mockFetch.mockResolvedValueOnce(okResponse([
        { name: 'setup.trail.json', path: 'tours/setup.trail.json', sha: 'sha3', type: 'file' },
      ]))
      // remaining paths return empty or throw
      mockFetch.mockResolvedValue(errorResponse(404, 'Not Found'))

      const trails = await provider.getTrails('user', 'my-repo')

      expect(trails).toHaveLength(2)
      expect(trails.map(t => t.path)).toContain('onboarding.trail.json')
      expect(trails.map(t => t.path)).toContain('tours/setup.trail.json')
    })
  })

  describe('commitFile', () => {
    it('sends PUT with base64 content and returns commit result', async () => {
      mockFetch.mockResolvedValueOnce(okResponse({
        commit: { sha: 'commit-sha', html_url: 'https://github.com/user/repo/commit/commit-sha' },
      }))

      const result = await provider.commitFile(
        'user', 'my-repo', 'trails/tour.trail.json',
        '{"id":"tour"}', 'Update tour'
      )

      expect(result.sha).toBe('commit-sha')
      expect(result.url).toContain('github.com')

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.content).toBe(btoa('{"id":"tour"}'))
      expect(body.message).toBe('Update tour')
      expect(body.sha).toBeUndefined()
    })

    it('includes sha when provided (update)', async () => {
      mockFetch.mockResolvedValueOnce(okResponse({
        commit: { sha: 'new-sha', html_url: 'https://github.com/user/repo/commit/new-sha' },
      }))

      await provider.commitFile(
        'user', 'my-repo', 'trails/tour.trail.json',
        '{"id":"tour"}', 'Update tour', 'existing-sha'
      )

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.sha).toBe('existing-sha')
    })
  })

  describe('createTrailPR', () => {
    it('creates branch, commits file, and opens PR', async () => {
      // getRepoInfo
      mockFetch.mockResolvedValueOnce(okResponse({
        id: 1, name: 'my-repo', full_name: 'user/my-repo',
        owner: { login: 'user' }, default_branch: 'main', private: false,
      }))
      // get base branch SHA
      mockFetch.mockResolvedValueOnce(okResponse({ object: { sha: 'base-sha' } }))
      // create branch
      mockFetch.mockResolvedValueOnce(okResponse({}))
      // commit file
      mockFetch.mockResolvedValueOnce(okResponse({
        commit: { sha: 'commit-sha', html_url: 'https://github.com/user/repo/commit/commit-sha' },
      }))
      // create PR
      mockFetch.mockResolvedValueOnce(okResponse({
        number: 7,
        html_url: 'https://github.com/user/my-repo/pull/7',
        title: 'Update onboarding',
        state: 'open',
      }))

      const pr = await provider.createTrailPR(
        'user', 'my-repo',
        { id: 'onboarding', steps: [] },
        'trails/onboarding.trail.json',
        'Update onboarding'
      )

      expect(pr.number).toBe(7)
      expect(pr.url).toContain('pull/7')
      expect(mockFetch).toHaveBeenCalledTimes(5)
    })
  })
})
