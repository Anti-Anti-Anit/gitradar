import { Link } from 'react-router-dom'
import { ArrowRight, Layers } from 'lucide-react'
import { useData } from '../lib/store'
import { compact } from '../lib/format'
import { CategoryIcon } from '../components/ui'

export default function Categories() {
  const { categories, byName } = useData()

  return (
    <div className="space-y-5">
      <section className="panel p-5 sm:p-6">
        <div className="kicker flex items-center gap-1.5">
          <Layers size={12} /> CATEGORIES
        </div>
        <h1 className="mt-1.5 text-[24px] font-bold tracking-tight">分类探索</h1>
        <p className="mt-1.5 max-w-[680px] text-[12.5px] leading-relaxed text-[var(--muted)]">
          按技术主题把收录项目归类，每个分类都包含 GitHub 搜索种子项目与标签匹配结果，适合按方向找轮子、找灵感。
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const repos = category.repos
            .map((name) => byName.get(name))
            .filter((repo): repo is NonNullable<typeof repo> => Boolean(repo))
          const stars = repos.reduce((sum, repo) => sum + repo.stars, 0)
          return (
            <Link key={category.id} to={`/categories/${category.id}`} className="panel panel-hover group flex flex-col gap-3 p-4">
              <div className="flex items-start gap-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl"
                  style={{ background: `${category.color}1f`, color: category.color }}
                >
                  <CategoryIcon name={category.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[14.5px] font-semibold">{category.name}</span>
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-[var(--faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--brand)]"
                    />
                  </div>
                  <div className="text-[10.5px] uppercase tracking-wider text-[var(--faint)]">{category.en}</div>
                </div>
              </div>

              <p className="line-clamp-1 text-[12px] text-[var(--muted)]">{category.desc}</p>

              <div className="mt-auto space-y-1.5 border-t border-[var(--border)] pt-2.5">
                {repos.slice(0, 3).map((repo) => (
                  <div key={repo.full_name} className="truncate text-[11.5px] text-[var(--faint)]">
                    {repo.full_name}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-[var(--faint)]">
                <span>{category.repos.length} 个项目</span>
                <span>·</span>
                <span>{compact(stars)} 星</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
