import type { Bundle, Category, LanguageStat, Meta, Repo, TrendingData } from './types'

const base = import.meta.env.BASE_URL

async function getJSON<T>(file: string, fallback?: T): Promise<T> {
  try {
    const res = await fetch(`${base}data/${file}`, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (err) {
    if (fallback !== undefined) return fallback
    throw new Error(`加载 ${file} 失败：${(err as Error).message}`)
  }
}

let cached: Promise<Bundle> | null = null

export function loadBundle(): Promise<Bundle> {
  if (!cached) cached = load()
  return cached
}

async function load(): Promise<Bundle> {
  const [reposFile, trending, categories, languages, meta] = await Promise.all([
    getJSON<{ updatedAt: string; count: number; repos: Repo[] }>('repos.json'),
    getJSON<TrendingData>('trending.json', {
      updatedAt: '',
      date: '',
      daily: [],
      weekly: [],
      monthly: [],
    }),
    getJSON<{ categories: Category[] }>('categories.json', { categories: [] }),
    getJSON<{ languages: LanguageStat[] }>('languages.json', { languages: [] }),
    getJSON<Meta>('meta.json', {
      updatedAt: '',
      date: '',
      totalRepos: 0,
      totalStars: 0,
      snapshots: 0,
      aiSummaries: 0,
      aiEnabled: false,
      historyDates: [],
      apiCalls: 0,
    }),
  ])

  const repos = reposFile.repos ?? []
  const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0)

  return {
    repos,
    byName: new Map(repos.map((repo) => [repo.full_name, repo])),
    trending,
    categories: categories.categories ?? [],
    languages: languages.languages ?? [],
    meta: {
      ...meta,
      totalRepos: meta.totalRepos || repos.length,
      totalStars: meta.totalStars || totalStars,
    },
  }
}
