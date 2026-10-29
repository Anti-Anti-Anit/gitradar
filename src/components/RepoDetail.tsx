import { Calendar, CircleAlert, ExternalLink, GitFork, Link2, Star, Tag, X } from 'lucide-react'
import type { Repo } from '../lib/types'
import { compact, dateLabel, displayDescription, fullNumber, repoAgeDays, sourceLabel } from '../lib/format'
import { useData, useUi } from '../lib/store'
import { Avatar } from './ui'
import { LanguageDot } from './RepoCard'
import { Sparkline } from './Sparkline'

function GrowthCell({ label, value }: { label: string; value?: number }) {
  return (
    <div className="panel-inner flex flex-col gap-1 px-3 py-2.5">
      <span className="text-[10.5px] text-[var(--faint)]">{label}</span>
      <span
        className="text-[15px] font-semibold tabular-nums"
        style={{ color: value && value > 0 ? 'var(--ok)' : 'var(--muted)' }}
      >
        {typeof value === 'number' ? `+${compact(value)}` : '—'}
      </span>
    </div>
  )
}

export function RepoDetail() {
  const { detail, closeDetail } = useUi()
  const { categories, meta } = useData()

  if (!detail) return null
  const repo: Repo = detail
  const age = repoAgeDays(repo)

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={repo.full_name}>
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
        style={{ animation: 'overlay-in .18s ease both' }}
        onClick={closeDetail}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full flex-col border-l border-[var(--border)] bg-[var(--bg)] shadow-2xl sm:max-w-[540px]"
        style={{ animation: 'drawer-in .22s ease both' }}
      >
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3.5">
          <span className="kicker">项目详情</span>
          <div className="flex items-center gap-2">
            <a href={repo.url} target="_blank" rel="noreferrer" className="btn btn-icon" title="在 GitHub 打开">
              <ExternalLink size={15} />
            </a>
            <button type="button" onClick={closeDetail} className="btn btn-icon" title="关闭">
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-start gap-3">
            <Avatar repo={repo} size={48} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] text-[var(--muted)]">{repo.owner}</div>
              <h2 className="truncate text-[20px] font-semibold tracking-tight">{repo.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--faint)]">
                <LanguageDot language={repo.language} />
                {repo.archived ? <span className="chip">已归档</span> : null}
                {age <= 180 ? <span className="chip chip-brand">新项目</span> : null}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip">
              <Star size={11} className="text-[var(--gold)]" /> {fullNumber(repo.stars)} 星标
            </span>
            <span className="chip">
              <GitFork size={11} /> {fullNumber(repo.forks)} 复刻
            </span>
            <span className="chip">
              <CircleAlert size={11} /> {compact(repo.issues)} 议题
            </span>
            {repo.license ? (
              <span className="chip">
                <Tag size={11} /> {repo.license}
              </span>
            ) : null}
          </div>

          <div className="mt-5">
            <h3 className="text-[13px] font-semibold">简介</h3>
            <p className="mt-1.5 text-[13px] leading-[1.7] text-[var(--text)]">{displayDescription(repo)}</p>
            {repo.description_zh && repo.description ? (
              <p className="mt-2 border-l-2 border-[var(--border-strong)] pl-2.5 text-[11.5px] leading-relaxed text-[var(--faint)]">
                {repo.description}
              </p>
            ) : null}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold">星标走势</h3>
              <span className="text-[11px] text-[var(--faint)]">
                {repo.spark ? `近 ${repo.spark.length} 次采集` : '快照积累中'}
              </span>
            </div>
            <div className="mt-2">
              {repo.spark ? (
                <Sparkline data={repo.spark} height={64} showLabels />
              ) : (
                <div className="rounded-lg border border-dashed border-[var(--border)] px-3 py-5 text-center text-[11.5px] text-[var(--faint)]">
                  需要至少两次每日快照才能绘制走势（采集器每天记录一次星标数）
                </div>
              )}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <GrowthCell label="24 小时" value={repo.growth?.d1} />
              <GrowthCell label="7 天" value={repo.growth?.d7} />
              <GrowthCell label="30 天" value={repo.growth?.d30} />
            </div>
          </div>

          {repo.topics.length ? (
            <div className="mt-5">
              <h3 className="text-[13px] font-semibold">标签</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {repo.topics.map((topic) => (
                  <span key={topic} className="chip">
                    #{topic}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5">
            <h3 className="text-[13px] font-semibold">收录来源</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {repo.sources.map((source) => (
                <span key={source} className="chip">
                  {sourceLabel(source, categories)}
                </span>
              ))}
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-2 text-[11.5px]">
            <div className="panel-inner px-3 py-2">
              <dt className="flex items-center gap-1 text-[var(--faint)]">
                <Calendar size={11} /> 创建于
              </dt>
              <dd className="mt-0.5 text-[var(--text)]">
                {dateLabel(repo.created_at)}
                {Number.isFinite(age) ? <span className="text-[var(--faint)]"> · {age} 天</span> : null}
              </dd>
            </div>
            <div className="panel-inner px-3 py-2">
              <dt className="flex items-center gap-1 text-[var(--faint)]">
                <Calendar size={11} /> 最近推送
              </dt>
              <dd className="mt-0.5 text-[var(--text)]">{dateLabel(repo.pushed_at)}</dd>
            </div>
          </dl>

          {meta.updatedAt ? (
            <p className="mt-4 text-[11px] text-[var(--faint)]">数据采集于 {dateLabel(meta.updatedAt)}，每 6 小时更新</p>
          ) : null}
        </div>

        <footer className="flex gap-2 border-t border-[var(--border)] px-5 py-3.5">
          <a href={repo.url} target="_blank" rel="noreferrer" className="btn btn-primary flex-1">
            <ExternalLink size={14} /> 在 GitHub 打开
          </a>
          {repo.homepage ? (
            <a href={repo.homepage} target="_blank" rel="noreferrer" className="btn">
              <Link2 size={14} /> 官网
            </a>
          ) : null}
        </footer>
      </aside>
    </div>
  )
}
