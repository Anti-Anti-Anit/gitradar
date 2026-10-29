const API = 'https://api.github.com'
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''

export const stats = { requests: 0, remaining: null, searchCalls: 0 }

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let lastSearchAt = 0

// GitHub Search API 限流 30 次/分钟，这里做简单的节流
async function throttleSearch() {
  const gap = 2300
  const wait = lastSearchAt + gap - Date.now()
  if (wait > 0) await sleep(wait)
  lastSearchAt = Date.now()
}

async function request(path, { retries = 4 } = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'gitradar-collector',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`

  for (let attempt = 0; attempt <= retries; attempt++) {
    let res
    try {
      res = await fetch(API + path, { headers, signal: AbortSignal.timeout(30_000) })
    } catch (err) {
      if (attempt === retries) throw err
      await sleep(1500 * (attempt + 1))
      continue
    }

    stats.requests++
    const remaining = res.headers.get('x-ratelimit-remaining')
    if (remaining !== null) stats.remaining = Number(remaining)

    if (res.ok) return res.json()

    const retryable = res.status === 403 || res.status === 429 || res.status >= 500
    if (retryable && attempt < retries) {
      const retryAfter = Number(res.headers.get('retry-after'))
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 + 500 : 8000 * (attempt + 1)
      console.warn(`  ! ${res.status} on ${path}，${Math.round(wait / 1000)}s 后重试`)
      await sleep(wait)
      continue
    }
    const body = await res.text().catch(() => '')
    throw new Error(`GitHub API ${res.status} ${path}: ${body.slice(0, 200)}`)
  }
  throw new Error(`GitHub API 重试耗尽: ${path}`)
}

export async function searchRepos(q, { perPage = 40, sort = 'stars', pages = 1 } = {}) {
  const out = []
  for (let page = 1; page <= pages; page++) {
    await throttleSearch()
    stats.searchCalls++
    const data = await request(
      `/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=desc&per_page=${perPage}&page=${page}`,
    )
    const items = data.items || []
    out.push(...items)
    if (items.length < perPage) break
  }
  return out
}

export async function getRepo(fullName) {
  return request(`/repos/${fullName}`)
}

export function normalize(repo, sources = []) {
  const [ownerFromName] = String(repo.full_name || '').split('/')
  return {
    full_name: repo.full_name,
    name: repo.name,
    owner: repo.owner?.login || ownerFromName,
    avatar: repo.owner?.avatar_url || '',
    description: (repo.description || '').trim(),
    url: repo.html_url || `https://github.com/${repo.full_name}`,
    homepage: repo.homepage || '',
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    issues: repo.open_issues_count ?? 0,
    language: repo.language || null,
    topics: (repo.topics || []).slice(0, 12),
    license: repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' ? repo.license.spdx_id : '',
    archived: !!repo.archived,
    created_at: repo.created_at || '',
    pushed_at: repo.pushed_at || '',
    sources,
  }
}

export function parseCount(text) {
  const clean = String(text || '').replace(/,/g, '').trim()
  const match = clean.match(/([\d.]+)\s*([kKmM]?)/)
  if (!match) return 0
  const value = Number(match[1])
  const unit = match[2].toLowerCase()
  if (unit === 'k') return Math.round(value * 1000)
  if (unit === 'm') return Math.round(value * 1_000_000)
  return Math.round(value)
}
