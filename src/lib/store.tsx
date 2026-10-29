import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Bundle, Repo } from './types'

const DataContext = createContext<Bundle | null>(null)

export function DataProvider({ value, children }: { value: Bundle; children: ReactNode }) {
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): Bundle {
  const bundle = useContext(DataContext)
  if (!bundle) throw new Error('useData 必须在 DataProvider 内使用')
  return bundle
}

type Theme = 'dark' | 'light'

interface UiState {
  theme: Theme
  toggleTheme: () => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  detail: Repo | null
  openRepo: (repo: Repo) => void
  closeDetail: () => void
}

const UiContext = createContext<UiState | null>(null)

export const SITE_REPO = 'https://github.com/Anti-Anti-Anit/gitradar'

export function UiProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  const [searchOpen, setSearchOpen] = useState(false)
  const [detail, setDetail] = useState<Repo | null>(null)

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      try {
        localStorage.setItem('radar-theme', next)
      } catch {
        /* 忽略隐私模式下的存储异常 */
      }
      return next
    })
  }, [])

  const openRepo = useCallback((repo: Repo) => setDetail(repo), [])
  const closeDetail = useCallback(() => setDetail(null), [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setDetail(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = searchOpen || detail ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [searchOpen, detail])

  const value = useMemo(
    () => ({ theme, toggleTheme, searchOpen, setSearchOpen, detail, openRepo, closeDetail }),
    [theme, toggleTheme, searchOpen, detail, openRepo, closeDetail],
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi(): UiState {
  const state = useContext(UiContext)
  if (!state) throw new Error('useUi 必须在 UiProvider 内使用')
  return state
}
