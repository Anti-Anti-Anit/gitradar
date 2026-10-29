import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { Repo } from '../lib/types'
import { compact } from '../lib/format'
import { useData } from '../lib/store'
import { RepoRow } from '../components/RepoRow'
import { CategoryIcon, Empty } from '../components/ui'

export default function CategoryPage() {
  const { id } = useParams()
  const { categories, byName } = useData()
  const [sort, setSort] = useState<'stars' | 'growth'>('stars')

  const category = categories.find((item) => item.id === id)

  const repos = useMemo(() => {
    if (!category) return []
    const list = category.repos
      .map((name) => byName.get(name))
      .filter((repo): repo is Repo => Boolean(repo))
    const sorted = [...list]
    if (sort === 'growth') {
      sorted.sort((a, b) => (b.growth?.d7 ?? b.growth?.d1 ?? 0) - (a.growth?.d7 ?? a.growth?.d1 ?? 0))
    } else {
      sorted.sort((a, b) => b.stars - a.stars)
    }
    return sorted
  }, [category, byName, sort])

  if (!category) {
    return (
      <Empty
        title="分类不存在"
        desc="可能链接已经失效，回到分类页重新选择。"
        icon={<ArrowLeft size={24} />}
      />
    )
  }

  const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0)
  const totalGrowth = repos.reduce((sum, repo) => sum + (repo.growth?.d7 ?? 0), 0)

  return (
    <div className="space-y-5">
      <Link
        to="/categories"
        className="inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition-colors hover:text-[var(--brand)]"
      >
        <ArrowLeft size={13} /> 全部分类
      </Link>

      <section className="panel relative overflow-hidden p-5 sm:p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-20 size-[240px] rounded-full blur-2xl"
          style={{ background: `radial-gradient(circle, ${category.color}33, transparent 65%)` }}
        />
        <div className="relative flex flex-wrap items-start gap-4">
          <span
            className="grid size-12 place-items-center rounded-2xl"
            style={{ background: `${category.color}1f`, color: category.color }}
          >
            <CategoryIcon name={category.icon} className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-bold tracking-tight">{category.name}</h1>
              <span className="chip">{category.en}</span>
            </div>
            <p className="mt-1 text-[12.5px] text-[var(--muted)]">{category.desc}</p>
            <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-[var(--faint)]">
              <span className="chip">{repos.length} 个项目</span>
              <span className="chip">{compact(totalStars)} 星</span>
              {totalGrowth > 0 ? <span className="chip chip-brand">7 日 +{compact(totalGrowth)}</span> : null}
            </div>
          </div>
          <div className="flex items-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-0.5">
            <button type="button" className={`tab ${sort === 'stars' ? 'active' : ''}`} onClick={() => setSort('stars')}>
              按星标
            </button>
            <button type="button" className={`tab ${sort === 'growth' ? 'active' : ''}`} onClick={() => setSort('growth')}>
              按增长
            </button>
          </div>
        </div>
      </section>

      {repos.length ? (
        <div className="panel divide-y divide-[var(--border)] overflow-hidden">
          {repos.map((repo, index) => (
            <RepoRow key={repo.full_name} repo={repo} rank={index + 1} gain={sort === 'growth' ? (repo.growth?.d7 ?? repo.growth?.d1) : undefined} />
          ))}
        </div>
      ) : (
        <Empty title="该分类暂时没有项目" desc="下一次采集后会自动补全。" />
      )}

      <p className="text-center text-[11.5px] text-[var(--faint)]">
        分类由仓库 topics 与 GitHub 搜索结果自动归并，可能存在少量偏差
      </p>
    </div>
  )
}
