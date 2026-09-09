import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom'
import * as authApi from '@/services/authApi'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const routeParams = useParams<{ uid?: string; token?: string }>()

  const uid = searchParams.get('uid') || routeParams.uid
  const token = searchParams.get('token') || routeParams.token

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already_verified' | 'error'>(
    uid && token ? 'loading' : 'idle'
  )
  const [errorMessage, setErrorMessage] = useState('')

  // Resend verification state
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState('')

  useEffect(() => {
    if (!uid || !token) {
      if (status === 'loading') {
        setStatus('idle')
      }
      return
    }

    let isMounted = true
    const verifyToken = async () => {
      try {
        await authApi.verifyEmail(uid, token)
        if (isMounted) {
          setStatus('success')
        }
      } catch (error: any) {
        if (!isMounted) return
        const detail = error.response?.data?.detail
        if (detail === 'Email has already been verified.') {
          setStatus('already_verified')
        } else if (detail === 'Invalid or expired verification token.') {
          setStatus('error')
          setErrorMessage('This verification link has expired or is invalid. Please request a new verification email below.')
        } else {
          setStatus('error')
          setErrorMessage(detail || 'Email verification failed. Please request a new verification link below.')
        }
      }
    }

    verifyToken()

    return () => {
      isMounted = false
    }
  }, [uid, token])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setResendError('')
    setResendSuccess(false)

    if (!resendEmail.trim()) {
      setResendError('Please enter your email address.')
      return
    }

    setResendLoading(true)
    try {
      await authApi.resendVerification(resendEmail.trim())
      setResendSuccess(true)
    } catch (error: any) {
      const detail = error.response?.data?.email || error.response?.data?.detail
      setResendError(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail.join(' ')
          : 'Could not send verification email. Please check the address.'
      )
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        {status === 'loading' && (
          <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-50">
              <svg
                className="animate-spin h-8 w-8 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Verifying your email</h1>
            <p className="mt-2 text-sm text-gray-600">Please wait while we confirm your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-4 space-y-5">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Verified!</h1>
              <p className="mt-2 text-sm text-gray-600">
                Your account is now activated. You can now sign in to your dashboard.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Continue to Login
            </button>
          </div>
        )}

        {status === 'already_verified' && (
          <div className="text-center py-4 space-y-5">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Already Verified</h1>
              <p className="mt-2 text-sm text-gray-600">
                This email address has already been verified. You can log in directly.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}

        {(status === 'error' || status === 'idle') && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100">
                <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="mt-4 text-2xl font-bold text-gray-900">
                {status === 'error' ? 'Verification Failed' : 'Resend Verification Email'}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {status === 'error'
                  ? errorMessage
                  : 'Enter your registered email address to receive a new verification link.'}
              </p>
            </div>

            {resendSuccess ? (
              <div className="rounded-lg bg-green-50 p-4 border border-green-200 text-center space-y-3">
                <p className="text-sm font-medium text-green-800">
                  A new verification link has been sent to your email.
                </p>
                <Link
                  to="/login"
                  className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleResend} className="space-y-4" noValidate>
                {resendError && (
                  <div className="rounded-lg bg-red-50 p-3 border border-red-200">
                    <p className="text-xs text-red-700">{resendError}</p>
                  </div>
                )}
                <div>
                  <label htmlFor="resendEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="resendEmail"
                    name="resendEmail"
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => {
                      setResendEmail(e.target.value)
                      if (resendError) setResendError('')
                    }}
                    placeholder="student@example.com"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {resendLoading ? 'Sending...' : 'Send Verification Email'}
                </button>
                <div className="text-center pt-2">
                  <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
