import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { logoutUser } from '@/features/auth/authSlice'
import * as authApi from '@/services/authApi'
import * as studentApi from '@/services/studentApi'
import { fetchDashboardData } from '@/services/dashboardApi'
import type { DashboardData } from '@/services/dashboardApi'
import type { User } from '@/types'
import type { Skill, CareerInterest } from '@/services/studentApi'

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-red-700">{message}</span>
      <button
        onClick={onRetry}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-500 underline"
      >
        Retry
      </button>
    </div>
  )
}

function ResumeStatusCard({
  hasResume,
  statusLabel,
  statusColor,
  skillsDetected,
  error,
  onRetry,
}: {
  hasResume: boolean
  statusLabel: string
  statusColor: string
  skillsDetected: number
  error: boolean
  onRetry: () => void
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-3">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resume</span>
      {error ? (
        <SectionError message="Resume status unavailable" onRetry={onRetry} />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span aria-label={`Resume status: ${statusLabel}`} className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {hasResume
              ? skillsDetected > 0
                ? `${skillsDetected} skills detected`
                : 'Uploaded'
              : 'Upload to unlock AI recommendations'}
          </div>
        </>
      )}
    </div>
  )
}

function CountCard({
  label,
  value,
  error,
  onRetry,
  emptyMessage,
  presentMessage,
}: {
  label: string
  value: number | null
  error: boolean
  onRetry: () => void
  emptyMessage: string
  presentMessage: string
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-3">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      {error ? (
        <SectionError message={`${label} unavailable`} onRetry={onRetry} />
      ) : (
        <>
          <div className="text-3xl font-bold text-gray-900" aria-label={`${value} ${label.toLowerCase()}`}>
            {value}
          </div>
          <div className="text-xs text-gray-500">{value === 0 ? emptyMessage : presentMessage}</div>
        </>
      )}
    </div>
  )
}

function ProfileCompletionCard({
  percent,
  sections,
  error,
  onRetry,
}: {
  percent: number | null
  sections: Record<string, boolean> | null
  error: boolean
  onRetry: () => void
}) {
  const clamped = percent === null ? 0 : Math.min(100, Math.max(0, percent))
  const isComplete = clamped === 100

  const statusLabel = (() => {
    if (percent === null) return 'Unknown'
    if (isComplete) return 'Complete'
    if (clamped === 0) return 'Not started'
    if (clamped < 50) return 'Getting started'
    if (clamped < 80) return 'Almost there'
    return 'Nearly complete'
  })()

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-3">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Profile Completion
      </span>
      {error ? (
        <SectionError message="Profile completion unavailable" onRetry={onRetry} />
      ) : (
        <>
          <div className="flex items-baseline gap-1">
            <span
              className="text-3xl font-bold text-indigo-600"
              aria-label={percent === null ? 'Profile completion: unknown percent' : `Profile completion: ${clamped} percent`}
            >
              {percent !== null ? `${clamped}%` : '—'}
            </span>
          </div>
          <div
            className="w-full bg-gray-200 rounded-full h-2"
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completion progress"
          >
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${clamped}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{statusLabel}</span>
            {sections && (
              <span className="text-xs text-gray-400">
                {Object.values(sections).filter(Boolean).length}/{Object.keys(sections).length} sections
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function StudentDashboard() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const authUser = useAppSelector((state) => state.auth.user)
  const { isLoading: isAuthLoading } = useAppSelector((state) => state.auth)

  const [user, setUser] = useState<User | null>(authUser)
  const [data, setData] = useState<DashboardData | null>(null)
  const [mySkills, setMySkills] = useState<Skill[]>([])
  const [myInterests, setMyInterests] = useState<CareerInterest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('Loading dashboard data...')
      const [userResult, dashData, skillsResult, interestsResult] = await Promise.allSettled([
        authApi.getCurrentUser(),
        fetchDashboardData(),
        studentApi.getStudentSkills(),
        studentApi.getStudentInterests(),
      ])

      console.log('User result:', userResult.status)
      console.log('Dashboard result:', dashData.status)
      console.log('Skills result:', skillsResult.status)
      console.log('Interests result:', interestsResult.status)

      if (userResult.status === 'fulfilled') {
        console.log('User data loaded:', userResult.value)
        setUser(userResult.value)
      } else {
        console.error('User load failed:', userResult.reason)
      }
      
      if (skillsResult.status === 'fulfilled') setMySkills(skillsResult.value)
      if (interestsResult.status === 'fulfilled') setMyInterests(interestsResult.value)

      if (dashData.status === 'fulfilled') {
        console.log('Dashboard data loaded:', dashData.value)
        setData(dashData.value)
        const d = dashData.value
        if (d.profileError && d.dashboardError && d.recommendationsError && d.resumeError) {
          setError('Failed to load dashboard data. Please try again.')
        }
      } else {
        console.error('Dashboard load failed:', dashData.reason)
        setError('Failed to load dashboard data. Please try again.')
      }
    } catch (err) {
      console.error('Unexpected error loading dashboard:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const settingsButton = target.closest('[aria-label="Settings"]')
      const settingsMenu = target.closest('.absolute.right-0.mt-2')
      
      if (showSettingsMenu && !settingsButton && !settingsMenu) {
        setShowSettingsMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSettingsMenu])

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    await dispatch(logoutUser(refreshToken))
    navigate('/login')
  }

  const handleChangePassword = () => {
    setShowSettingsMenu(false)
    setShowChangePasswordModal(true)
    setPasswordError(null)
    setPasswordSuccess(null)
  }

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const oldPassword = formData.get('old_password') as string
    const newPassword = formData.get('new_password') as string
    const newPasswordConfirm = formData.get('new_password_confirm') as string

    if (!oldPassword || !newPassword || !newPasswordConfirm) {
      setPasswordError('All fields are required')
      return
    }

    if (newPassword !== newPasswordConfirm) {
      setPasswordError('New passwords do not match')
      return
    }

    setIsChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(null)

    try {
      const response = await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      })
      console.log('Password change response:', response)
      setPasswordSuccess('Password changed successfully')
      setTimeout(() => {
        setShowChangePasswordModal(false)
        setPasswordSuccess(null)
      }, 2000)
    } catch (err: any) {
      console.error('Password change error:', err)
      console.error('Error response:', err.response?.data)
      // Handle different error formats
      if (err.response?.data) {
        const errorData = err.response.data
        if (typeof errorData === 'string') {
          setPasswordError(errorData)
        } else if (errorData.detail) {
          setPasswordError(errorData.detail)
        } else if (errorData.old_password) {
          setPasswordError(`Old password: ${errorData.old_password}`)
        } else if (errorData.new_password) {
          setPasswordError(`New password: ${errorData.new_password}`)
        } else if (errorData.new_password_confirm) {
          setPasswordError(`Confirm password: ${errorData.new_password_confirm}`)
        } else if (errorData.non_field_errors) {
          setPasswordError(errorData.non_field_errors.join(', '))
        } else {
          setPasswordError('Failed to change password. Please check your inputs and try again.')
        }
      } else {
        setPasswordError('Failed to change password. Please try again.')
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setIsUploadingPhoto(true)
    try {
      const updatedUser = await authApi.updateUser({ profile_photo: file })
      setUser(updatedUser)
    } catch (err) {
      alert('Failed to upload profile photo. Please try again.')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const getProfilePhotoUrl = (user: User | null) => {
    // Use the full URL from backend if available
    if (user?.profile_photo_url) {
      return user.profile_photo_url
    }
    // Fallback to constructing URL from relative path
    if (user?.profile_photo) {
      if (user.profile_photo.startsWith('http://') || user.profile_photo.startsWith('https://')) {
        return user.profile_photo
      }
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      const baseUrl = apiBaseUrl.replace('/api', '')
      return `${baseUrl}/media/${user.profile_photo}`
    }
    return null
  }

  // -----------------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------------
  const fullName =
    user?.first_name || user?.last_name
      ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
      : user?.username || 'Student User'

  const completionPct = data?.profile?.completion?.percent ?? null
  const sections = data?.profile?.completion?.sections ?? null
  const clampedPct = completionPct === null ? 0 : Math.min(100, Math.max(0, completionPct))
  const isComplete = clampedPct === 100

  // Resume state — authoritative source is GET /api/students/me/resume/,
  // with the student profile's cv_data as a fallback.
  const hasResume = data?.resumeStatus?.has_resume ?? data?.profile?.cv_data?.has_cv ?? false
  const resumeProcessingStatus =
    data?.resumeStatus?.processing_status ?? data?.profile?.cv_data?.processing_status ?? null
  const cvSkillsDetected = data?.profile?.cv_data?.merged_skills?.length ?? 0

  const savedCount = data?.dashboardSummary?.saved_internships ?? 0
  const applicationsCount = data?.dashboardSummary?.total_applications ?? 0
  const recommendationsCount = data?.recommendationsCount ?? 0

  const resumeStatusLabel = (() => {
    if (!hasResume) return 'No resume uploaded'
    if (resumeProcessingStatus === 'PENDING' || resumeProcessingStatus === 'PROCESSING')
      return 'Processing...'
    if (resumeProcessingStatus === 'FAILED') return 'Processing failed'
    if (resumeProcessingStatus === 'COMPLETED') return 'Resume ready'
    return 'Resume uploaded'
  })()

  const resumeStatusColor = (() => {
    if (!hasResume) return 'bg-amber-100 text-amber-800'
    if (resumeProcessingStatus === 'FAILED') return 'bg-red-100 text-red-800'
    if (resumeProcessingStatus === 'PENDING' || resumeProcessingStatus === 'PROCESSING')
      return 'bg-blue-100 text-blue-800'
    return 'bg-green-100 text-green-800'
  })()

  // -----------------------------------------------------------------------
  // Loading skeleton
  // -----------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50" role="status" aria-label="Loading dashboard">
        <span className="sr-only">Loading your dashboard data...</span>
        {/* Navbar skeleton */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-3">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-14 bg-gray-200 rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-9 w-16 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Welcome banner skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-pulse">
            <div className="h-7 w-64 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-96 bg-gray-100 rounded" />
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse space-y-3"
              >
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-8 w-16 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  // Show error if user data failed to load but we have auth
  if (!user && authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load user data</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl font-extrabold text-indigo-600">AI Internship</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold uppercase">
                Student
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/profile"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
              >
                My Profile
              </Link>

              {/* Settings Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Settings"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>

                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={handleChangePassword}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Change Password
                    </button>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      disabled={isAuthLoading}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {isAuthLoading ? 'Logging out...' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200" role="alert">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={loadData}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Profile Photo */}
            <div className="relative">
              {getProfilePhotoUrl(user) ? (
                <img
                  src={getProfilePhotoUrl(user)}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                  <span className="text-gray-400 text-2xl">?</span>
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-1.5 cursor-pointer transition-colors shadow-sm">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
                {isUploadingPhoto ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {fullName}!</h1>
              <p className="text-sm text-gray-500 mt-1">
                Here is an overview of your profile and internship activity.
              </p>
            </div>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            {isComplete ? 'View Profile' : 'Complete Profile'}
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Summary Count Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link to="/profile" className="block focus:outline-none hover:scale-[1.01] transition-transform">
            <ProfileCompletionCard
              percent={completionPct}
              sections={sections}
              error={data?.profileError ?? false}
              onRetry={loadData}
            />
          </Link>

          <Link to="/profile" className="block focus:outline-none hover:scale-[1.01] transition-transform">
            <ResumeStatusCard
              hasResume={hasResume}
              statusLabel={resumeStatusLabel}
              statusColor={resumeStatusColor}
              skillsDetected={cvSkillsDetected}
              error={data?.resumeError ?? false}
              onRetry={loadData}
            />
          </Link>

          <Link to="/recommendations" className="block focus:outline-none hover:scale-[1.01] transition-transform">
            <CountCard
              label="Recommendations"
              value={data?.recommendationsError ? null : recommendationsCount}
              error={data?.recommendationsError ?? false}
              onRetry={loadData}
              emptyMessage="Complete your profile for matches"
              presentMessage="Internships matched for you"
            />
          </Link>

          <Link to="/saved" className="block focus:outline-none hover:scale-[1.01] transition-transform">
            <CountCard
              label="Saved"
              value={data?.dashboardError ? null : savedCount}
              error={data?.dashboardError ?? false}
              onRetry={loadData}
              emptyMessage="No saved internships yet"
              presentMessage="Internships saved for later"
            />
          </Link>

          <Link to="/internships" className="block focus:outline-none hover:scale-[1.01] transition-transform">
            <CountCard
              label="Applications"
              value={data?.dashboardError ? null : applicationsCount}
              error={data?.dashboardError ?? false}
              onRetry={loadData}
              emptyMessage="No applications yet"
              presentMessage="Internships applied to"
            />
          </Link>
        </div>

        {/* Skills & Interests Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Your Skills & Interests</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Skills ({mySkills.length})</h3>
              {mySkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {mySkills.map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      {skill.name}
                      {skill.category && <span className="ml-1 text-indigo-400">({skill.category})</span>}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No skills added yet</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Career Interests ({myInterests.length})</h3>
              {myInterests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {myInterests.map((interest) => (
                    <span
                      key={interest.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100"
                    >
                      {interest.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No interests added yet</p>
              )}
            </div>
          </div>
          {mySkills.length === 0 && myInterests.length === 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                to="/profile"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Add skills and interests to improve your internship matches →
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/recommendations" className="inline-flex items-center px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">View Recommendations</p>
                <p className="text-xs text-gray-500">AI-matched internships</p>
              </div>
            </Link>

            <Link to="/internships" className="inline-flex items-center px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Browse Internships</p>
                <p className="text-xs text-gray-500">Explore all active opportunities</p>
              </div>
            </Link>

            <Link
              to="/profile"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Edit Profile</span>
                <span className="block text-xs text-gray-500">Update your information</span>
              </div>
            </Link>

            <Link
              to="/profile"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">
                  {hasResume ? 'View Resume' : 'Upload Resume'}
                </span>
                <span className="block text-xs text-gray-500">
                  {hasResume ? 'Check parsed content' : 'Unlock AI features'}
                </span>
              </div>
            </Link>

            {!isComplete && (
              <Link
                to="/profile"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Improve Profile</span>
                  <span className="block text-xs text-gray-500">Reach {Math.min(100, clampedPct + Math.ceil((100 - clampedPct) / 2))}% completion</span>
                </div>
              </Link>
            )}

            <Link
              to="/profile"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Update Preferences</span>
                <span className="block text-xs text-gray-500">Work mode, location, type</span>
              </div>
            </Link>

            <Link
              to="/recommendations"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">View Recommendations</span>
                <span className="block text-xs text-gray-500">AI-powered internship matches</span>
              </div>
            </Link>

            <Link
              to="/saved"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Saved Internships</span>
                <span className="block text-xs text-gray-500">View bookmarked internships</span>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
              <button
                onClick={() => {
                  setShowChangePasswordModal(false)
                  setPasswordError(null)
                  setPasswordSuccess(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{passwordSuccess}</p>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{passwordError}</p>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="old_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="old_password"
                  name="old_password"
                  required
                  disabled={isChangingPassword}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  required
                  disabled={isChangingPassword}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="new_password_confirm" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="new_password_confirm"
                  name="new_password_confirm"
                  required
                  disabled={isChangingPassword}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false)
                    setPasswordError(null)
                    setPasswordSuccess(null)
                  }}
                  disabled={isChangingPassword}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
