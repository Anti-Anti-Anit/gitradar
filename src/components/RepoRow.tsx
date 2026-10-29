import { ChevronRight, GitFork, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Repo } from '../lib/types'
import { compact, displayDescription } from '../lib/format'
import { useUi } from '../lib/store'
import { Avatar } from './ui'
import { LanguageDot } from './RepoCard'

export function RepoRow({
  repo,
  rank,
  gain,
  extra,
}: {
  repo: Repo
  rank?: number
  gain?: number
  extra?: ReactNode
}) {
  const { openRepo } = useUi()

  return (
    <button
      type="button"
      onClick={() => openRepo(repo)}
      className="row-hover group flex w-full items-center gap-3 px-4 py-3 text-left"
    >
      {rank ? <span className={`rank ${rank <= 3 ? `rank-${rank}` : ''}`}>{rank}</span> : null}
      <Avatar repo={repo} size={34} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-[11px] text-[var(--muted)]">{repo.owner} /</span>
          <span className="truncate text-[13.5px] font-semibold transition-colors group-hover:text-[var(--brand)]">
            {repo.name}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-[12px] text-[var(--muted)]">{displayDescription(repo)}</p>
      </div>

      <div className="hidden shrink-0 items-center gap-3 text-[11.5px] text-[var(--muted)] md:flex">
        <LanguageDot language={repo.language} />
      </div>

      {extra}

      {gain ? (
        <span className="badge-up shrink-0">{gain > 0 ? `+${compact(gain)}` : '—'}</span>
      ) : null}

      <span className="hidden shrink-0 items-center gap-1 text-[11.5px] tabular-nums text-[var(--muted)] sm:inline-flex">
        <Star size={12} className="text-[var(--gold)]" />
        {compact(repo.stars)}
      </span>
      <span className="hidden shrink-0 items-center gap-1 text-[11.5px] tabular-nums text-[var(--muted)] lg:inline-flex">
        <GitFork size={12} />
        {compact(repo.forks)}
      </span>

      <ChevronRight
        size={15}
        className="shrink-0 text-[var(--faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--brand)]"
      />
    </button>
  )
}
