import fs from 'node:fs/promises'
import crypto from 'node:crypto'

const KEY = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || ''
const BASE = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
const MODEL = process.env.AI_MODEL || 'gpt-4o-mini'
const CONCURRENCY = 4

const hash = (text) => crypto.createHash('sha1').update(text).digest('hex').slice(0, 12)

export const aiEnabled = Boolean(KEY)

const SYSTEM_PROMPT =
  '你是中文开源编辑。把用户给出的 GitHub 仓库（名称 + 英文简介）改写成一行简体中文介绍：不超过 40 字，' +
  '说明它是什么、解决什么问题，技术口吻、不要营销词、不要引号、不要句号结尾。只输出这段中文，不要任何解释。'

async function summarize(repo) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 120,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${repo.full_name}\n${repo.description}` },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) {
    const err = new Error(`AI HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  const data = await res.json()
  const text = (data.choices?.[0]?.message?.content || '').trim().replace(/^["“]|["”]$/g, '').trim()
  return text ? text.slice(0, 80) : ''
}

async function runPool(items, worker) {
  let index = 0
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index++]
      await worker(current)
    }
  })
  await Promise.all(runners)
}

export async function enrichChinese(repos, cache, limit) {
  if (!aiEnabled || !limit) return { cache, generated: 0 }

  const pending = repos
    .filter((repo) => repo.description && repo.description.length > 8)
    .slice(0, limit)

  let generated = 0
  await runPool(pending, async (repo) => {
    const digest = hash(repo.description)
    const cached = cache[repo.full_name]
    if (cached && cached.hash === digest && cached.zh) {
      repo.description_zh = cached.zh
      return
    }
    try {
      const zh = await summarize(repo)
      if (zh) {
        repo.description_zh = zh
        cache[repo.full_name] = { hash: digest, zh, at: new Date().toISOString().slice(0, 10) }
        generated++
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        console.warn(`  ! AI 鉴权失败(${err.status})，停止本次生成`)
        throw err
      }
      console.warn(`  ! AI 生成失败 ${repo.full_name}: ${err.message}`)
    }
  }).catch(() => {})

  return { cache, generated }
}

export async function loadAiCache(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'))
  } catch {
    return {}
  }
}

export async function saveAiCache(file, cache) {
  await fs.mkdir(file.replace(/[\\/][^\\/]+$/, ''), { recursive: true })
  await fs.writeFile(file, JSON.stringify(cache))
}
