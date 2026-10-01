import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  Calendar,
  ExternalLink,
  Cpu,
  Utensils,
  CheckCircle2,
  ShieldCheck,
  MessagesSquare,
  FileCheck,
  Award,
  Users,
  Copy,
  Check,
  QrCode,
  X,
  Clock
} from 'lucide-react'
import api from '@/services/api'
import { useAppSelector } from '@/hooks/redux'
import * as authApi from '@/services/authApi'
import * as studentApi from '@/services/studentApi'
import { fetchDashboardData, getRecommendations } from '@/services/dashboardApi'
import { searchInternships } from '@/services/internshipApi'
import { getMyTeamChannel, uploadTeamSRS, type ProjectTeamData } from '@/services/projectsApi'
import { getCampusLogistics, type CampusLogisticsItem } from '@/services/logisticsApi'
import TeamCommunicationHub from '@/components/communication/TeamCommunicationHub'
import type { DashboardData } from '@/services/dashboardApi'
import type { User, Internship } from '@/types'
import type { Skill, CareerInterest } from '@/services/studentApi'
import { Button } from '@/components/ui/button'
import { normalizeApplicationUrl } from '@/utils/urlValidation'

function formatDate(dateString?: string) {
  if (!dateString) return 'Active'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}


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
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as 'overview' | 'track1' | 'logistics' | 'channel') || 'overview'
  const setActiveTab = (tab: 'overview' | 'track1' | 'logistics' | 'channel') => {
    setSearchParams({ tab })
  }
  const [myTeam, setMyTeam] = useState<ProjectTeamData | null>(null)
  const [campusPass, setCampusPass] = useState<CampusLogisticsItem | null>(null)
  const [srsFile, setSrsFile] = useState<File | null>(null)
  const [isUploadingSRS, setIsUploadingSRS] = useState(false)
  const [srsStatusMsg, setSrsStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copiedHash, setCopiedHash] = useState(false)
  const [mySkills, setMySkills] = useState<Skill[]>([])
  const [myInterests, setMyInterests] = useState<CareerInterest[]>([])

  const [featuredInternships, setFeaturedInternships] = useState<Internship[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<Internship[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  // Track 1 Student State
  const [invitations, setInvitations] = useState<any[]>([])
  const [isRespondingInvite, setIsRespondingInvite] = useState<string | null>(null)
  const [isForwardingToUIL, setIsForwardingToUIL] = useState(false)
  const [forwardedToUIL, setForwardedToUIL] = useState(false)
  const [studentQrModal, setStudentQrModal] = useState<{ title: string; qrBase64: string } | null>(null)

  // Direct Company Chat
  const [companyChatInviteId, setCompanyChatInviteId] = useState<string | null>(null)
  const [companyChatMessages, setCompanyChatMessages] = useState<any[]>([])
  const [companyChatText, setCompanyChatText] = useState('')
  const [isSendingCompanyChat, setIsSendingCompanyChat] = useState(false)

  // Submissions & Timers
  const [submittingDoc, setSubmittingDoc] = useState(false)
  const [docContent, setDocContent] = useState('')
  const [submittingImpl, setSubmittingImpl] = useState(false)
  const [implRepoUrl, setImplRepoUrl] = useState('')

  const handleForwardToUIL = async () => {
    setIsForwardingToUIL(true)
    try {
      await api.post('/v1/uil-profiles/student/forward-to-uil/')
      alert('Your verified credentials, Dean QR letters, and Excel roster have been officially forwarded to the UIL Officer!')
      setForwardedToUIL(true)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Forwarding failed. Ensure Department Dean has completed official verification.')
    } finally {
      setIsForwardingToUIL(false)
    }
  }

  const handleRespondInvitation = async (invitationId: string, response: 'ACCEPT' | 'DECLINE') => {
    setIsRespondingInvite(invitationId)
    try {
      await api.post(`/companies/student/invitations/${invitationId}/respond/`, { response })
      alert(`Invitation ${response === 'ACCEPT' ? 'accepted! Direct chat with company unlocked.' : 'declined.'}`)
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === invitationId ? { ...inv, status: response === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED' } : inv))
      )
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Response failed.')
    } finally {
      setIsRespondingInvite(null)
    }
  }

  const handleOpenCompanyChat = async (invitationId: string) => {
    setCompanyChatInviteId(invitationId)
    try {
      const res = await api.get(`/companies/chat/${invitationId}/`)
      setCompanyChatMessages(res.data.messages || [])
    } catch {
      // silent
    }
  }

  const handleSendCompanyChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyChatInviteId || !companyChatText.trim()) return
    setIsSendingCompanyChat(true)
    try {
      const res = await api.post(`/companies/chat/${companyChatInviteId}/send/`, {
        message: companyChatText.trim(),
      })
      setCompanyChatMessages((prev) => [...prev, res.data])
      setCompanyChatText('')
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to send message.')
    } finally {
      setIsSendingCompanyChat(false)
    }
  }

  const handleSubmitDocumentation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!myTeam || !docContent.trim()) return
    setSubmittingDoc(true)
    try {
      await api.post(`/v1/teams/${myTeam.id}/submit-documentation/`, {
        documentation_text: docContent.trim(),
      })
      alert('Software Requirements Specification (SRS) successfully submitted!')
      setDocContent('')
      loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Documentation submission failed or deadline expired.')
    } finally {
      setSubmittingDoc(false)
    }
  }

  const handleSubmitImplementation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!myTeam || !implRepoUrl.trim()) return
    setSubmittingImpl(true)
    try {
      await api.post(`/v1/teams/${myTeam.id}/submit-implementation/`, {
        repository_url: implRepoUrl.trim(),
        implementation_notes: 'Production build and test suite verified.',
      })
      alert('Project implementation & git repository successfully submitted!')
      setImplRepoUrl('')
      loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Implementation submission failed or deadline expired.')
    } finally {
      setSubmittingImpl(false)
    }
  }

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [userResult, dashData, skillsResult, interestsResult, internshipsResult, teamResult, logisticsResult] = await Promise.allSettled([
        authApi.getCurrentUser(),
        fetchDashboardData(),
        studentApi.getStudentSkills(),
        studentApi.getStudentInterests(),
        searchInternships({ page_size: 6 }),
        getMyTeamChannel(),
        getCampusLogistics(),
      ])

      try {
        const invRes = await api.get('/companies/student/invitations/')
        setInvitations(Array.isArray(invRes.data) ? invRes.data : [])
      } catch {
        // silent
      }

      if (userResult.status === 'fulfilled') {
        setUser(userResult.value)
      }
      
      if (skillsResult.status === 'fulfilled') setMySkills(skillsResult.value)
      if (interestsResult.status === 'fulfilled') setMyInterests(interestsResult.value)

      if (teamResult.status === 'fulfilled' && teamResult.value?.team) {
        setMyTeam(teamResult.value.team)
      }

      if (logisticsResult.status === 'fulfilled' && Array.isArray(logisticsResult.value) && logisticsResult.value.length > 0) {
        setCampusPass(logisticsResult.value[0])
      }
      
      if (dashData.status === 'fulfilled') {
        setData(dashData.value)
        const d = dashData.value
        if (d.profileError && d.dashboardError && d.recommendationsError && d.resumeError) {
          setError('Failed to load dashboard data. Please try again.')
        }

        // If profile is 100% complete, fetch AI recommendations
        const completionPct = d.profile?.completion?.percent ?? 0
        if (completionPct === 100 && !d.recommendationsError) {
          try {
            const recsResult = await getRecommendations(6)
            const recInternships = recsResult.results.map((r: any) => r.internship)
            setAiRecommendations(recInternships)
            setFeaturedInternships(recInternships)
          } catch (err) {
            console.error('Failed to load AI recommendations:', err)
          }
        } else if (internshipsResult.status === 'fulfilled') {
          setFeaturedInternships(internshipsResult.value.results.slice(0, 6))
        }
      } else {
        setError('Failed to load dashboard data. Please try again.')
        if (internshipsResult.status === 'fulfilled') {
          setFeaturedInternships(internshipsResult.value.results.slice(0, 6))
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSRSUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!myTeam || !srsFile) return
    setIsUploadingSRS(true)
    setSrsStatusMsg(null)
    try {
      const updated = await uploadTeamSRS(myTeam.id, srsFile)
      setMyTeam((prev) => prev ? { ...prev, ...updated, srs_status: 'SUBMITTED' } : updated)
      setSrsStatusMsg({
        type: 'success',
        text: 'Software Requirements Specification (SRS) successfully uploaded and queued for Academic Advisor review!',
      })
      setSrsFile(null)
    } catch (err: any) {
      setSrsStatusMsg({
        type: 'error',
        text: err.response?.data?.detail || err.response?.data?.srs_document?.[0] || 'Failed to upload SRS document. Please ensure it is a valid PDF.',
      })
    } finally {
      setIsUploadingSRS(false)
    }
  }

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

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

      {/* Quick Integration Status Strip */}
      {activeTab === 'overview' && (myTeam || campusPass) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-scale-in">
          {myTeam && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-500/10 via-primary-500/5 to-transparent border border-primary-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">{myTeam.team_name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      myTeam.srs_status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : myTeam.srs_status === 'SUBMITTED'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      SRS {myTeam.srs_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 truncate max-w-xs">{myTeam.project_title}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('track1')}
                className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                Track 1 Portal →
              </button>
            </div>
          )}

          {campusPass && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">Campus Digital Pass</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {campusPass.meal_card_active ? 'Meal Card Active' : 'Clearance Pending'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {campusPass.dorm_block ? `Block ${campusPass.dorm_block} • Room ${campusPass.dorm_room}` : 'Housing Assigned'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('logistics')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                View Clearance Pass →
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: OVERVIEW & INTERNSHIPS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
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
              {isComplete && aiRecommendations.length > 0 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400">
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  AI-Powered Matches
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                  Live Ingested Feed
                </span>
              )}
              <span className="text-xs text-neutral-400 font-medium">
                {isComplete && aiRecommendations.length > 0
                  ? `Personalized for your profile (${aiRecommendations.length} matches)`
                  : featuredInternships.length > 0
                  ? `${featuredInternships.length} of ${data?.recommendationsCount || '200+'} available`
                  : 'Active positions'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mt-1">
              {isComplete && aiRecommendations.length > 0 ? 'AI-Matched Internships' : 'Latest Active Internships'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isComplete && aiRecommendations.length > 0
                ? 'AI-powered recommendations based on your skills, interests, and preferences.'
                : 'Real-world positions continuously collected from verified industry data sources and career portals.'}
            </p>
          </div>
          <Link to={isComplete && aiRecommendations.length > 0 ? "/recommendations" : "/internships"}>
            <Button size="sm" variant="default" className="rounded-xl text-xs font-bold shadow-soft">
              {isComplete && aiRecommendations.length > 0 ? 'View All Matches' : 'Browse All Internships'} <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
                    {internship.application_deadline && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Deadline: {formatDate(internship.application_deadline)}</span>
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
                  {internship.application_url || internship.source_url ? (
                    <a
                      href={normalizeApplicationUrl(internship.application_url || internship.source_url) || '#'}
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
      </div>
      )}

      {/* TAB 2: TRACK 1 SOFTWARE HOUSE & DOCUMENTATION GATE */}
      {activeTab === 'track1' && (
        <div className="space-y-6 animate-fade-in">
          {srsStatusMsg && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                srsStatusMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              <span>{srsStatusMsg.text}</span>
              <button onClick={() => setSrsStatusMsg(null)} className="underline text-neutral-500">Dismiss</button>
            </div>
          )}

          {/* DEAN VERIFICATION & CREDENTIAL FORWARDING */}
          <div className="card-gradient p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Academic Dean Gate
                </span>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                  Official Department Dean Clearance & Base64 QR Letters
                </h3>
                <p className="text-xs text-neutral-500">
                  Cryptographic verification of 3rd-year academic completion, meal card authorization, and score sheet roster.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {campusPass?.dean_approved ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setStudentQrModal({
                          title: 'Dean Official Verification Letter QR',
                          qrBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAYAAAA8AXHiAAA...',
                        })
                      }
                      className="text-xs h-8 flex items-center gap-1 text-indigo-600 border-indigo-200"
                    >
                      <QrCode className="w-3.5 h-3.5" /> View Dean QR
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setStudentQrModal({
                          title: 'Dean Dorm & Meal Clearance Letter QR',
                          qrBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAYAAAA8AXHiAAA...',
                        })
                      }
                      className="text-xs h-8 flex items-center gap-1 text-teal-600 border-teal-200"
                    >
                      <Utensils className="w-3.5 h-3.5" /> Dorm/Meal QR
                    </Button>
                    <Button
                      size="sm"
                      disabled={isForwardingToUIL || forwardedToUIL}
                      onClick={handleForwardToUIL}
                      className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                    >
                      {forwardedToUIL ? 'Forwarded to UIL' : isForwardingToUIL ? 'Forwarding...' : '1-Click Forward to UIL'}
                    </Button>
                  </>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Awaiting Dean Verification
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* COMPANY DIRECT INVITATIONS INBOX */}
          {invitations.length > 0 && (
            <div className="card-gradient p-6 rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                      Employer Direct Invitations ({invitations.length})
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Companies matched by AI who have invited you for direct interview and placement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white">
                          {inv.company_name}
                        </span>
                        <span className="text-xs text-neutral-500">• {inv.internship_title}</span>
                        {inv.match_score && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            {inv.match_score}% Match
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 italic">
                        "{inv.invitation_note || 'We are pleased to invite you to interview for our internship.'}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {inv.status === 'ACCEPTED' ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenCompanyChat(inv.id)}
                          className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1"
                        >
                          <MessagesSquare className="w-3.5 h-3.5" /> Chat with Employer
                        </Button>
                      ) : inv.status === 'DECLINED' ? (
                        <span className="text-xs text-neutral-400">Declined</span>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            disabled={isRespondingInvite === inv.id}
                            onClick={() => handleRespondInvitation(inv.id, 'ACCEPT')}
                            className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isRespondingInvite === inv.id}
                            onClick={() => handleRespondInvitation(inv.id, 'DECLINE')}
                            className="text-xs h-8"
                          >
                            Decline
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!myTeam ? (
            <div className="card-gradient p-8 rounded-3xl text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary-500/10 text-primary-600 flex items-center justify-center mx-auto">
                <Cpu className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Track 1 In-House Software House</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                In Track 1, your university operates as a real-world software house company. The UIL Officer automatically balances student cohorts into squads according to tech stack skills once cohort registration concludes.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Squad Header Banner */}
              <div className="card-gradient p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400">
                      Track 1 Cohort Project
                    </span>
                    <h2 className="text-2xl font-black text-neutral-900 dark:text-white mt-1">
                      {myTeam.team_name}
                    </h2>
                    <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 mt-0.5">
                      Project: {myTeam.project_title}
                    </p>
                  </div>

                  {myTeam.assigned_advisor && (
                    <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-neutral-400 uppercase">Assigned Academic Advisor</div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-white">
                          {myTeam.assigned_advisor.first_name} {myTeam.assigned_advisor.last_name}
                        </div>
                        <button
                          onClick={() => setActiveTab('channel')}
                          className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <MessagesSquare className="w-3 h-3" />
                          Chat with Advisor
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Documentation Gate (SRS Stepper) */}
              <div className="card-gradient p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-primary-600" />
                    <div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        Two-Stage Documentation Gate (SRS)
                      </h3>
                      <p className="text-xs text-neutral-500">
                        SRS must be approved by your academic advisor before sprint tasks and code commits unlock.
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      myTeam.srs_status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : myTeam.srs_status === 'SUBMITTED'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : myTeam.srs_status === 'REVISION_REQUIRED'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    Gate Status: {myTeam.srs_status}
                  </span>
                </div>

                {/* Stepper Progress */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div className={`p-4 rounded-2xl border transition-all ${
                    myTeam.srs_status ? 'bg-primary-500/10 border-primary-500/30' : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                  }`}>
                    <div className="text-[10px] font-bold text-neutral-400">STAGE 1</div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white mt-1">1. Draft SRS</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">Specify architecture & API schemas</div>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${
                    myTeam.srs_status === 'SUBMITTED' || myTeam.srs_status === 'APPROVED' || myTeam.srs_status === 'REVISION_REQUIRED'
                      ? 'bg-primary-500/10 border-primary-500/30'
                      : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                  }`}>
                    <div className="text-[10px] font-bold text-neutral-400">STAGE 2</div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white mt-1">2. Upload PDF</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">Submit document for review</div>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${
                    myTeam.srs_status === 'SUBMITTED' || myTeam.srs_status === 'APPROVED'
                      ? 'bg-primary-500/10 border-primary-500/30'
                      : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                  }`}>
                    <div className="text-[10px] font-bold text-neutral-400">STAGE 3</div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white mt-1">3. Advisor Review</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">Evaluation & feedback</div>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${
                    myTeam.coding_unlocked
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-300'
                      : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500'
                  }`}>
                    <div className="text-[10px] font-bold text-neutral-400">STAGE 4</div>
                    <div className="text-xs font-bold mt-1">4. Coding Phase</div>
                    <div className="text-[11px] mt-0.5">
                      {myTeam.coding_unlocked ? 'Unlocked & Active' : 'Locked by Gate'}
                    </div>
                  </div>
                </div>

                {/* SRS Status Callout */}
                {myTeam.srs_status === 'APPROVED' ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                        Documentation Gate Cleared — Coding Phase Unlocked!
                      </h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                        Your academic advisor approved the SRS document. Git repositories and weekly sprint task submissions are now unlocked.
                      </p>
                    </div>
                  </div>
                ) : myTeam.srs_status === 'REVISION_REQUIRED' ? (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Revision Required by Academic Advisor</span>
                    </div>
                    {myTeam.srs_feedback && (
                      <p className="text-xs text-rose-800 dark:text-rose-200 bg-white/60 dark:bg-neutral-900/60 p-3 rounded-xl border border-rose-200/60 dark:border-rose-800/60">
                        Advisor Note: "{myTeam.srs_feedback}"
                      </p>
                    )}
                    {myTeam.srs_revision_deadline && (
                      <p className="text-[11px] text-rose-600 font-bold">
                        14-Day Revision Deadline: {new Date(myTeam.srs_revision_deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : null}

                {/* Upload Form */}
                <form onSubmit={handleSRSUploadSubmit} className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                        {myTeam.srs_document ? 'Upload Revised SRS Document' : 'Upload SRS Specification Document'}
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Upload your squad's SRS document in PDF format (Max 15MB).
                      </p>
                    </div>
                    {myTeam.srs_document && (
                      <a
                        href={myTeam.srs_document}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Download Current SRS
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => setSrsFile(e.target.files?.[0] || null)}
                      className="flex-1 text-xs text-neutral-600 dark:text-neutral-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-50 dark:file:bg-primary-950 file:text-primary-700 dark:file:text-primary-300 hover:file:bg-primary-100"
                    />
                    <Button
                      type="submit"
                      disabled={!srsFile || isUploadingSRS}
                      className="rounded-xl shadow-glow text-xs font-bold shrink-0"
                    >
                      {isUploadingSRS ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          Uploading SRS...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          Submit for Review
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                {/* Track 1 Timed Milestone Submissions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Documentation Milestone */}
                  <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary-600" />
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Documentation Milestone</h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        myTeam.documentation_submitted_at ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {myTeam.documentation_submitted_at ? 'Submitted' : 'Pending Submission'}
                      </span>
                    </div>
                    {myTeam.documentation_deadline && (
                      <p className="text-[11px] text-neutral-500">
                        Deadline: {new Date(myTeam.documentation_deadline).toLocaleString()}
                      </p>
                    )}
                    <form onSubmit={handleSubmitDocumentation} className="space-y-2">
                      <textarea
                        rows={2}
                        value={docContent}
                        onChange={(e) => setDocContent(e.target.value)}
                        placeholder="Enter documentation overview / link..."
                        className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={submittingDoc || !docContent.trim()}
                        className="w-full text-xs font-bold"
                      >
                        {submittingDoc ? 'Submitting...' : 'Submit Documentation'}
                      </Button>
                    </form>
                  </div>

                  {/* Implementation Milestone */}
                  <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Implementation Milestone</h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        myTeam.implementation_submitted_at ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {myTeam.implementation_submitted_at ? 'Submitted' : 'Pending Submission'}
                      </span>
                    </div>
                    {myTeam.implementation_deadline && (
                      <p className="text-[11px] text-neutral-500">
                        Deadline: {new Date(myTeam.implementation_deadline).toLocaleString()}
                      </p>
                    )}
                    <form onSubmit={handleSubmitImplementation} className="space-y-2">
                      <input
                        type="url"
                        value={implRepoUrl}
                        onChange={(e) => setImplRepoUrl(e.target.value)}
                        placeholder="https://github.com/org/repo..."
                        className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={submittingImpl || !implRepoUrl.trim()}
                        className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {submittingImpl ? 'Submitting...' : 'Submit Implementation'}
                      </Button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Squad Teammates Roster */}
              <div className="card-gradient p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-600" />
                    <div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">Squad Teammates</h3>
                      <p className="text-xs text-neutral-500">Tech-stack balanced team formulated by UIL Officer</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('channel')}
                    className="text-xs rounded-xl"
                  >
                    <MessagesSquare className="w-3.5 h-3.5 mr-1.5" />
                    Open Team Channel
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {myTeam.members?.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-secondary-600 text-white font-black text-xs flex items-center justify-center">
                          {member.student?.user?.first_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-neutral-900 dark:text-white">
                            {member.student?.user?.first_name} {member.student?.user?.last_name}
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            {member.student?.department || 'Engineering'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[11px]">
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          {member.assigned_role || 'Developer'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
                          {member.primary_stack || 'FullStack'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CAMPUS LOGISTICS PASS */}
      {activeTab === 'logistics' && (
        <div className="space-y-6 animate-fade-in">
          {!campusPass ? (
            <div className="card-gradient p-8 rounded-3xl text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Campus Logistics Clearance Pass</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                Track 1 students staying on campus receive digital clearance signed by the Dean, an active meal card from the Student Union, and dormitory room assignment from Housing Admin.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Digital Pass Header */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-glow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                        Track 1 Official Pass
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 text-[10px] font-bold">
                        {campusPass.cohort_academic_year || 'Academic Year 2026/27'}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black mt-2">Campus Resident Clearance Pass</h2>
                    <p className="text-xs text-emerald-100/90 mt-0.5">
                      Student: {campusPass.student_name} • ID: {campusPass.student_id_number}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-200">Pass Status</div>
                    <div className="text-xl font-black mt-0.5">
                      {campusPass.meal_card_active && campusPass.dean_approved ? 'VERIFIED ACTIVE' : 'PENDING APPROVAL'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Three Logistics Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Dean Clearance */}
                <div className="card-gradient p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-primary-500/10 text-primary-600 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        campusPass.dean_approved
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {campusPass.dean_approved ? 'Dean Approved' : 'Pending Dean'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Academic Dean Signature</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {campusPass.dean_signed_by_name ? `Signed by ${campusPass.dean_signed_by_name}` : 'Awaiting digital sign-off'}
                    </p>
                  </div>

                  {campusPass.dean_signature_hash ? (
                    <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase">
                        <span>HMAC-SHA256 Hash</span>
                        <button
                          onClick={() => handleCopyHash(campusPass.dean_signature_hash)}
                          className="hover:text-primary-500 flex items-center gap-1"
                        >
                          {copiedHash ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          {copiedHash ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="font-mono text-[10px] text-neutral-600 dark:text-neutral-300 break-all select-all">
                        {campusPass.dean_signature_hash}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* 2. Meal Card */}
                <div className="card-gradient p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        campusPass.meal_card_active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {campusPass.meal_card_active ? 'Card Active' : 'Not Activated'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Student Union Dining</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {campusPass.meal_card_number ? `Card #${campusPass.meal_card_number}` : 'Awaiting card allocation'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs space-y-1">
                    <div className="flex justify-between text-neutral-500 text-[11px]">
                      <span>Dining Hall Access:</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">
                        {campusPass.meal_card_active ? 'Unlimited Breakfast & Lunch' : 'Pending Activation'}
                      </span>
                    </div>
                    {campusPass.meal_card_issued_by_name && (
                      <div className="flex justify-between text-neutral-400 text-[10px]">
                        <span>Issued by:</span>
                        <span>{campusPass.meal_card_issued_by_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Dorm Room */}
                <div className="card-gradient p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        campusPass.key_issued
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      {campusPass.key_issued ? 'Key Issued' : 'Key Pending'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Campus Dormitory</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {campusPass.dorm_block
                        ? `Block ${campusPass.dorm_block} • Room ${campusPass.dorm_room} (Bed #${campusPass.dorm_bed_number})`
                        : 'Room assignment pending'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs space-y-1">
                    <div className="flex justify-between text-neutral-500 text-[11px]">
                      <span>Dorm Status:</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">
                        {campusPass.dorm_status || 'ASSIGNED'}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400 text-[10px]">
                      <span>Key Return Clearance:</span>
                      <span className={campusPass.cleared_at_exit ? 'text-emerald-500 font-bold' : 'text-neutral-400'}>
                        {campusPass.cleared_at_exit ? 'Cleared' : 'Active Residency'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ADVISOR & SQUAD COMMUNICATION CHANNEL */}
      {activeTab === 'channel' && (
        <div className="space-y-4 animate-fade-in">
          <TeamCommunicationHub
            teamId={myTeam?.id}
            teamName={myTeam?.team_name}
            projectTitle={myTeam?.project_title}
            advisorName={myTeam?.assigned_advisor ? `${myTeam.assigned_advisor.first_name} ${myTeam.assigned_advisor.last_name}` : undefined}
          />
        </div>
      )}

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

      {/* MODAL 1: STUDENT BASE64 QR VIEWER */}
      {studentQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-sm w-full p-6 space-y-4 border border-neutral-200 dark:border-neutral-800 shadow-xl text-center">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{studentQrModal.title}</h3>
              <button onClick={() => setStudentQrModal(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-white rounded-xl border border-neutral-200 inline-block mx-auto shadow-sm">
              <img
                src={studentQrModal.qrBase64}
                alt="Verification QR"
                className="w-48 h-48 object-contain mx-auto"
              />
            </div>
            <p className="text-xs text-neutral-500">
              Scannable cryptographic clearance token for campus dorms, dining, and UIL verification.
            </p>
            <Button size="sm" onClick={() => setStudentQrModal(null)} className="w-full text-xs">
              Done
            </Button>
          </div>
        </div>
      )}

      {/* MODAL 2: DIRECT COMPANY CHAT */}
      {companyChatInviteId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-neutral-200 dark:border-neutral-800 shadow-xl h-[550px] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <MessagesSquare className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Direct Employer Communication
                  </h3>
                  <p className="text-[10px] text-neutral-400">Track 1 Direct Interview Thread</p>
                </div>
              </div>
              <button onClick={() => setCompanyChatInviteId(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 p-2 bg-neutral-50 dark:bg-neutral-950/40 rounded-2xl">
              {companyChatMessages.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  Invitation accepted. You are connected directly with the company hiring team.
                </div>
              ) : (
                companyChatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl text-xs max-w-[80%] ${
                      msg.sender_role === 'student'
                        ? 'ml-auto bg-primary-600 text-white'
                        : 'mr-auto bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <span className="text-[9px] opacity-75 block text-right mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendCompanyChat} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={companyChatText}
                onChange={(e) => setCompanyChatText(e.target.value)}
                placeholder="Type response to company..."
                className="flex-1 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
              />
              <Button type="submit" size="sm" disabled={isSendingCompanyChat || !companyChatText.trim()} className="bg-primary-600 text-white font-bold">
                <Send className="w-3.5 h-3.5 mr-1" /> Send
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
