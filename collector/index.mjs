import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CATEGORY_DEFS, POOL_LIMITS } from './config.mjs'
import { searchRepos, getRepo, normalize, sleep, stats } from './github.mjs'
import { collectTrending } from './trending.mjs'
import { loadSnapshots, saveSnapshot, computeGrowth, computeSpark, today, shiftDay } from './snapshots.mjs'
import { enrichChinese, loadAiCache, saveAiCache, aiEnabled } from './ai.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = path.join(ROOT, 'public', 'data')
const HISTORY_DIR = path.join(DATA_DIR, 'history')
const SNAP_DIR = path.join(ROOT, 'data', 'snapshots')
const AI_CACHE_FILE = path.join(ROOT, 'data', 'ai-cache.json')

const date = today()
const pool = new Map()

function add(raw, { source, complete = true }) {
  const fullName = raw.full_name
  if (!fullName || !fullName.includes('/')) return
  const existing = pool.get(fullName)
  if (!existing) {
    pool.set(fullName, { repo: normalize(raw, [source]), sources: new Set([source]), complete })
    return
  }
  existing.sources.add(source)
  if (complete && !existing.complete) {
    existing.repo = normalize(raw, [...existing.sources])
    existing.complete = true
  }
}

async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'))
  } catch {
    return fallback
  }
}

async function writeJson(file, value, { pretty = false } = {}) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value))
}

function trimTrending(rows, valid) {
  const seen = new Set()
  const out = []
  for (const row of rows) {
    if (seen.has(row.full_name)) continue
    if (valid && !valid.has(row.full_name)) continue
    seen.add(row.full_name)
    out.push({ full_name: row.full_name, gain: row.gain || 0 })
    if (out.length >= POOL_LIMITS.trendingMax) break
  }
  return out
}

async function main() {
  console.log(`\n=== GitRadar 数据采集 ${date} ===`)
  if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
    console.warn('! 未设置 GITHUB_TOKEN，Search API 将以未认证额度运行（60 次/小时）')
  }

  // 1. GitHub Trending（页面抓取）
  console.log('→ 抓取 GitHub Trending…')
  const trendingRaw = await collectTrending()

  // 2. 搜索接口：总星榜 / 新星榜 / 各分类种子
  console.log('→ 拉取总星榜…')
  const topStars = await searchRepos('stars:>=40000', { perPage: 50, pages: 2 })
  topStars.forEach((repo) => add(repo, { source: 'top' }))

  console.log('→ 拉取新星榜…')
  const newStars = await searchRepos(`stars:>=300 created:>=${shiftDay(date, -180)}`, { perPage: 50, pages: 2 })
  newStars.forEach((repo) => add(repo, { source: 'new' }))

  for (const def of CATEGORY_DEFS) {
    console.log(`→ 分类种子: ${def.name}`)
    try {
      const items = await searchRepos(def.query, { perPage: 40 })
      items.forEach((repo) => add(repo, { source: `cat:${def.id}` }))
    } catch (err) {
      console.warn(`  ! ${def.name} 拉取失败: ${err.message}`)
    }
  }

  // 3. 补全 Trending 中不在池子里的项目
  const trendingNames = [...new Set(Object.values(trendingRaw).flat().map((r) => r.full_name))]
  const missing = trendingNames.filter((name) => !pool.has(name)).slice(0, 80)
  if (missing.length) console.log(`→ 补全 ${missing.length} 个 Trending 项目详情…`)
  for (const name of missing) {
    try {
      const repo = await getRepo(name)
      add(repo, { source: 'trending' })
    } catch (err) {
      console.warn(`  ! 详情失败 ${name}: ${err.message}`)
      const row = Object.values(trendingRaw).flat().find((r) => r.full_name === name)
      if (row) {
        add(
          {
            full_name: name,
            name: name.split('/')[1],
            owner: { login: name.split('/')[0] },
            description: row.description,
            language: row.language,
            stargazers_count: row.stars,
            forks_count: row.forks,
          },
          { source: 'trending' },
        )
      }
    }
    await sleep(120)
  }

  if (!pool.size) {
    console.error('× 池子为空，保留上一次的数据文件')
    process.exit(1)
  }

  // 4. 只保留 Trending 上榜项目和星标最高的项目
  const keep = new Set(trendingNames)
  const sorted = [...pool.values()]
    .map((item) => ({ ...item.repo, sources: [...item.sources] }))
    .sort((a, b) => b.stars - a.stars)
  const repos = sorted.filter((repo, index) => index < POOL_LIMITS.maxRepos || keep.has(repo.full_name))
  console.log(`→ 池子 ${pool.size} 个，保留 ${repos.length} 个`)

  // 5. 星标快照 / 增长率 / 走势
  const snapshots = await loadSnapshots(SNAP_DIR)
  console.log(`→ 历史快照 ${snapshots.length} 天`)
  for (const repo of repos) {
    repo.sources.sort()
    const growth = computeGrowth(snapshots, repo.full_name, repo.stars, date)
    if (growth) repo.growth = growth
    const spark = computeSpark(snapshots, repo.full_name, repo.stars)
    if (spark) repo.spark = spark
  }
  await saveSnapshot(SNAP_DIR, date, repos)

  // 6. 可选：AI 中文简介（配置 OPENAI_API_KEY 后生效，带缓存）
  const aiCache = await loadAiCache(AI_CACHE_FILE)
  const { generated } = await enrichChinese(repos, aiCache, aiEnabled ? POOL_LIMITS.aiSummariesPerRun : 0)
  if (aiEnabled) {
    await saveAiCache(AI_CACHE_FILE, aiCache)
    console.log(`→ AI 中文简介：本次新增 ${generated} 条，缓存共 ${Object.keys(aiCache).length} 条`)
  }

  // 7. 趋势榜：抓取失败时优先复用上一次榜单，最后才用近期活跃项目兜底
  const previousTrending = await readJson(path.join(DATA_DIR, 'trending.json'), {})
  const validNames = new Set(repos.map((repo) => repo.full_name))
  const trending = {}
  const fallbackWindows = []
  for (const window of ['daily', 'weekly', 'monthly']) {
    const trimmed = trimTrending(trendingRaw[window] || [], validNames)
    if (trimmed.length) {
      trending[window] = trimmed
      continue
    }
    const previous = trimTrending(previousTrending[window] || [], validNames)
    if (previous.length) {
      trending[window] = previous
      continue
    }
    trending[window] = []
    if (window === 'daily') {
      trending[window] = repos
        .filter((repo) => repo.pushed_at >= shiftDay(date, -7))
        .slice(0, POOL_LIMITS.trendingMax)
        .map((repo) => ({ full_name: repo.full_name, gain: repo.growth?.d1 || 0 }))
      fallbackWindows.push(window)
    }
  }

  // 8. 分类：GitHub 搜索种子优先，再用仓库标签补充（只做「topic 包含分类关键词」的单向匹配）
  const byStars = (a, b) => b.stars - a.stars
  const matchesTopics = (repo, def) =>
    repo.topics.some((topic) => {
      const value = topic.toLowerCase()
      return def.topics.includes(value) || def.topics.some((keyword) => keyword.length >= 5 && value.includes(keyword))
    })

  const categories = CATEGORY_DEFS.map((def) => {
    const searched = repos.filter((repo) => repo.sources.includes(`cat:${def.id}`)).sort(byStars)
    const extras = repos
      .filter((repo) => !repo.sources.includes(`cat:${def.id}`) && repo.stars >= 500 && matchesTopics(repo, def))
      .sort(byStars)
    return {
      id: def.id,
      name: def.name,
      en: def.en,
      icon: def.icon,
      color: def.color,
      desc: def.desc,
      repos: [...searched, ...extras].slice(0, POOL_LIMITS.perCategory).map((repo) => repo.full_name),
    }
  })

  // 9. 语言分布
  const langMap = new Map()
  for (const repo of repos) {
    if (!repo.language) continue
    const entry = langMap.get(repo.language) || { name: repo.language, count: 0, stars: 0 }
    entry.count += 1
    entry.stars += repo.stars
    langMap.set(repo.language, entry)
  }
  const languages = [...langMap.values()].sort((a, b) => b.count - a.count).slice(0, 20)

  // 10. 落盘
  const updatedAt = new Date().toISOString()
  await writeJson(path.join(DATA_DIR, 'repos.json'), {
    updatedAt,
    count: repos.length,
    repos,
  })
  await writeJson(
    path.join(DATA_DIR, 'trending.json'),
    { updatedAt, date, fallbackWindows, ...trending },
    { pretty: true },
  )
  await writeJson(path.join(DATA_DIR, 'categories.json'), { updatedAt, categories }, { pretty: true })
  await writeJson(path.join(DATA_DIR, 'languages.json'), { updatedAt, languages }, { pretty: true })

  // 11. 趋势存档
  await writeJson(
    path.join(HISTORY_DIR, `${date}.json`),
    { date, fallbackWindows, ...trending },
    { pretty: true },
  )
  let historyDates = []
  try {
    historyDates = (await fs.readdir(HISTORY_DIR))
      .filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file))
      .map((file) => file.replace('.json', ''))
      .sort()
      .reverse()
  } catch {
    historyDates = [date]
  }
  const keepFrom = shiftDay(date, -90)
  for (const old of historyDates.filter((d) => d < keepFrom)) {
    await fs.unlink(path.join(HISTORY_DIR, `${old}.json`)).catch(() => {})
  }
  historyDates = historyDates.filter((d) => d >= keepFrom)
  await writeJson(
    path.join(HISTORY_DIR, 'index.json'),
    { dates: historyDates },
    { pretty: true },
  )

  const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0)
  const zhCount = repos.filter((repo) => repo.description_zh).length
  await writeJson(
    path.join(DATA_DIR, 'meta.json'),
    {
      updatedAt,
      date,
      totalRepos: repos.length,
      totalStars,
      snapshots: snapshots.length + 1,
      aiSummaries: zhCount,
      aiEnabled,
      historyDates,
      apiCalls: stats.requests,
    },
    { pretty: true },
  )

  console.log(`✓ 完成：${repos.length} 个仓库 / ${totalStars.toLocaleString()} 星 / API 调用 ${stats.requests} 次`)
  console.log(`  Trending: 日 ${trending.daily.length} / 周 ${trending.weekly.length} / 月 ${trending.monthly.length}`)
}

main().catch((err) => {
  console.error('× 采集失败:', err)
  process.exit(1)
})
