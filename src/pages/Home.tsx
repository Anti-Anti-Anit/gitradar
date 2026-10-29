import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Flame, Layers, Search, Sparkles, Trophy } from 'lucide-react'
import { useData, useUi } from '../lib/store'
import { compact, languageColor } from '../lib/format'
import { RepoCard } from '../components/RepoCard'
import { RepoRow } from '../components/RepoRow'
import { CategoryIcon, Empty, SectionHeader } from '../components/ui'
import { Sparkline } from '../components/Sparkline'

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="panel-inner px-3.5 py-3">
      <div className="text-[10.5px] text-[var(--faint)]">{label}</div>
      <div className="mt-0.5 text-[21px] font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="mt-0.5 truncate text-[10.5px] text-[var(--faint)]">{hint}</div>
    </div>
  )
}

export default function Home() {
  const { repos, byName, trending, categories, languages, meta } = useData()
  const { setSearchOpen } = useUi()

  const daily = trending.daily.slice(0, 9).flatMap((item) => {
    const repo = byName.get(item.full_name)
    return repo ? [{ repo, gain: item.gain }] : []
  })

  const growthList = repos
    .filter((repo) => typeof repo.growth?.d7 === 'number')
    .sort((a, b) => (b.growth?.d7 ?? 0) - (a.growth?.d7 ?? 0))
    .slice(0, 6)

  const topStars = repos.slice(0, 10)
  const maxLang = Math.max(1, ...languages.slice(0, 8).map((item) => item.count))

  return (
    <div className="space-y-10">
      <section className="panel relative overflow-hidden p-6 fade-up sm:p-9">
        <div
          className="pointer-events-none absolute -right-24 -top-28 size-[360px] rounded-full blur-2xl"
          style={{ background: 'radial-gradient(circle, var(--glow-1), transparent 65%)' }}
        />
        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <span className="kicker inline-flex items-center gap-2">
              <span className="size-1.5 animate-pulse rounded-full bg-[var(--ok)]" />
              每 6 小时自动采集 · {meta.date || '等待首次采集'}
            </span>
            <h1 className="mt-4 text-[30px] font-bold leading-[1.12] tracking-tight sm:text-[42px]">
              发现正在起飞的
              <br className="hidden sm:block" />
              <span className="grad-text">开源项目</span>
            </h1>
            <p className="mt-3 max-w-[540px] text-[13.5px] leading-[1.8] text-[var(--muted)]">
              自动追踪 GitHub Trending、总星榜、新星榜与星标增长曲线，并按 AI、前端、云原生等 {categories.length} 个主题分类导航，
              帮你在噪声里挑出真正值得看的仓库。
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link to="/trending" className="btn btn-primary">
                查看今日趋势 <ArrowRight size={15} />
              </Link>
              <Link to="/ranking" className="btn">
                <Trophy size={14} /> 浏览高星榜
              </Link>
              <button type="button" className="btn" onClick={() => setSearchOpen(true)}>
                <Search size={14} /> 搜索项目
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="收录项目" value={compact(meta.totalRepos)} hint={`${categories.length} 个主题分类`} />
            <Stat label="累计星标" value={compact(meta.totalStars)} hint="收录池合计" />
            <Stat label="今日上榜" value={String(trending.daily.length)} hint="GitHub Trending" />
            <Stat label="历史快照" value={String(meta.snapshots)} hint="用于增长率计算" />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          kicker="TRENDING NOW"
          title="今日趋势"
          desc={
            trending.fallbackWindows?.includes('daily')
              ? 'GitHub Trending 暂不可达，展示近期活跃的高星项目（兜底数据）'
              : '来自 GitHub Trending 的实时热榜，括号内为近 24 小时新增星标'
          }
          to="/trending"
        />
        {daily.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {daily.map(({ repo, gain }, index) => (
              <RepoCard key={repo.full_name} repo={repo} rank={index + 1} gain={gain} />
            ))}
          </div>
        ) : (
          <Empty
            icon={<Flame size={26} strokeWidth={1.5} />}
            title="趋势数据尚未采集"
            desc="采集器会在每次运行时抓取 GitHub Trending 页面，首次 Actions 跑完后这里会自动出现内容。"
          />
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section>
          <SectionHeader kicker="FASTEST GROWING" title="7 日增长最快" to="/ranking" />
          {growthList.length ? (
            <div className="panel divide-y divide-[var(--border)] overflow-hidden">
              {growthList.map((repo, index) => (
                <RepoRow key={repo.full_name} repo={repo} rank={index + 1} gain={repo.growth?.d7} extra={<Sparkline data={repo.spark} height={26} />} />
              ))}
            </div>
          ) : (
            <Empty
              icon={<Sparkles size={26} strokeWidth={1.5} />}
              title="增长率正在积累"
              desc="采集器每天记录一次星标快照，连续两次运行后即可计算 24 小时 / 7 天 / 30 天增长。"
            />
          )}
        </section>

        <section>
          <SectionHeader kicker="LANGUAGES" title="语言分布" to="/ranking" linkText="看语言榜" />
          <div className="panel space-y-3 p-4">
            {languages.slice(0, 8).map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-[7px] rounded-full" style={{ background: languageColor(item.name) }} />
                    {item.name}
                  </span>
                  <span className="tabular-nums text-[var(--faint)]">{item.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--panel-2)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(6, (item.count / maxLang) * 100)}%`,
                      background: languageColor(item.name),
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section>
        <SectionHeader kicker="EXPLORE" title="按主题浏览" desc="基于仓库标签自动归类的 12 个主题" to="/categories" />
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/categories/${category.id}`}
              className="panel panel-hover group flex items-start gap-3 p-3.5"
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-[10px]"
                style={{ background: `${category.color}1f`, color: category.color }}
              >
                <CategoryIcon name={category.icon} className="size-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                  {category.name}
                  <ArrowUpRight
                    size={12}
                    className="text-[var(--faint)] opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </span>
                <span className="mt-0.5 block truncate text-[11.5px] text-[var(--muted)]">{category.desc}</span>
                <span className="mt-1 block text-[10.5px] text-[var(--faint)]">{category.repos.length} 个项目</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader kicker="TOP STARRED" title="高星项目 Top 10" desc="历史累计星标最高的开源项目" to="/ranking" />
        <div className="panel divide-y divide-[var(--border)] overflow-hidden">
          {topStars.map((repo, index) => (
            <RepoRow key={repo.full_name} repo={repo} rank={index + 1} />
          ))}
        </div>
      </section>

      <section className="panel flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[var(--panel-2)] text-[var(--brand)]">
            <Layers size={17} />
          </span>
          <div>
            <div className="text-[13.5px] font-semibold">数据管道完全自动化</div>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--muted)]">
              GitHub Actions 每 6 小时抓取 Trending、拉取 Search API 榜单、记录星标快照并自动部署到 Pages，无需服务器。
            </p>
          </div>
        </div>
        <Link to="/history" className="btn shrink-0">
          查看趋势存档 <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  )
}
