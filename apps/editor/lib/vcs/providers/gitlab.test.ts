import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitLabProvider } from './gitlab'

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

describe('GitLabProvider', () => {
  let provider: GitLabProvider

  beforeEach(() => {
    provider = new GitLabProvider('test-token')
    mockFetch.mockReset()
  })

  describe('listRepos', () => {
    it('returns mapped projects', async () => {
      mockFetch.mockResolvedValueOnce(okResponse([
        {
          id: 42,
          name: 'my-project',
          path: 'my-project',
          path_with_namespace: 'mygroup/my-project',
          namespace: { path: 'mygroup' },
          default_branch: 'main',
          visibility: 'private',
        },
      ]))

      const repos = await provider.listRepos()

      expect(repos).toHaveLength(1)
      expect(repos[0]).toEqual({
        id: 42,
        name: 'my-project',
        fullName: 'mygroup/my-project',
        owner: 'mygroup',
        defaultBranch: 'main',
        private: true,
      })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects?membership=true'),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      )
    })

    it('throws on API error', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(401, 'Unauthorized'))
      await expect(provider.listRepos()).rejects.toThrow('Unauthorized')
    })
  })

  describe('getTrail', () => {
    it('decodes base64 content and returns last_commit_id as sha', async () => {
      const content = JSON.stringify({ id: 'tour-1', steps: [] })
      const encoded = btoa(content)

      mockFetch.mockResolvedValueOnce(okResponse({
        file_name: 'tour-1.trail.json',
        file_path: 'trails/tour-1.trail.json',
        content: encoded,
        encoding: 'base64',
        last_commit_id: 'deadbeef',
      }))

      const result = await provider.getTrail('mygroup', 'my-project', 'trails/tour-1.trail.json')

      expect(result.content).toBe(content)
      expect(result.sha).toBe('deadbeef')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('mygroup%2Fmy-project'),
        expect.anything()
      )
    })
  })

  describe('getTrails', () => {
    it('returns trail files found across search paths', async () => {
      mockFetch.mockResolvedValueOnce(okResponse([
        { id: 'blob1', name: 'onboarding.trail.json', type: 'blob', path: 'onboarding.trail.json' },
        { id: 'blob2', name: 'README.md', type: 'blob', path: 'README.md' },
      ]))
      mockFetch.mockResolvedValue(errorResponse(404, 'Not Found'))

      const trails = await provider.getTrails('mygroup', 'my-project')

      expect(trails).toHaveLength(1)
      expect(trails[0].path).toBe('onboarding.trail.json')
      expect(trails[0].sha).toBe('blob1')
    })
  })

  describe('commitFile', () => {
    it('POSTs to create new file and returns latest commit', async () => {
      // POST (create)
      mockFetch.mockResolvedValueOnce(okResponse({ file_path: 'trails/tour.trail.json', branch: 'main' }))
      // GET latest commit
      mockFetch.mockResolvedValueOnce(okResponse([
        { id: 'abc123', web_url: 'https://gitlab.com/mygroup/my-project/-/commit/abc123' },
      ]))

      const result = await provider.commitFile(
        'mygroup', 'my-project', 'trails/tour.trail.json',
        '{"id":"tour"}', 'Update tour', undefined, 'main'
      )

      expect(result.sha).toBe('abc123')
      expect(result.url).toContain('gitlab.com')

      const [url, opts] = mockFetch.mock.calls[0]
      expect(opts.method).toBe('POST')
      expect(url).toContain('mygroup%2Fmy-project')

      const body = JSON.parse(opts.body)
      expect(body.content).toBe(btoa('{"id":"tour"}'))
      expect(body.branch).toBe('main')
    })

    it('PUTs when sha is provided (update)', async () => {
      mockFetch.mockResolvedValueOnce(okResponse({ file_path: 'trails/tour.trail.json', branch: 'main' }))
      mockFetch.mockResolvedValueOnce(okResponse([
        { id: 'newsha', web_url: 'https://gitlab.com/mygroup/my-project/-/commit/newsha' },
      ]))

      await provider.commitFile(
        'mygroup', 'my-project', 'trails/tour.trail.json',
        '{"id":"tour"}', 'Update tour', 'existing-sha', 'main'
      )

      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
    })
  })

  describe('createTrailPR (merge request)', () => {
    it('creates branch, commits file, and opens MR', async () => {
      // getDefaultBranch (createTrailPR calls it)
      mockFetch.mockResolvedValueOnce(okResponse({
        id: 42, name: 'my-project', path: 'my-project',
        path_with_namespace: 'mygroup/my-project',
        namespace: { path: 'mygroup' }, default_branch: 'main', visibility: 'private',
      }))
      // createBranch
      mockFetch.mockResolvedValueOnce(okResponse({ name: 'trailguide/update-123' }))
      // commitFile POST
      mockFetch.mockResolvedValueOnce(okResponse({ file_path: 'trails/tour.trail.json', branch: 'trailguide/update-123' }))
      // commitFile GET latest commit
      mockFetch.mockResolvedValueOnce(okResponse([
        { id: 'commit-sha', web_url: 'https://gitlab.com/-/commit/commit-sha' },
      ]))
      // createPullRequest (MR)
      mockFetch.mockResolvedValueOnce(okResponse({
        iid: 3,
        web_url: 'https://gitlab.com/mygroup/my-project/-/merge_requests/3',
        title: 'Update onboarding',
        state: 'opened',
      }))

      const pr = await provider.createTrailPR(
        'mygroup', 'my-project',
        { id: 'onboarding', steps: [] },
        'trails/onboarding.trail.json',
        'Update onboarding'
      )

      expect(pr.number).toBe(3)
      expect(pr.url).toContain('merge_requests/3')
      expect(mockFetch).toHaveBeenCalledTimes(5)
    })
  })
})
