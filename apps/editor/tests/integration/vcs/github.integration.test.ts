/**
 * Real GitHub API integration tests.
 *
 * Required env vars (set in .env.integration or export before running):
 *   GITHUB_TEST_TOKEN  — personal access token with repo scope
 *   GITHUB_TEST_OWNER  — GitHub username or org
 *   GITHUB_TEST_REPO   — repository name (must already exist)
 *
 * Run with:
 *   npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { GitHubProvider } from '@/lib/vcs/providers/github'

const TOKEN = process.env.GITHUB_TEST_TOKEN
const OWNER = process.env.GITHUB_TEST_OWNER
const REPO = process.env.GITHUB_TEST_REPO

const TEST_BRANCH = `integration-test-${Date.now()}`
const TEST_PATH = `trails/integration-test-${Date.now()}.trail.json`
const TEST_TRAIL = { id: 'integration-test', title: 'Integration Test Trail', steps: [] }
const TEST_CONTENT = JSON.stringify(TEST_TRAIL, null, 2)

describe.skipIf(!TOKEN || !OWNER || !REPO)('GitHubProvider (real API)', () => {
  const provider = new GitHubProvider(TOKEN!)
  let defaultBranch: string
  let fileSha: string

  beforeAll(async () => {
    const repos = await provider.listRepos()
    const found = repos.find(r => r.name === REPO && r.owner === OWNER)
    defaultBranch = found!.defaultBranch
    await provider.createBranch(OWNER!, REPO!, TEST_BRANCH, defaultBranch)
  })

  afterAll(async () => {
    // Delete the test branch — removes all test commits with it
    await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${TEST_BRANCH}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )
  })

  it('lists repos and finds the test repo', async () => {
    const repos = await provider.listRepos()
    expect(repos.length).toBeGreaterThan(0)
    const found = repos.find(r => r.name === REPO && r.owner === OWNER)
    expect(found).toBeDefined()
  })

  it('uploads a trail file to the test branch', async () => {
    const result = await provider.commitFile(OWNER!, REPO!, TEST_PATH, TEST_CONTENT, 'test: upload trail', undefined, TEST_BRANCH)
    expect(result.sha).toBeTruthy()
    expect(result.url).toContain('github.com')

    const { sha } = await provider.getTrail(OWNER!, REPO!, TEST_PATH, TEST_BRANCH)
    fileSha = sha
  })

  it('downloads the uploaded trail and content matches', async () => {
    const { content, sha } = await provider.getTrail(OWNER!, REPO!, TEST_PATH, TEST_BRANCH)
    expect(JSON.parse(content)).toEqual(TEST_TRAIL)
    expect(sha).toBeTruthy()
    fileSha = sha
  })

  it('lists trails and finds the uploaded file', async () => {
    const trails = await provider.getTrails(OWNER!, REPO!, TEST_BRANCH)
    const found = trails.find(t => t.path === TEST_PATH)
    expect(found).toBeDefined()
    expect(found?.sha).toBeTruthy()
  })

  it('updates the trail on the test branch', async () => {
    const updated = { ...TEST_TRAIL, title: 'Updated Integration Test Trail' }
    const result = await provider.commitFile(
      OWNER!, REPO!, TEST_PATH,
      JSON.stringify(updated, null, 2),
      'test: update trail',
      fileSha,
      TEST_BRANCH
    )
    expect(result.sha).toBeTruthy()

    const { content, sha } = await provider.getTrail(OWNER!, REPO!, TEST_PATH, TEST_BRANCH)
    expect(JSON.parse(content).title).toBe('Updated Integration Test Trail')
    fileSha = sha
  })

  it('creates a PR with the trail change', async () => {
    const prTrail = { ...TEST_TRAIL, title: 'PR Integration Test' }
    const pr = await provider.createTrailPR(
      OWNER!, REPO!, prTrail,
      `trails/pr-test-${Date.now()}.trail.json`,
      'test: integration PR'
    )
    expect(pr.number).toBeGreaterThan(0)
    expect(pr.url).toContain('github.com')
    expect(pr.state).toBe('open')
    console.log(`Created test PR: ${pr.url}`)
  })
})
