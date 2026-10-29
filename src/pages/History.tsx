import { useEffect, useState } from 'react'
import { CalendarDays, ExternalLink, History as HistoryIcon } from 'lucide-react'
import type { TrendingData, TrendingWindow } from '../lib/types'
import { WINDOW_LABEL, compact, dayLabel } from '../lib/format'
import { useData } from '../lib/store'
import { Empty } from '../components/ui'
import { RepoRow } from '../components/RepoRow'

const base = import.meta.env.BASE_URL
const WINDOWS: TrendingWindow[] = ['daily', 'weekly', 'monthly']

export default function History() {
  const { byName } = useData()
  const [dates, setDates] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [day, setDay] = useState<TrendingData | null>(null)
  const [window, setWindow] = useState<TrendingWindow>('daily')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${base}data/history/index.json`)
      .then((res) => (res.ok ? res.json() : { dates: [] }))
      .then((data: { dates?: string[] }) => {
        const list = data.dates ?? []
        setDates(list)
        setSelected(list[0] ?? null)
        if (!list.length) setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    fetch(`${base}data/history/${selected}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDay(data))
      .catch(() => setDay(null))
      .finally(() => setLoading(false))
  }, [selected])

  const rows = day ? day[window] : []

  return (
    <div className="space-y-5">
      <section className="panel p-5 sm:p-6">
        <div className="kicker flex items-center gap-1.5">
          <HistoryIcon size={12} /> ARCHIVE
        </div>
        <h1 className="mt-1.5 text-[24px] font-bold tracking-tight">趋势存档</h1>
        <p className="mt-1.5 max-w-[680px] text-[12.5px] leading-relaxed text-[var(--muted)]">
          每次采集都会把当天的 Trending 榜单以 JSON 存档，最多保留 90 天。可以回看某个项目是哪天开始被社区讨论的。
        </p>

        <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3 text-[11.5px] text-[var(--faint)]">
          <CalendarDays size={13} />
          共 {dates.length} 天存档
        </div>

        {dates.length ? (
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {dates.map((date) => (
              <button
                key={date}
                type="button"
                onClick={() => setSelected(date)}
                className={`chip shrink-0 cursor-pointer px-2.5 py-1 text-[11.5px] ${
                  selected === date ? 'chip-brand' : ''
                }`}
              >
                {date} · {dayLabel(date)}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {dates.length ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
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
            <span className="text-[11.5px] text-[var(--faint)]">
              {selected} · {rows.length} 个上榜项目
            </span>
          </div>

          {loading ? (
            <div className="panel space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="skeleton h-10 w-full" />
              ))}
            </div>
          ) : rows.length ? (
            <div className="panel divide-y divide-[var(--border)] overflow-hidden">
              {rows.map((item, index) => {
                const repo = byName.get(item.full_name)
                if (repo) {
                  return <RepoRow key={item.full_name} repo={repo} rank={index + 1} gain={item.gain} />
                }
                return (
                  <a
                    key={item.full_name}
                    href={`https://github.com/${item.full_name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="row-hover flex items-center gap-3 px-4 py-3"
                  >
                    <span className={`rank ${index < 3 ? `rank-${index + 1}` : ''}`}>{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{item.full_name}</span>
                    <span className="badge-up shrink-0">+{compact(item.gain)}</span>
                    <ExternalLink size={13} className="shrink-0 text-[var(--faint)]" />
                  </a>
                )
              })}
            </div>
          ) : (
            <Empty title="这一天没有记录" desc="存档文件存在但榜单为空，通常是当天抓取失败。" />
          )}
        </>
      ) : (
        <Empty
          icon={<HistoryIcon size={26} strokeWidth={1.5} />}
          title="还没有存档"
          desc="采集器每次运行都会写入 public/data/history/YYYY-MM-DD.json，第一次 Actions 采集完成后即可回看。"
        />
      )}
    </div>
  )
}
