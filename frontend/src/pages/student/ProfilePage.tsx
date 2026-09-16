import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import * as authApi from '@/services/authApi'
import * as studentApi from '@/services/studentApi'
import type { StudentProfile } from '@/services/studentApi'
import type { User } from '@/types'
import {
  EDUCATION_LEVEL_LABELS,
  FIELD_OF_STUDY_LABELS,
  WORK_MODE_LABELS,
  INTERNSHIP_TYPE_LABELS,
  COMPENSATION_LABELS,
  labelFor,
} from '@/constants/profileChoices'
import PersonalEducationSection from './PersonalEducationSection'
import SkillsInterestsSection from './SkillsInterestsSection'
import PreferencesSection from './PreferencesSection'
import ResumeSection from './ResumeSection'
import StudentRecommendations from './StudentRecommendations'
import InternshipSearch from './InternshipSearch'
import { Camera, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TabId = 'overview' | 'personal' | 'skills' | 'preferences' | 'resume' | 'recommendations' | 'search'

const TABS: Array<{ id: TabId; label: string; category?: string }> = [
  { id: 'overview', label: 'Overview', category: 'basic' },
  { id: 'personal', label: 'Personal & Education', category: 'basic' },
  { id: 'skills', label: 'Skills & Interests', category: 'professional' },
  { id: 'preferences', label: 'Preferences', category: 'professional' },
  { id: 'resume', label: 'Resume & CV', category: 'professional' },
  { id: 'recommendations', label: 'AI Matches', category: 'internships' },
  { id: 'search', label: 'Search Internships', category: 'internships' },
]

const SECTION_LABELS: Record<string, string> = {
  personal: 'Personal',
  education: 'Education',
  skills: 'Skills',
  interests: 'Interests',
  preferences: 'Preferences',
  resume: 'Resume',
}

export default function ProfilePage() {
  const authUser = useAppSelector((state) => state.auth.user)
  const [user, setUser] = useState<User | null>(authUser)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null)

  const fetchProfileData = async () => {
    setError(null)
    const [userResult, profileResult] = await Promise.allSettled([
      authApi.getCurrentUser(),
      studentApi.getStudentProfile(),
    ])
    if (userResult.status === 'fulfilled') {
      setUser(userResult.value)
    }
    if (profileResult.status === 'fulfilled') {
      setProfile(profileResult.value)
    } else {
      setProfile(null)
      setError('Failed to load profile details. Please try again.')
    }
  }

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fullName = user?.first_name || user?.last_name
    ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
    : user?.username || 'Student'

  const completionPct = profile?.completion?.percent ?? null
  const sections = profile?.completion?.sections

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

  const handlePhotoUpload = async (file: File): Promise<void> => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setPhotoUploadError('Profile photo must be a JPEG, PNG, GIF, or WebP image.')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setPhotoUploadError('Profile photo must be less than 5MB.')
      return
    }

    setIsUploadingPhoto(true)
    setPhotoUploadError(null)

    try {
      const updatedUser = await authApi.updateUser({ profile_photo: file })
      setUser(updatedUser)
      await fetchProfileData()
    } catch (err: any) {
      console.error('Photo upload error:', err)
      setPhotoUploadError(err.response?.data?.detail || err.message || 'Failed to upload profile photo. Please try again.')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 animate-fade-in pb-16">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="card-gradient p-6 sm:p-8 rounded-3xl shadow-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              <Link to="/dashboard" className="text-primary-600 dark:text-primary-400 hover:underline">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-neutral-700 dark:text-neutral-300">Profile & Career Settings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
              Student <span className="gradient-text">Profile</span>
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              Manage your personal background, verified skill tags, CV extraction, and career preferences.
            </p>
          </div>

          <Button
            onClick={fetchProfileData}
            variant="secondary"
            size="sm"
            className="rounded-2xl text-xs font-bold shrink-0 self-start sm:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
        </div>

        {error && (
          <div className="rounded-2xl bg-error-50 dark:bg-error-950/40 p-4 border border-error-200 dark:border-error-800 animate-scale-in" role="alert">
            <p className="text-xs font-medium text-error-700 dark:text-error-300">{error}</p>
          </div>
        )}

        {/* Main Layout: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-72 flex-shrink-0 animate-slide-up">
            <div className="card-gradient p-6 rounded-3xl sticky top-24 space-y-6 shadow-card">
              {/* Profile Card Header in Sidebar */}
              <div className="flex flex-col items-center text-center pb-6 border-b border-neutral-200/80 dark:border-neutral-800">
                <div className="relative mb-3 group">
                  {getProfilePhotoUrl(user) ? (
                    <>
                      <img
                        src={getProfilePhotoUrl(user)}
                        alt="Profile"
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-white dark:border-neutral-700 shadow-glow transition-all duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <label htmlFor="photo-upload" className="cursor-pointer">
                          <Camera className="w-5 h-5 text-white" />
                        </label>
                      </div>
                    </>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center text-white text-2xl font-black shadow-glow group-hover:scale-105 transition-all cursor-pointer">
                      <label htmlFor="photo-upload" className="cursor-pointer flex items-center justify-center">
                        {isUploadingPhoto ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          fullName.charAt(0).toUpperCase()
                        )}
                      </label>
                    </div>
                  )}
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handlePhotoUpload(file)
                    }}
                    disabled={isUploadingPhoto}
                  />
                </div>
                {photoUploadError && (
                  <p className="text-[11px] font-bold text-error-600 mb-2">{photoUploadError}</p>
                )}
                <h2 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">{fullName}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mt-1">
                  {user?.role || 'student'}
                </span>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate max-w-[200px]">{user?.email}</p>
                {profile?.city && profile?.country && (
                  <span className="text-[11px] font-semibold text-neutral-500 mt-1.5 block">
                    📍 {profile.city}, {profile.country}
                  </span>
                )}
              </div>

              {/* Profile Completion Meter */}
              <div className="pb-6 border-b border-neutral-200/80 dark:border-neutral-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-neutral-500 uppercase tracking-wider">Profile Strength</span>
                  <span className="font-extrabold gradient-text">
                    {completionPct === null ? '—' : `${completionPct}%`}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${completionPct === null ? 0 : Math.min(100, Math.max(0, completionPct))}%` }}
                  />
                </div>
                {sections && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.entries(sections).map(([key, complete]) => (
                      <span
                        key={key}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                          complete 
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {SECTION_LABELS[key] ?? key}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Side Navigation Tabs */}
              <nav className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Core Profile</h4>
                  <div className="space-y-1">
                    {TABS.filter(tab => tab.category === 'basic').map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-glow'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Career & Skills</h4>
                  <div className="space-y-1">
                    {TABS.filter(tab => tab.category === 'professional').map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-glow'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Opportunities</h4>
                  <div className="space-y-1">
                    {TABS.filter(tab => tab.category === 'internships').map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-glow'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 animate-slide-up">
            <div className="card-gradient p-6 sm:p-8 rounded-3xl shadow-card">
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-6 rounded-2xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 space-y-4">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white border-b border-neutral-200/80 dark:border-neutral-800 pb-3">
                      Personal Information
                    </h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                        <dt className="font-bold text-neutral-400 uppercase mb-1">Username</dt>
                        <dd className="font-bold text-neutral-900 dark:text-white">{user?.username || '—'}</dd>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                        <dt className="font-bold text-neutral-400 uppercase mb-1">Email</dt>
                        <dd className="font-bold text-neutral-900 dark:text-white">{user?.email}</dd>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                        <dt className="font-bold text-neutral-400 uppercase mb-1">Phone</dt>
                        <dd className="font-bold text-neutral-900 dark:text-white">{profile?.phone || 'Not provided'}</dd>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                        <dt className="font-bold text-neutral-400 uppercase mb-1">Bio</dt>
                        <dd className="font-medium text-neutral-700 dark:text-neutral-300">{profile?.bio || 'No bio provided yet.'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 space-y-4">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white border-b border-neutral-200/80 dark:border-neutral-800 pb-3">
                      Academic & Career Snapshot
                    </h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                        <dt className="font-bold text-neutral-400 uppercase mb-1">University</dt>
                        <dd className="font-bold text-neutral-900 dark:text-white">
                          {profile?.university || labelFor(EDUCATION_LEVEL_LABELS, profile?.education_level) || 'Not specified'}
                        </dd>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                        <dt className="font-bold text-neutral-400 uppercase mb-1">Field of Study</dt>
                        <dd className="font-bold text-neutral-900 dark:text-white">
                          {labelFor(FIELD_OF_STUDY_LABELS, profile?.field_of_study) || 'Not specified'}
                        </dd>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                        <dt className="font-bold text-neutral-400 uppercase mb-1">Education Level</dt>
                        <dd className="font-bold text-neutral-900 dark:text-white">
                          {labelFor(EDUCATION_LEVEL_LABELS, profile?.education_level) || 'Not specified'}
                        </dd>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                        <dt className="font-bold text-neutral-400 uppercase mb-1">Work Mode</dt>
                        <dd className="font-bold text-neutral-900 dark:text-white">
                          {labelFor(WORK_MODE_LABELS, profile?.work_type) || 'Not specified'}
                        </dd>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                        <dt className="font-bold text-neutral-400 uppercase mb-1">Internship Type</dt>
                        <dd className="font-bold text-neutral-900 dark:text-white">
                          {labelFor(INTERNSHIP_TYPE_LABELS, profile?.internship_type) || 'Not specified'}
                        </dd>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                        <dt className="font-bold text-neutral-400 uppercase mb-1">Compensation</dt>
                        <dd className="font-bold text-neutral-900 dark:text-white">
                          {labelFor(COMPENSATION_LABELS, profile?.compensation_preference) || 'Not specified'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {/* Tab 2: Personal & Education */}
              {activeTab === 'personal' && <PersonalEducationSection onSaved={fetchProfileData} />}

              {/* Tab 3: Skills & Interests */}
              {activeTab === 'skills' && <SkillsInterestsSection onSaved={fetchProfileData} />}

              {/* Tab 4: Preferences */}
              {activeTab === 'preferences' && <PreferencesSection onSaved={fetchProfileData} />}

              {/* Tab 5: Resume & CV */}
              {activeTab === 'resume' && (
                <ResumeSection profile={profile} onSaved={fetchProfileData} />
              )}

              {/* Tab 6: Recommendations */}
              {activeTab === 'recommendations' && <StudentRecommendations />}

              {/* Tab 7: Search Internships */}
              {activeTab === 'search' && <InternshipSearch />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}