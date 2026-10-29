import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Command, Github, Menu, Moon, Radar, Search, Sun, X } from 'lucide-react'
import { SITE_REPO, useData, useUi } from '../lib/store'
import { timeAgo } from '../lib/format'

const NAV = [
  { to: '/', label: '首页' },
  { to: '/trending', label: '趋势' },
  { to: '/ranking', label: '榜单' },
  { to: '/categories', label: '分类' },
  { to: '/history', label: '存档' },
]

export function Header() {
  const { setSearchOpen, theme, toggleTheme } = useUi()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--border)]"
      style={{ background: 'color-mix(in srgb, var(--bg) 82%, transparent)', backdropFilter: 'blur(16px)' }}
    >
      <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-[0_10px_24px_-10px_rgba(99,102,241,0.9)]">
            <Radar size={17} strokeWidth={2.2} />
          </span>
          <span className="leading-[1.1]">
            <span className="block text-[15px] font-bold tracking-tight">GitRadar</span>
            <span className="hidden text-[10.5px] text-[var(--faint)] sm:block">自动发现高星项目</span>
          </span>
        </Link>

        <nav className="ml-3 hidden items-center gap-0.5 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="btn hidden h-9 gap-2 pl-2.5 pr-2 text-[var(--muted)] sm:inline-flex"
            title="搜索项目 (Ctrl/Cmd + K)"
          >
            <Search size={14} />
            <span className="text-[12.5px]">搜索</span>
            <kbd className="ml-1 inline-flex items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--panel-2)] px-1.5 py-0.5 text-[10px]">
              <Command size={9} />K
            </kbd>
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="btn btn-icon sm:hidden"
            title="搜索"
          >
            <Search size={15} />
          </button>
          <button type="button" onClick={toggleTheme} className="btn btn-icon" title="切换主题">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <a href={SITE_REPO} target="_blank" rel="noreferrer" className="btn btn-icon" title="GitHub 仓库">
            <Github size={15} />
          </a>
          <button
            type="button"
            className="btn btn-icon md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            title="菜单"
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="border-t border-[var(--border)] px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-[13.5px] ${isActive ? 'bg-[var(--panel-2)] font-medium' : 'text-[var(--muted)]'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </header>
  )
}

export function Footer() {
  const { meta, categories } = useData()

  return (
    <footer className="mt-10 border-t border-[var(--border)]">
      <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-4 py-9 sm:px-6 md:grid-cols-[1.5fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-white">
              <Radar size={15} strokeWidth={2.2} />
            </span>
            <span className="text-[14px] font-bold">GitRadar · 星探</span>
          </div>
          <p className="mt-3 max-w-[360px] text-[12px] leading-relaxed text-[var(--muted)]">
            自动追踪 GitHub 趋势与高星项目，为中文开发者提供趋势榜、总星榜、增长率榜、新星榜和分类导航。
            静态站点，无追踪脚本。
          </p>
          <p className="mt-3 text-[11.5px] text-[var(--faint)]">
            数据更新于 {meta.updatedAt ? timeAgo(meta.updatedAt) : '—'} · 每 6 小时自动采集
          </p>
        </div>

        <div>
          <div className="kicker mb-3">导航</div>
          <ul className="space-y-2 text-[12.5px] text-[var(--muted)]">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="transition-colors hover:text-[var(--brand)]">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={SITE_REPO} target="_blank" rel="noreferrer" className="transition-colors hover:text-[var(--brand)]">
                GitHub 仓库
              </a>
            </li>
          </ul>
        </div>

        <div>
          <div className="kicker mb-3">数据说明</div>
          <ul className="space-y-2 text-[12px] leading-relaxed text-[var(--muted)]">
            <li>来源：GitHub REST API + GitHub Trending 页面</li>
            <li>采集：GitHub Actions 定时任务（{meta.apiCalls} 次 API 请求 / 次）</li>
            <li>分类：{categories.length} 个主题分类，基于仓库标签自动归类</li>
            <li>星标只代表热度，不代表质量，请结合需求判断</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--border)] py-4 text-center text-[11.5px] text-[var(--faint)]">
        © {new Date().getFullYear()} GitRadar · MIT License · 数据归各开源项目作者所有
      </div>
    </footer>
  )
}
