import type { Category, Repo } from './types'

export function compact(n: number): string {
  if (!Number.isFinite(n)) return '0'
  if (Math.abs(n) >= 1e8) return `${trimZero((n / 1e8).toFixed(1))} 亿`
  if (Math.abs(n) >= 1e4) return `${trimZero((n / 1e4).toFixed(1))} 万`
  return n.toLocaleString('en-US')
}

export function fullNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function trimZero(value: string): string {
  return value.replace(/\.0$/, '')
}

export function timeAgo(iso: string): string {
  if (!iso) return '未知'
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return iso
  const diff = Date.now() - then
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`
  return new Date(then).toLocaleDateString('zh-CN')
}

export function dateLabel(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function dayLabel(dateStr: string): string {
  const today = new Date()
  const target = new Date(`${dateStr}T00:00:00`)
  const diffDays = Math.round((today.setHours(0, 0, 0, 0) - target.getTime()) / 86_400_000)
  if (diffDays <= 0) return '今天'
  if (diffDays === 1) return '昨天'
  return `${diffDays} 天前`
}

export const WINDOW_LABEL: Record<string, string> = {
  daily: '今日',
  weekly: '本周',
  monthly: '本月',
}

export function sourceLabel(source: string, categories: Category[]): string {
  if (source === 'trending') return 'GitHub 趋势'
  if (source === 'top') return '总星榜'
  if (source === 'new') return '新星榜'
  if (source.startsWith('cat:')) {
    const id = source.slice(4)
    return categories.find((category) => category.id === id)?.name ?? '分类'
  }
  return source
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  Go: '#00add8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#8a8a8a',
  'C#': '#178600',
  PHP: '#4f5d95',
  Ruby: '#701516',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Zig: '#ec915c',
  Lua: '#5b7fb5',
  Haskell: '#5e5086',
  'Jupyter Notebook': '#da5b0b',
  'Objective-C': '#438eff',
  Elixir: '#6e4a7e',
  Clojure: '#db5855',
  Perl: '#0298c3',
  R: '#198ce7',
  Assembly: '#6e4c13',
  OCaml: '#3be133',
  Solidity: '#aa6746',
  TeX: '#3d6117',
  PowerShell: '#4a9fd5',
  Dockerfile: '#384d54',
  Nix: '#7e7eff',
  MDX: '#fcb32c',
  Astro: '#ff5a03',
  HCL: '#844fba',
  Julia: '#a270ba',
  MATLAB: '#e16737',
}

export function languageColor(language: string | null): string {
  if (!language) return '#8b949e'
  return LANGUAGE_COLORS[language] ?? '#8b949e'
}

export function displayDescription(repo: Repo): string {
  return repo.description_zh || repo.description || '暂无简介'
}

export function repoAgeDays(repo: Repo): number {
  if (!repo.created_at) return Number.POSITIVE_INFINITY
  return Math.round((Date.now() - Date.parse(repo.created_at)) / 86_400_000)
}
