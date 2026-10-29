import { ArrowUpRight, GitFork, Star } from 'lucide-react'
import type { Repo } from '../lib/types'
import { compact, displayDescription, languageColor } from '../lib/format'
import { useUi } from '../lib/store'
import { Avatar } from './ui'

export function LanguageDot({ language }: { language: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="size-[7px] rounded-full" style={{ background: languageColor(language) }} />
      {language ?? '未知'}
    </span>
  )
}

export function RepoCard({ repo, rank, gain }: { repo: Repo; rank?: number; gain?: number }) {
  const { openRepo } = useUi()
  const growth = repo.growth?.d7 ?? repo.growth?.d1

  return (
    <button
      type="button"
      onClick={() => openRepo(repo)}
      className="panel panel-hover group flex w-full flex-col gap-3 p-4 text-left"
    >
      <div className="flex items-start gap-3">
        <Avatar repo={repo} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] text-[var(--muted)]">{repo.owner}</div>
          <div className="truncate text-[14.5px] font-semibold tracking-tight transition-colors group-hover:text-[var(--brand)]">
            {repo.name}
          </div>
        </div>
        {rank ? <span className={`rank ${rank <= 3 ? `rank-${rank}` : ''}`}>{rank}</span> : null}
      </div>

      <p className="line-clamp-2 min-h-[36px] text-[12.5px] leading-[1.55] text-[var(--muted)]">
        {displayDescription(repo)}
      </p>

      <div className="flex min-h-[22px] flex-wrap gap-1.5">
        {repo.topics.slice(0, 3).map((topic) => (
          <span key={topic} className="chip">
            {topic}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-[var(--border)] pt-2.5 text-[11.5px] text-[var(--muted)]">
        <LanguageDot language={repo.language} />
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Star size={12} className="text-[var(--gold)]" />
          {compact(repo.stars)}
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <GitFork size={12} />
          {compact(repo.forks)}
        </span>
        <span className="ml-auto">
          {gain ? (
            <span className="badge-up">
              <ArrowUpRight size={11} />+{compact(gain)}
            </span>
          ) : growth ? (
            <span className="badge-up">
              <ArrowUpRight size={11} />+{compact(growth)} / 7d
            </span>
          ) : null}
        </span>
      </div>
    </button>
  )
}
