import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { logoutUser } from '@/features/auth/authSlice'
import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated, role, user, isLoading } = useAppSelector((state) => state.auth)
  const { theme, toggleTheme } = useTheme()

  if (!isAuthenticated || role !== 'student') {
    return null
  }

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    await dispatch(logoutUser(refreshToken))
    navigate('/login')
  }

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/recommendations', label: 'AI Matches' },
    { path: '/recommendations/history', label: 'Recommendation History' },
    { path: '/applications/history', label: 'Application History' },
    { path: '/internships', label: 'Browse Internships' },
    { path: '/saved', label: 'Saved' },
    { path: '/profile', label: 'Profile & Resume' },
  ]

  const isActive = (path: string) => {
    if (path === '/internships') {
      return location.pathname === '/internships' || location.pathname === '/search' || location.pathname.startsWith('/internships/')
    }
    if (path === '/saved') {
      return location.pathname === '/saved' || location.pathname === '/saved-internships'
    }
    return location.pathname === path
  }

  const fullName = user?.first_name || user?.last_name
    ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
    : user?.username || user?.email?.split('@')[0] || 'Student'

  const userInitial = fullName.charAt(0).toUpperCase()

  return (
    <nav className="bg-white/85 dark:bg-[#0c0c0e]/85 backdrop-blur-2xl border-b border-neutral-200/80 dark:border-neutral-800/80 sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left: Brand + Navigation Links */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link to="/dashboard" className="flex items-center gap-3 group transition-transform duration-300 hover:scale-105">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-secondary-500 text-white flex items-center justify-center font-black text-lg shadow-glow group-hover:rotate-6 transition-all duration-300">
                AI
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent">
                  InternMatch
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 -mt-1">
                  AI Career Engine
                </span>
              </div>
            </Link>

            <div className="hidden xl:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const active = isActive(link.path)
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 ${
                      active
                        ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-glow'
                        : 'text-neutral-600 hover:text-primary-600 hover:bg-primary-50/70 dark:text-neutral-300 dark:hover:text-primary-400 dark:hover:bg-neutral-800/80'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right: Theme Toggle + User Badge + Sign Out */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-all duration-300 hover:scale-105 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-primary-400 border border-neutral-200/60 dark:border-neutral-800/80"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            <Link
              to="/profile"
              className="hidden sm:flex items-center gap-2.5 p-1.5 pr-3.5 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/80 hover:bg-primary-50 dark:hover:bg-neutral-700/80 border border-neutral-200/70 dark:border-neutral-700/60 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {userInitial}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-neutral-900 dark:text-white leading-tight truncate max-w-[120px]">
                  {fullName}
                </span>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight truncate max-w-[120px]">
                  {user?.email}
                </span>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:border-error-300 hover:text-error-600 dark:hover:border-error-700 dark:hover:text-error-400 transition-all duration-200 shadow-sm disabled:opacity-50"
            >
              {isLoading ? '...' : 'Sign out'}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Navigation Bar */}
        <div className="flex xl:hidden overflow-x-auto py-3 border-t border-neutral-200/60 dark:border-neutral-800/60 gap-2 scrollbar-none">
          {navLinks.map((link) => {
            const active = isActive(link.path)
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-glow'
                    : 'text-neutral-600 bg-neutral-100/90 hover:bg-primary-50 hover:text-primary-700 dark:text-neutral-300 dark:bg-neutral-800/90 dark:hover:bg-neutral-700'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
