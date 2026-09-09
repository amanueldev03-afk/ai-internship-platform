import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { register, clearError } from '@/features/auth/authSlice'
import { getGoogleOAuthUrl } from '@/services/authApi'

export default function RegisterPage() {
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
  })

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required.'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address.'
    }

    if (!formData.password) {
      errors.password = 'Password is required.'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }

    if (!formData.password_confirm) {
      errors.password_confirm = 'Please confirm your password.'
    } else if (formData.password !== formData.password_confirm) {
      errors.password_confirm = 'Passwords do not match.'
    }

    setClientErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (clientErrors[name]) {
      setClientErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
    if (error) dispatch(clearError())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const emailToRegister = formData.email.trim()
    const result = await dispatch(
      register({
        full_name: formData.full_name.trim(),
        email: emailToRegister,
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        password_confirm: formData.password_confirm,
      })
    )

    if (register.fulfilled.match(result)) {
      setRegisteredEmail(emailToRegister)
      setRegistrationSuccess(true)
    }
  }

  // Parse backend validation error object
  const getBackendErrorForField = (fieldName: string): string | null => {
    if (!error) return null
    try {
      const parsed = JSON.parse(error)
      const fieldVal = parsed[fieldName]
      if (Array.isArray(fieldVal)) return fieldVal.join(' ')
      if (typeof fieldVal === 'string') return fieldVal
      return null
    } catch {
      return null
    }
  }

  const generalBackendError =
    error && !getBackendErrorForField('full_name') && !getBackendErrorForField('email') && !getBackendErrorForField('password') && !getBackendErrorForField('password_confirm')
      ? error
      : null

  const googleOAuthUrl = getGoogleOAuthUrl()

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registration Successful!</h1>
            <p className="mt-2 text-sm text-gray-600">
              We have sent a verification email to{' '}
              <span className="font-semibold text-gray-800">{registeredEmail}</span>. Please click the link in that email to activate your account before logging in.
            </p>
          </div>
          <div className="pt-2 space-y-3">
            <Link
              to="/login"
              className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Go to Login
            </Link>
            <div>
              <Link
                to="/verify-email"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                Didn't receive an email? Resend verification
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join the AI Internship Platform
          </p>
        </div>

        {generalBackendError && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200" role="alert">
            <p className="text-sm text-red-700">{generalBackendError}</p>
          </div>
        )}

        {/* Google OAuth Button */}
        <div>
          <a
            href={googleOAuthUrl}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
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
            Sign up with Google
          </a>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              value={formData.full_name}
              onChange={handleChange}
              disabled={isLoading}
              className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 ${
                clientErrors.full_name || getBackendErrorForField('full_name')
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
              placeholder="Jane Doe"
            />
            {(clientErrors.full_name || getBackendErrorForField('full_name')) && (
              <p className="mt-1 text-xs text-red-600">
                {clientErrors.full_name || getBackendErrorForField('full_name')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 ${
                clientErrors.email || getBackendErrorForField('email')
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
              placeholder="student@example.com"
            />
            {(clientErrors.email || getBackendErrorForField('email')) && (
              <p className="mt-1 text-xs text-red-600">
                {clientErrors.email || getBackendErrorForField('email')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 ${
                clientErrors.password || getBackendErrorForField('password')
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
              placeholder="••••••••"
            />
            {(clientErrors.password || getBackendErrorForField('password')) && (
              <p className="mt-1 text-xs text-red-600">
                {clientErrors.password || getBackendErrorForField('password')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="password_confirm"
              name="password_confirm"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password_confirm}
              onChange={handleChange}
              disabled={isLoading}
              className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 ${
                clientErrors.password_confirm || getBackendErrorForField('password_confirm')
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
              placeholder="••••••••"
            />
            {(clientErrors.password_confirm || getBackendErrorForField('password_confirm')) && (
              <p className="mt-1 text-xs text-red-600">
                {clientErrors.password_confirm || getBackendErrorForField('password_confirm')}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <span className="text-sm text-gray-600">Already have an account? </span>
            <Link
              to="/login"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
