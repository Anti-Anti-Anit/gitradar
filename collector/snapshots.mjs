import fs from 'node:fs/promises'
import path from 'node:path'

const DAY = 86_400_000

export const today = () => new Date().toISOString().slice(0, 10)
export const shiftDay = (dateStr, days) =>
  new Date(Date.parse(`${dateStr}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10)

export async function loadSnapshots(dir, keepDays = 95) {
  let files = []
  try {
    files = (await fs.readdir(dir)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  } catch {
    return []
  }
  files.sort()
  const cutoff = shiftDay(today(), -keepDays)
  const snapshots = []
  for (const file of files) {
    const date = file.replace('.json', '')
    if (date < cutoff) {
      await fs.unlink(path.join(dir, file)).catch(() => {})
      continue
    }
    try {
      const raw = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'))
      snapshots.push({ date, stars: raw.stars || {} })
    } catch {
      console.warn(`  ! 快照损坏，已跳过: ${file}`)
    }
  }
  return snapshots
}

export async function saveSnapshot(dir, date, repos) {
  const stars = {}
  for (const repo of repos) stars[repo.full_name] = repo.stars
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, `${date}.json`), JSON.stringify({ date, stars }))
}

function starsOn(snapshots, date, fullName) {
  let best = null
  for (const snap of snapshots) {
    if (snap.date > date) break
    const value = snap.stars[fullName]
    if (typeof value === 'number') best = { date: snap.date, value }
  }
  return best
}

// 以「不超过目标日期的最近一次快照」为基准计算增长，返回 null 表示样本不足
export function computeGrowth(snapshots, fullName, currentStars, date) {
  const growth = {}
  for (const [key, days] of [['d1', 1], ['d7', 7], ['d30', 30]]) {
    const base = starsOn(snapshots, shiftDay(date, -days), fullName)
    if (base && currentStars >= base.value) growth[key] = currentStars - base.value
  }
  return Object.keys(growth).length ? growth : null
}

export function computeSpark(snapshots, fullName, currentStars, maxPoints = 30) {
  const values = snapshots
    .map((snap) => snap.stars[fullName])
    .filter((value) => typeof value === 'number')
    .slice(-maxPoints)
  if (!values.length) return null
  values[values.length - 1] = currentStars
  return values.length >= 2 ? values : null
}
