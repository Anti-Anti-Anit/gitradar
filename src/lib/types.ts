export interface Repo {
  full_name: string
  name: string
  owner: string
  avatar: string
  description: string
  description_zh?: string
  url: string
  homepage?: string
  stars: number
  forks: number
  issues: number
  language: string | null
  topics: string[]
  license: string
  archived: boolean
  created_at: string
  pushed_at: string
  growth?: { d1?: number; d7?: number; d30?: number }
  spark?: number[]
  sources: string[]
}

export interface TrendingItem {
  full_name: string
  gain: number
}

export type TrendingWindow = 'daily' | 'weekly' | 'monthly'

export interface TrendingData {
  updatedAt: string
  date: string
  daily: TrendingItem[]
  weekly: TrendingItem[]
  monthly: TrendingItem[]
  fallbackWindows?: TrendingWindow[]
}

export interface Category {
  id: string
  name: string
  en: string
  icon: string
  color: string
  desc: string
  repos: string[]
}

export interface LanguageStat {
  name: string
  count: number
  stars: number
}

export interface Meta {
  updatedAt: string
  date: string
  totalRepos: number
  totalStars: number
  snapshots: number
  aiSummaries: number
  aiEnabled: boolean
  historyDates: string[]
  apiCalls: number
}

export interface Bundle {
  repos: Repo[]
  byName: Map<string, Repo>
  trending: TrendingData
  categories: Category[]
  languages: LanguageStat[]
  meta: Meta
}
