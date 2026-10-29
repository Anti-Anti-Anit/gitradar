import * as cheerio from 'cheerio'
import { parseCount } from './github.mjs'

const WINDOWS = ['daily', 'weekly', 'monthly']
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

// GitHub Trending 没有官方 API，只能解析页面；在 Actions runner 上访问 github.com 是通的
export async function scrapeTrending(window) {
  const qs = window === 'daily' ? '' : `?since=${window}`
  const res = await fetch(`https://github.com/trending${qs}`, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' },
    signal: AbortSignal.timeout(45_000),
  })
  if (!res.ok) throw new Error(`trending ${window} HTTP ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  const rows = []
  $('article.Box-row').each((_, el) => {
    const node = $(el)
    const href = node.find('h2 a').attr('href') || ''
    const fullName = href.replace(/^\//, '').trim()
    if (!fullName || !fullName.includes('/')) return

    const desc = node.find('p').first().text().trim()
    const language = node.find('[itemprop="programmingLanguage"]').first().text().trim() || null
    const stars = parseCount(node.find(`a[href="/${fullName}/stargazers"]`).first().text())
    const forks = parseCount(node.find(`a[href="/${fullName}/forks"]`).first().text())
    const gainText =
      node.find('span.d-inline-block.float-sm-right').first().text().trim() ||
      node.find('.float-sm-right').first().text().trim()

    rows.push({
      full_name: fullName,
      description: desc,
      language,
      stars,
      forks,
      gain: parseCount(gainText),
    })
  })

  if (!rows.length) throw new Error(`trending ${window} 解析结果为空（页面结构可能变化）`)
  return rows
}

export async function collectTrending() {
  const result = {}
  for (const window of WINDOWS) {
    try {
      const rows = await scrapeTrending(window)
      result[window] = rows
      console.log(`  ✓ trending/${window}: ${rows.length} 个仓库`)
    } catch (err) {
      console.warn(`  ! trending/${window} 失败: ${err.message}`)
      result[window] = []
    }
  }
  return result
}
