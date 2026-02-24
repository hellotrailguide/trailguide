/**
 * Real GitLab API integration tests.
 *
 * Required env vars (set in .env.integration or export before running):
 *   GITLAB_TEST_TOKEN  — personal access token with api scope
 *   GITLAB_TEST_OWNER  — GitLab namespace (username or group path)
 *   GITLAB_TEST_REPO   — project path (must already exist)
 *
 * Run with:
 *   npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { GitLabProvider } from '@/lib/vcs/providers/gitlab'

const TOKEN = process.env.GITLAB_TEST_TOKEN
const OWNER = process.env.GITLAB_TEST_OWNER
const REPO = process.env.GITLAB_TEST_REPO

const TEST_BRANCH = `integration-test-${Date.now()}`
const TEST_PATH = `trails/integration-test-${Date.now()}.trail.json`
const TEST_TRAIL = { id: 'integration-test', title: 'Integration Test Trail', steps: [] }
const TEST_CONTENT = JSON.stringify(TEST_TRAIL, null, 2)

describe.skipIf(!TOKEN || !OWNER || !REPO)('GitLabProvider (real API)', () => {
  const provider = new GitLabProvider(TOKEN!)
  let defaultBranch: string

  beforeAll(async () => {
    const repos = await provider.listRepos()
    const found = repos.find(r => r.owner === OWNER && r.name === REPO)
    defaultBranch = found!.defaultBranch
    await provider.createBranch(OWNER!, REPO!, TEST_BRANCH, defaultBranch)
  })

  afterAll(async () => {
    // Delete the test branch — removes all test commits with it
    const projectId = encodeURIComponent(`${OWNER}/${REPO}`)
    await fetch(
      `https://gitlab.com/api/v4/projects/${projectId}/repository/branches/${TEST_BRANCH}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${TOKEN}` },
      }
    )
  })

  it('lists repos and finds the test project', async () => {
    const repos = await provider.listRepos()
    expect(repos.length).toBeGreaterThan(0)
    const found = repos.find(r => r.owner === OWNER && r.name === REPO)
    expect(found).toBeDefined()
  })

  it('uploads a trail file to the test branch', async () => {
    const result = await provider.commitFile(
      OWNER!, REPO!, TEST_PATH, TEST_CONTENT, 'test: upload trail',
      undefined, TEST_BRANCH
    )
    expect(result.sha).toBeTruthy()
  })

  it('downloads the uploaded trail and content matches', async () => {
    const { content, sha } = await provider.getTrail(OWNER!, REPO!, TEST_PATH, TEST_BRANCH)
    expect(JSON.parse(content)).toEqual(TEST_TRAIL)
    expect(sha).toBeTruthy()
  })

  it('lists trails and finds the uploaded file', async () => {
    const trails = await provider.getTrails(OWNER!, REPO!, TEST_BRANCH)
    const found = trails.find(t => t.path === TEST_PATH)
    expect(found).toBeDefined()
  })

  it('updates the trail on the test branch', async () => {
    const updated = { ...TEST_TRAIL, title: 'Updated Integration Test Trail' }
    const result = await provider.commitFile(
      OWNER!, REPO!, TEST_PATH,
      JSON.stringify(updated, null, 2),
      'test: update trail',
      'force-update',
      TEST_BRANCH
    )
    expect(result.sha).toBeTruthy()

    const { content } = await provider.getTrail(OWNER!, REPO!, TEST_PATH, TEST_BRANCH)
    expect(JSON.parse(content).title).toBe('Updated Integration Test Trail')
  })

  it('creates a merge request with the trail change', async () => {
    const mrTrail = { ...TEST_TRAIL, title: 'MR Integration Test' }
    const mr = await provider.createTrailPR(
      OWNER!, REPO!, mrTrail,
      `trails/mr-test-${Date.now()}.trail.json`,
      'test: integration MR'
    )
    expect(mr.number).toBeGreaterThan(0)
    expect(mr.url).toContain('gitlab.com')
    expect(mr.state).toBe('opened')
    console.log(`Created test MR: ${mr.url}`)
  })
})
