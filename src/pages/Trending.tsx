import { useMemo, useState } from 'react'
import { Flame, Info } from 'lucide-react'
import type { TrendingWindow } from '../lib/types'
import { WINDOW_LABEL, languageColor } from '../lib/format'
import { useData } from '../lib/store'
import { RepoRow } from '../components/RepoRow'
import { Sparkline } from '../components/Sparkline'
import { Empty } from '../components/ui'

const WINDOWS: TrendingWindow[] = ['daily', 'weekly', 'monthly']

export default function Trending() {
  const { trending, byName } = useData()
  const [window, setWindow] = useState<TrendingWindow>('daily')
  const [language, setLanguage] = useState('all')

  const languages = useMemo(() => {
    const counts = new Map<string, number>()
    for (const key of WINDOWS) {
      for (const item of trending[key]) {
        const repo = byName.get(item.full_name)
        if (!repo?.language) continue
        counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1)
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)
  }, [trending, byName])

  const items = trending[window].flatMap((item) => {
    const repo = byName.get(item.full_name)
    if (!repo) return []
    if (language !== 'all' && repo.language !== language) return []
    return [{ repo, gain: item.gain }]
  })

  const isFallback = trending.fallbackWindows?.includes(window) ?? false

  return (
    <div className="space-y-5">
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="kicker flex items-center gap-1.5">
              <Flame size={12} /> GITHUB TRENDING
            </div>
            <h1 className="mt-1.5 text-[24px] font-bold tracking-tight">趋势榜</h1>
            <p className="mt-1.5 max-w-[620px] text-[12.5px] leading-relaxed text-[var(--muted)]">
              直接解析 GitHub Trending 页面，右侧为窗口内新增星标数。趋势反映短期热度，不代表项目质量。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-0.5">
              {WINDOWS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`tab ${window === key ? 'active' : ''}`}
                  onClick={() => setWindow(key)}
                >
                  {WINDOW_LABEL[key]}
                </button>
              ))}
            </div>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="input h-9 w-auto min-w-[130px] cursor-pointer pr-2"
              style={{ background: 'var(--panel-2)' }}
            >
              <option value="all">全部语言</option>
              {languages.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3 text-[11.5px] text-[var(--faint)]">
          <span className="chip">
            窗口：{WINDOW_LABEL[window]}
          </span>
          <span className="chip">收录 {items.length} 个项目</span>
          {language !== 'all' ? (
            <span className="chip">
              <span className="size-[7px] rounded-full" style={{ background: languageColor(language) }} />
              {language}
            </span>
          ) : null}
        </div>
      </section>

      {isFallback ? (
        <div className="panel flex items-start gap-2 px-4 py-3 text-[12px] leading-relaxed text-[var(--muted)]">
          <Info size={14} className="mt-0.5 shrink-0 text-[var(--gold)]" />
          本次采集时 GitHub Trending 页面不可达，当前展示的是近期活跃的高星项目兜底数据；下一次定时采集会自动恢复真实趋势。
        </div>
      ) : null}

      {items.length ? (
        <div className="panel divide-y divide-[var(--border)] overflow-hidden">
          {items.map(({ repo, gain }, index) => (
            <RepoRow
              key={repo.full_name}
              repo={repo}
              rank={index + 1}
              gain={gain}
              extra={
                repo.spark ? (
                  <span className="hidden w-[88px] shrink-0 lg:block">
                    <Sparkline data={repo.spark} height={26} />
                  </span>
                ) : undefined
              }
            />
          ))}
        </div>
      ) : (
        <Empty
          icon={<Flame size={26} strokeWidth={1.5} />}
          title="暂无趋势数据"
          desc="可能的原因：本次采集时 GitHub Trending 页面不可访问，或筛选条件下没有项目。等待下一次定时采集即可。"
        />
      )}
    </div>
  )
}
