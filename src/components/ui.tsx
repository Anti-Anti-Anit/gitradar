import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Box,
  Cloud,
  Database,
  Gamepad2,
  LayoutGrid,
  Server,
  Shield,
  Smartphone,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { Repo } from '../lib/types'

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  layout: LayoutGrid,
  server: Server,
  cloud: Cloud,
  database: Database,
  smartphone: Smartphone,
  wrench: Wrench,
  shield: Shield,
  book: BookOpen,
  gamepad: Gamepad2,
  chart: BarChart3,
  box: Box,
}

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Box
  return <Icon className={className} strokeWidth={1.8} />
}

export function Avatar({ repo, size = 36 }: { repo: Repo; size?: number }) {
  const [failed, setFailed] = useState(false)
  const style = { width: size, height: size }

  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--panel-2)] font-semibold text-[var(--muted)]"
      style={style}
    >
      <span aria-hidden style={{ fontSize: Math.round(size * 0.38) }}>
        {repo.owner.slice(0, 1).toUpperCase()}
      </span>
      {failed ? null : (
        <img
          src={repo.avatar}
          alt={repo.owner}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </span>
  )
}

export function SectionHeader({
  kicker,
  title,
  desc,
  to,
  linkText = '查看全部',
}: {
  kicker?: string
  title: string
  desc?: string
  to?: string
  linkText?: string
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {kicker ? <div className="kicker mb-1.5">{kicker}</div> : null}
        <h2 className="text-[19px] font-semibold tracking-tight">{title}</h2>
        {desc ? <p className="mt-1 text-[12.5px] text-[var(--muted)]">{desc}</p> : null}
      </div>
      {to ? (
        <Link
          to={to}
          className="group inline-flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--brand)]"
        >
          {linkText}
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  )
}

export function Empty({
  title,
  desc,
  icon,
}: {
  title: string
  desc?: string
  icon?: ReactNode
}) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="mb-1 text-[var(--faint)]">{icon ?? <Box size={26} strokeWidth={1.5} />}</div>
      <div className="text-[14px] font-medium">{title}</div>
      {desc ? <div className="max-w-[420px] text-[12.5px] leading-relaxed text-[var(--muted)]">{desc}</div> : null}
    </div>
  )
}

export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="panel space-y-3 p-4">
          <div className="flex items-center gap-3">
            <div className="skeleton size-9 rounded-[10px]" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-2.5 w-1/3" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          </div>
          <div className="skeleton h-2.5 w-full" />
          <div className="skeleton h-2.5 w-4/5" />
          <div className="skeleton h-5 w-24" />
        </div>
      ))}
    </div>
  )
}
