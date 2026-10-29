import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Radar } from 'lucide-react'
import { loadBundle } from './lib/api'
import type { Bundle } from './lib/types'
import { DataProvider, UiProvider } from './lib/store'
import { Footer, Header } from './components/Layout'
import { SearchDialog } from './components/SearchDialog'
import { RepoDetail } from './components/RepoDetail'
import Home from './pages/Home'
import Trending from './pages/Trending'
import Ranking from './pages/Ranking'
import Categories from './pages/Categories'
import CategoryPage from './pages/CategoryPage'
import History from './pages/History'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

function Shell() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="ambient" />
      <Header />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 pb-14 pt-6 sm:px-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:id" element={<CategoryPage />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <SearchDialog />
      <RepoDetail />
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="ambient" />
      <span className="grid size-12 animate-pulse place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-[0_18px_40px_-18px_rgba(99,102,241,0.9)]">
        <Radar size={24} strokeWidth={2.2} />
      </span>
      <div className="text-[13px] text-[var(--muted)]">正在加载雷达数据…</div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="ambient" />
      <div className="panel max-w-[520px] p-6 text-center">
        <Radar size={26} className="mx-auto text-[var(--danger)]" />
        <h1 className="mt-3 text-[17px] font-semibold">数据加载失败</h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--muted)]">{message}</p>
        <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-left text-[11.5px] text-[var(--faint)]">
          本地开发时先运行：<code className="text-[var(--brand)]">npm run collect</code>
          <br />
          线上站点由 GitHub Actions 每 6 小时生成 public/data 下的 JSON。
        </p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => location.reload()}>
          重新加载
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBundle()
      .then(setBundle)
      .catch((err: Error) => setError(err.message))
  }, [])

  if (error) return <ErrorScreen message={error} />
  if (!bundle) return <LoadingScreen />

  return (
    <DataProvider value={bundle}>
      <UiProvider>
        <HashRouter>
          <ScrollToTop />
          <Shell />
        </HashRouter>
      </UiProvider>
    </DataProvider>
  )
}
