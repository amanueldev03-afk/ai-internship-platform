import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Loader2, AlertCircle, Lock, Mail } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { login, clearError } from '@/features/auth/authSlice'
import { getGoogleOAuthUrl } from '@/services/authApi'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { isLoading, error, isAuthenticated, user, role, isInitialized } = useAppSelector(
    (state) => state.auth
  )

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [clientError, setClientError] = useState<string | null>(null)

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      const currentRole = role || user?.role
      const fromState = (location.state as { from?: { pathname?: string; search?: string } })?.from
      const from = fromState?.pathname
        ? `${fromState.pathname}${fromState.search || ''}`
        : null

      if (from && !from.startsWith('/login') && !from.startsWith('/register')) {
        navigate(from, { replace: true })
      } else if (currentRole === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [isAuthenticated, user, role, isInitialized, navigate, location])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
    if (clientError) setClientError(null)
    if (error) dispatch(clearError())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setClientError(null)

    if (!formData.email.trim()) {
      setClientError('Email address is required.')
      return
    }
    if (!formData.password) {
      setClientError('Password is required.')
      return
    }

    const result = await dispatch(login({ email: formData.email.trim(), password: formData.password }))
    
    if (login.fulfilled.match(result)) {
      const currentRole = result.payload.user?.role || role
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname

      if (from && from !== '/login' && from !== '/register') {
        navigate(from, { replace: true })
      } else if (currentRole === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <span className="text-xs font-semibold text-neutral-500">Initializing session...</span>
        </div>
      </div>
    )
  }

  const isUnverifiedAccount =
    error && (error.toLowerCase().includes('verify your email') || error.toLowerCase().includes('inactive'))

  const googleOAuthUrl = getGoogleOAuthUrl()

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-6 card-gradient p-8 sm:p-10 rounded-3xl shadow-glow border border-neutral-200/80 dark:border-neutral-800 animate-slide-up">
        {/* Brand & Heading */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-secondary-500 text-white flex items-center justify-center font-black text-base shadow-glow group-hover:rotate-6 transition-transform">
              AI
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent">
              InternMatch
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Sign In to your account
          </h1>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Access your AI recommendation pipeline & applications
          </p>
        </div>

        {isUnverifiedAccount && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-4 border border-amber-200 dark:border-amber-800 animate-scale-in" role="alert">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-amber-800 dark:text-amber-300">Email verification required</h3>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Please verify your email address to activate your account.
                </p>
                <Link
                  to="/verify-email"
                  className="mt-2 inline-block text-xs font-bold text-amber-900 dark:text-amber-200 underline"
                >
                  Need a new verification link?
                </Link>
              </div>
            </div>
          </div>
        )}

        {(clientError || (error && !isUnverifiedAccount)) && (
          <div className="rounded-2xl bg-error-50 dark:bg-error-950/40 p-4 border border-error-200 dark:border-error-800 animate-scale-in" role="alert">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-error-600 dark:text-error-400 shrink-0" />
              <p className="text-xs font-medium text-error-700 dark:text-error-300">{clientError || error}</p>
            </div>
          </div>
        )}

        {/* Google OAuth Button */}
        <div>
          <a
            href={googleOAuthUrl}
            className="w-full flex justify-center items-center py-3 px-4 rounded-2xl border-2 border-neutral-200/80 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-200 bg-white/80 dark:bg-neutral-800/80 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-neutral-700 shadow-soft transition-all duration-300"
          >
            <svg className="h-4 w-4 mr-2.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </a>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200/80 dark:border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
            <span className="bg-white dark:bg-neutral-900 px-3 text-neutral-400">Or continue with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Email address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-4 pointer-events-none" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/80 border-2 border-neutral-200/80 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-4 pointer-events-none" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/80 border-2 border-neutral-200/80 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl shadow-glow text-xs sm:text-sm font-bold"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <div className="text-center pt-2">
            <span className="text-xs text-neutral-500 font-medium">Don't have an account? </span>
            <Link
              to="/register"
              className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
            >
              Sign up free
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
