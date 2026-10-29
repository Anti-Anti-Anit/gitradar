import { useMemo, useState } from 'react'
import { ArrowUpRight, Rocket, Trophy } from 'lucide-react'
import { useData } from '../lib/store'
import { compact, languageColor, repoAgeDays } from '../lib/format'
import { RepoRow } from '../components/RepoRow'

type Tab = 'stars' | 'growth' | 'new' | 'language'

const TABS: { id: Tab; label: string }[] = [
  { id: 'stars', label: '总星榜' },
  { id: 'growth', label: '增长榜' },
  { id: 'new', label: '新星榜' },
  { id: 'language', label: '语言榜' },
]

const DESC: Record<Tab, string> = {
  stars: '全部收录项目中累计星标最高的仓库，老牌基础设施占比更高。',
  growth: '按 7 日星标增长排序，捕捉正在被社区讨论的项目（需要至少两次快照）。',
  new: '近 120 天内创建、且已获得 500 星以上的新项目，最适合第一时间跟进。',
  language: '按编程语言查看高星项目，了解某个技术栈里最有分量的仓库。',
}

export default function Ranking() {
  const { repos, languages } = useData()
  const [tab, setTab] = useState<Tab>('stars')
  const [language, setLanguage] = useState('all')
  const [visible, setVisible] = useState(30)

  const list = useMemo(() => {
    if (tab === 'growth') {
      return repos
        .filter((repo) => typeof repo.growth?.d7 === 'number' || typeof repo.growth?.d1 === 'number')
        .sort((a, b) => (b.growth?.d7 ?? b.growth?.d1 ?? 0) - (a.growth?.d7 ?? a.growth?.d1 ?? 0))
    }
    if (tab === 'new') {
      return repos.filter((repo) => repoAgeDays(repo) <= 120).sort((a, b) => b.stars - a.stars)
    }
    if (tab === 'language') {
      return language === 'all' ? repos : repos.filter((repo) => repo.language === language)
    }
    return repos
  }, [repos, tab, language])

  const growthValue = (index: number) => {
    const repo = list[index]
    return repo?.growth?.d7 ?? repo?.growth?.d1
  }

  return (
    <div className="space-y-5">
      <section className="panel p-5 sm:p-6">
        <div className="kicker flex items-center gap-1.5">
          <Trophy size={12} /> LEADERBOARDS
        </div>
        <h1 className="mt-1.5 text-[24px] font-bold tracking-tight">榜单</h1>
        <p className="mt-1.5 max-w-[680px] text-[12.5px] leading-relaxed text-[var(--muted)]">{DESC[tab]}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
          <div className="flex items-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-0.5">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`tab ${tab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setTab(item.id)
                  setVisible(30)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'language' ? (
            <select
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value)
                setVisible(30)
              }}
              className="input h-9 w-auto min-w-[140px] cursor-pointer"
              style={{ background: 'var(--panel-2)' }}
            >
              <option value="all">全部语言</option>
              {languages.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          ) : null}

          <span className="ml-auto text-[11.5px] text-[var(--faint)]">
            共 {list.length} 个项目
            {tab === 'language' && language !== 'all' ? ` · ${language}` : ''}
          </span>
        </div>
      </section>

      {tab === 'growth' && !list.length ? (
        <div className="panel px-6 py-14 text-center">
          <Rocket size={26} strokeWidth={1.5} className="mx-auto text-[var(--faint)]" />
          <div className="mt-2 text-[14px] font-medium">增长数据正在积累</div>
          <p className="mx-auto mt-1.5 max-w-[460px] text-[12.5px] leading-relaxed text-[var(--muted)]">
            采集器每 6 小时记录一次星标快照，但目前历史快照不足两次，无法计算增量。等下一次 Actions 运行后这里就会有榜单。
          </p>
        </div>
      ) : (
        <>
          <div className="panel divide-y divide-[var(--border)] overflow-hidden">
            {list.slice(0, visible).map((repo, index) => (
              <RepoRow
                key={repo.full_name}
                repo={repo}
                rank={index + 1}
                gain={tab === 'growth' ? growthValue(index) : undefined}
                extra={
                  tab === 'new' ? (
                    <span className="hidden shrink-0 items-center gap-1 text-[11px] text-[var(--faint)] sm:inline-flex">
                      {repoAgeDays(repo)} 天
                    </span>
                  ) : undefined
                }
              />
            ))}
          </div>

          {visible < list.length ? (
            <div className="flex justify-center">
              <button type="button" className="btn" onClick={() => setVisible((count) => count + 30)}>
                加载更多（还有 {list.length - visible} 个）
              </button>
            </div>
          ) : null}
        </>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-[11.5px] text-[var(--faint)]">
        <ArrowUpRight size={12} />
        星标数来自 GitHub API 快照，共计 {compact(repos.length)} 个收录项目
        {language !== 'all' ? (
          <span className="inline-flex items-center gap-1">
            · <span className="size-[7px] rounded-full" style={{ background: languageColor(language) }} />
            {language}
          </span>
        ) : null}
      </p>
    </div>
  )
}
