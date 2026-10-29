import { useEffect, useMemo, useRef, useState } from 'react'
import { CornerDownLeft, Search, Star } from 'lucide-react'
import { searchRepos } from '../lib/search'
import { compact, displayDescription } from '../lib/format'
import { useData, useUi } from '../lib/store'
import { Avatar } from './ui'

export function SearchDialog() {
  const { searchOpen, setSearchOpen, openRepo } = useUi()
  const { repos } = useData()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => searchRepos(repos, query, 30), [repos, query])

  useEffect(() => {
    setActive(0)
  }, [query, searchOpen])

  useEffect(() => {
    if (!searchOpen) return
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [active, searchOpen])

  if (!searchOpen) return null

  const pick = (index: number) => {
    const repo = results[index]
    if (!repo) return
    setSearchOpen(false)
    setQuery('')
    openRepo(repo)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
        style={{ animation: 'overlay-in .16s ease both' }}
        onClick={() => setSearchOpen(false)}
      />
      <div
        className="panel relative w-full max-w-[640px] overflow-hidden shadow-2xl"
        style={{ animation: 'fade-up .2s ease both' }}
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4">
          <Search size={16} className="text-[var(--faint)]" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setActive((current) => Math.min(current + 1, results.length - 1))
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setActive((current) => Math.max(current - 1, 0))
              } else if (event.key === 'Enter') {
                event.preventDefault()
                pick(active)
              }
            }}
            placeholder="搜索项目、语言或标签，例如 rust / llm / kubernetes"
            className="h-12 w-full bg-transparent text-[14px] outline-none placeholder:text-[var(--faint)]"
          />
          <kbd className="hidden rounded-md border border-[var(--border)] bg-[var(--panel-2)] px-1.5 py-0.5 text-[10.5px] text-[var(--faint)] sm:block">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5">
          {results.length ? (
            results.map((repo, index) => (
              <button
                key={repo.full_name}
                type="button"
                data-index={index}
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(index)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${
                  index === active ? 'bg-[var(--panel-2)]' : ''
                }`}
              >
                <Avatar repo={repo} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">
                    <span className="text-[var(--muted)]">{repo.owner} / </span>
                    {repo.name}
                  </div>
                  <div className="truncate text-[11.5px] text-[var(--faint)]">{displayDescription(repo)}</div>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[11.5px] tabular-nums text-[var(--muted)]">
                  <Star size={11} className="text-[var(--gold)]" />
                  {compact(repo.stars)}
                </span>
                {index === active ? <CornerDownLeft size={13} className="shrink-0 text-[var(--brand)]" /> : null}
              </button>
            ))
          ) : (
            <div className="px-4 py-10 text-center text-[12.5px] text-[var(--muted)]">
              没有找到「{query}」，换个关键词试试
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2 text-[11px] text-[var(--faint)]">
          <span>共 {results.length} 个结果 · 来自收录池 {repos.length} 个项目</span>
          <span className="hidden sm:block">↑ ↓ 选择 · ↵ 打开</span>
        </div>
      </div>
    </div>
  )
}
