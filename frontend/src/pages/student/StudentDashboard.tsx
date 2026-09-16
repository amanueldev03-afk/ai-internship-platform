import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { 
  Sparkles, 
  FileText, 
  Bookmark, 
  Send, 
  ArrowRight, 
  Upload, 
  RefreshCw, 
  UserCheck, 
  KeyRound, 
  AlertCircle,
  Compass,
  ChevronRight,
  Lock,
  MapPin,
  Briefcase,
  ExternalLink
} from 'lucide-react'
import { useAppSelector } from '@/hooks/redux'
import * as authApi from '@/services/authApi'
import * as studentApi from '@/services/studentApi'
import { fetchDashboardData } from '@/services/dashboardApi'
import { searchInternships } from '@/services/internshipApi'
import type { DashboardData } from '@/services/dashboardApi'
import type { User, Internship } from '@/types'
import type { Skill, CareerInterest } from '@/services/studentApi'
import { Button } from '@/components/ui/button'

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-error-50/80 dark:bg-error-950/40 border border-error-200 dark:border-error-800">
      <span className="text-xs font-semibold text-error-700 dark:text-error-400">{message}</span>
      <button
        onClick={onRetry}
        className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 underline transition-all duration-200"
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
    <div className="card-gradient p-6 rounded-3xl space-y-4 hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Resume</span>
        <div className="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
          <FileText className="w-4 h-4" />
        </div>
      </div>
      {error ? (
        <SectionError message="Resume status unavailable" onRetry={onRetry} />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span aria-label={`Resume status: ${statusLabel}`} className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {hasResume
              ? skillsDetected > 0
                ? `${skillsDetected} skills detected`
                : 'Uploaded & Verified'
              : 'Upload to unlock AI recommendations'}
          </div>
          <div className="pt-1">
            <Link
              to="/profile"
              className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
            >
              {hasResume ? 'View Resume' : 'Upload Resume'} <span aria-hidden="true">→</span>
            </Link>
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
  icon: Icon,
  badgeText,
}: {
  label: string
  value: number | null
  error: boolean
  onRetry: () => void
  emptyMessage: string
  presentMessage: string
  icon: any
  badgeText?: string
}) {
  return (
    <div className="card-gradient p-6 rounded-3xl space-y-4 hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {error ? (
        <SectionError message={`${label} unavailable`} onRetry={onRetry} />
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-extrabold gradient-text" aria-label={`${value} ${label.toLowerCase()}`}>
              {value !== null ? value : '—'}
            </div>
            {badgeText && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-400">
                {badgeText}
              </span>
            )}
          </div>
          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {value === 0 ? emptyMessage : presentMessage}
          </div>
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
    <div className="card-gradient p-6 rounded-3xl space-y-4 hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Profile Strength
        </span>
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <UserCheck className="w-4 h-4" />
        </div>
      </div>
      {error ? (
        <SectionError message="Profile completion unavailable" onRetry={onRetry} />
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <span
              className="text-3xl font-extrabold gradient-text"
              aria-label={percent === null ? 'Profile completion: unknown percent' : `Profile completion: ${clamped} percent`}
            >
              {percent !== null ? `${clamped}%` : '—'}
            </span>
            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">{statusLabel}</span>
          </div>
          <div
            className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden"
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completion progress"
          >
            <div
              className="bg-gradient-to-r from-primary-500 via-secondary-500 to-emerald-500 h-2.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${clamped}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-medium text-neutral-400">
            {sections && (
              <span>
                {Object.values(sections).filter(Boolean).length}/{Object.keys(sections).length} sections done
              </span>
            )}
            <Link to="/profile" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              Edit Profile →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default function StudentDashboard() {
  const authUser = useAppSelector((state) => state.auth.user)

  const [user, setUser] = useState<User | null>(authUser)
  const [data, setData] = useState<DashboardData | null>(null)
  const [mySkills, setMySkills] = useState<Skill[]>([])
  const [myInterests, setMyInterests] = useState<CareerInterest[]>([])
  const [featuredInternships, setFeaturedInternships] = useState<Internship[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [userResult, dashData, skillsResult, interestsResult, internshipsResult] = await Promise.allSettled([
        authApi.getCurrentUser(),
        fetchDashboardData(),
        studentApi.getStudentSkills(),
        studentApi.getStudentInterests(),
        searchInternships({ page_size: 6 }),
      ])

      if (userResult.status === 'fulfilled') {
        setUser(userResult.value)
      }
      
      if (skillsResult.status === 'fulfilled') setMySkills(skillsResult.value)
      if (interestsResult.status === 'fulfilled') setMyInterests(interestsResult.value)
      if (internshipsResult.status === 'fulfilled') {
        setFeaturedInternships(internshipsResult.value.results.slice(0, 6))
      }

      if (dashData.status === 'fulfilled') {
        setData(dashData.value)
        const d = dashData.value
        if (d.profileError && d.dashboardError && d.recommendationsError && d.resumeError) {
          setError('Failed to load dashboard data. Please try again.')
        }
      } else {
        setError('Failed to load dashboard data. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleChangePassword = () => {
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
      await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      })
      setPasswordSuccess('Password changed successfully')
      setTimeout(() => {
        setShowChangePasswordModal(false)
        setPasswordSuccess(null)
      }, 2000)
    } catch (err: any) {
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

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

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
    if (user?.profile_photo_url) return user.profile_photo_url
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

  const fullName =
    user?.first_name || user?.last_name
      ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
      : user?.username || 'Student User'

  const completionPct = data?.profile?.completion?.percent ?? null
  const sections = data?.profile?.completion?.sections ?? null
  const clampedPct = completionPct === null ? 0 : Math.min(100, Math.max(0, completionPct))
  const isComplete = clampedPct === 100

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
    if (!hasResume) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
    if (resumeProcessingStatus === 'FAILED') return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
    if (resumeProcessingStatus === 'PENDING' || resumeProcessingStatus === 'PROCESSING')
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
  })()

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in" role="status" aria-label="Loading dashboard">
        <span className="sr-only">Loading your dashboard data...</span>
        <div className="card-gradient p-8 rounded-3xl animate-pulse space-y-4">
          <div className="h-8 w-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="h-4 w-96 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card-gradient p-6 rounded-3xl animate-pulse space-y-4">
              <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-8 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-800/60 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!user && authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in p-6">
        <div className="card-gradient p-8 rounded-3xl text-center max-w-md shadow-card">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <p className="text-error-600 dark:text-error-400 font-bold mb-4">Failed to load user profile</p>
          <Button onClick={loadData} className="w-full rounded-2xl shadow-glow">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner with Greeting & Profile Overview */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 via-primary-50/40 to-secondary-50/30 dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800/80 p-6 sm:p-8 backdrop-blur-2xl shadow-soft">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-5">
            {/* Profile Photo */}
            <div className="relative group">
              {getProfilePhotoUrl(user) ? (
                <img
                  src={getProfilePhotoUrl(user)}
                  alt="Profile"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white dark:border-neutral-700 shadow-glow transition-all duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-secondary-500 text-white text-2xl font-black flex items-center justify-center shadow-glow">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl p-1.5 cursor-pointer shadow-soft hover:scale-110 transition-transform">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
                {isUploadingPhoto ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
              </label>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                  Welcome back, {fullName}!
                </h1>
              </div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                Your AI-powered opportunity pipeline is active and analyzing fresh roles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link to="/recommendations" className="flex-1 sm:flex-initial">
              <Button className="w-full sm:w-auto rounded-2xl shadow-glow text-xs sm:text-sm font-bold">
                <Sparkles className="w-4 h-4 mr-1.5" /> AI Matches
              </Button>
            </Link>
            <Link to="/profile" className="flex-1 sm:flex-initial">
              <Button variant="secondary" className="w-full sm:w-auto rounded-2xl text-xs sm:text-sm font-bold">
                {isComplete ? 'View Profile' : 'Complete Profile'}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleChangePassword}
              className="rounded-2xl shrink-0"
              title="Change Password"
            >
              <Lock className="w-4 h-4 text-neutral-500" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="rounded-2xl bg-error-50/90 dark:bg-error-950/40 p-4 border border-error-200 dark:border-error-800/80 animate-scale-in" role="alert">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400" />
              <p className="text-sm font-medium text-error-700 dark:text-error-300">{error}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={loadData} className="text-error-600 dark:text-error-400 hover:bg-error-100">
              Try again
            </Button>
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <ProfileCompletionCard
          percent={completionPct}
          sections={sections}
          error={data?.profileError ?? false}
          onRetry={loadData}
        />

        <ResumeStatusCard
          hasResume={hasResume}
          statusLabel={resumeStatusLabel}
          statusColor={resumeStatusColor}
          skillsDetected={cvSkillsDetected}
          error={data?.resumeError ?? false}
          onRetry={loadData}
        />

        <CountCard
          label="Recommendations"
          value={data?.recommendationsError ? null : recommendationsCount}
          error={data?.recommendationsError ?? false}
          onRetry={loadData}
          emptyMessage="Complete your profile for matches"
          presentMessage="Matched for your profile"
          icon={Sparkles}
          badgeText="High Fit"
        />

        <CountCard
          label="Saved"
          value={data?.dashboardError ? null : savedCount}
          error={data?.dashboardError ?? false}
          onRetry={loadData}
          emptyMessage="No saved internships yet"
          presentMessage="Saved internships"
          icon={Bookmark}
        />

        <CountCard
          label="Applied"
          value={data?.dashboardError ? null : applicationsCount}
          error={data?.dashboardError ?? false}
          onRetry={loadData}
          emptyMessage="No applications yet"
          presentMessage="Submitted applications"
          icon={Send}
        />
      </div>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/recommendations"
          className="group card-gradient p-5 rounded-3xl flex items-center justify-between hover:border-primary-400/60 hover:shadow-glow transition-all duration-300"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">AI Recommendations</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Personalized matching</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/internships"
          className="group card-gradient p-5 rounded-3xl flex items-center justify-between hover:border-secondary-400/60 hover:shadow-glow transition-all duration-300"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">Browse Internships</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Search all active roles</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/profile"
          className="group card-gradient p-5 rounded-3xl flex items-center justify-between hover:border-emerald-400/60 hover:shadow-glow transition-all duration-300"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">Resume & CV</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{hasResume ? 'View extraction' : 'Upload CV'}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/applications/history"
          className="group card-gradient p-5 rounded-3xl flex items-center justify-between hover:border-accent-400/60 hover:shadow-glow transition-all duration-300"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-accent-500/10 text-accent-600 dark:text-accent-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">Track Applications</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Application status hub</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Skills & Interests Overview */}
      <div className="card-gradient p-6 sm:p-8 rounded-3xl shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Your Technical Profile & Interests</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              These verified tags are used by the AI engine to compute recommendation similarity.
            </p>
          </div>
          <Link to="/profile">
            <Button size="sm" variant="ghost" className="rounded-xl text-xs font-bold">
              Manage Skills <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Verified Skills ({mySkills.length})
            </span>
            {mySkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mySkills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-3 py-1 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/70 dark:border-primary-800/80 text-xs font-semibold"
                  >
                    {skill.name}
                    {skill.category && <span className="ml-1 text-primary-400 text-[10px]">({skill.category})</span>}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 font-medium">No skills registered yet. Add skills in your profile.</p>
            )}
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Career Interests ({myInterests.length})
            </span>
            {myInterests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {myInterests.map((interest) => (
                  <span
                    key={interest.id}
                    className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/80 text-xs font-semibold"
                  >
                    {interest.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 font-medium">No career interests selected yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Featured Live Internships Section */}
      <div className="card-gradient p-6 sm:p-8 rounded-3xl shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                Live Ingested Feed
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                ({featuredInternships.length > 0 ? `${featuredInternships.length} of ${data?.recommendationsCount || '200+'} available` : 'Active positions'})
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mt-1">Latest Active Internships</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Real-world positions continuously collected from verified industry data sources and career portals.
            </p>
          </div>
          <Link to="/internships">
            <Button size="sm" variant="default" className="rounded-xl text-xs font-bold shadow-soft">
              Browse All Internships <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {featuredInternships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredInternships.map((internship) => (
              <div
                key={internship.id}
                className="card-gradient p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between hover:shadow-glow hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 capitalize">
                      {internship.internship_type || 'remote'}
                    </span>
                    {internship.work_type && (
                      <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 capitalize">
                        {internship.work_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-primary-600 transition-colors">
                      {internship.title}
                    </h3>
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mt-0.5">
                      {internship.organization_name}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-y-1.5 gap-x-3 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                    {internship.location_text && (
                      <span className="inline-flex items-center gap-1 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{internship.location_text}</span>
                      </span>
                    )}
                    {internship.category && (
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate max-w-[120px]">{internship.category}</span>
                      </span>
                    )}
                  </div>

                  {internship.required_skills && internship.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {internship.required_skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300"
                        >
                          {typeof skill === 'string' ? skill : (skill as any).name}
                        </span>
                      ))}
                      {internship.required_skills.length > 3 && (
                        <span className="text-[10px] text-neutral-400 font-semibold self-center">
                          +{internship.required_skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 mt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <Link to={`/internships/${internship.id}`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full rounded-xl text-xs font-bold">
                      Details
                    </Button>
                  </Link>
                  {internship.application_url ? (
                    <a
                      href={internship.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button size="sm" className="w-full rounded-xl text-xs font-bold shadow-glow inline-flex items-center justify-center gap-1">
                        Apply <ExternalLink className="w-3 h-3 ml-0.5" />
                      </Button>
                    </a>
                  ) : (
                    <Link to={`/internships/${internship.id}`} className="flex-1">
                      <Button size="sm" className="w-full rounded-xl text-xs font-bold shadow-glow">
                        Apply
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-dashed border-neutral-200 dark:border-neutral-800">
            <Compass className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Syncing live internships...</p>
            <p className="text-xs text-neutral-400 mt-1">Real-time listings will appear here automatically.</p>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card-gradient rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-glow border border-neutral-200/80 dark:border-neutral-800 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Change Password</h2>
              </div>
              <button
                onClick={() => {
                  setShowChangePasswordModal(false)
                  setPasswordError(null)
                  setPasswordSuccess(null)
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{passwordSuccess}</p>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3.5 bg-error-50 dark:bg-error-950/50 border border-error-200 dark:border-error-800 rounded-2xl">
                <p className="text-xs font-bold text-error-700 dark:text-error-300">{passwordError}</p>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  name="old_password"
                  required
                  disabled={isChangingPassword}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  name="new_password"
                  required
                  disabled={isChangingPassword}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="new_password_confirm"
                  required
                  disabled={isChangingPassword}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowChangePasswordModal(false)}
                  disabled={isChangingPassword}
                  className="flex-1 rounded-2xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 rounded-2xl shadow-glow text-xs font-bold"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
