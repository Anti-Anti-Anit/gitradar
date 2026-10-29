import type { Repo } from './types'

export function searchRepos(repos: Repo[], query: string, limit = 24): Repo[] {
  const q = query.trim().toLowerCase()
  if (!q) return repos.slice(0, limit)

  const terms = q.split(/\s+/).filter(Boolean)
  const scored: { repo: Repo; score: number }[] = []

  for (const repo of repos) {
    const name = repo.full_name.toLowerCase()
    const description = `${repo.description} ${repo.description_zh ?? ''}`.toLowerCase()
    const topics = repo.topics.join(' ').toLowerCase()
    const language = (repo.language ?? '').toLowerCase()

    let score = 0
    for (const term of terms) {
      if (name === term) score += 120
      else if (name.endsWith(`/${term}`)) score += 60
      else if (name.includes(term)) score += 30
      if (topics.includes(term)) score += 9
      if (description.includes(term)) score += 6
      if (language === term) score += 8
    }
    if (score > 0) scored.push({ repo, score: score + Math.log10(repo.stars + 10) })
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.repo)
}
