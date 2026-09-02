import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import * as authApi from '@/services/authApi'
import * as studentApi from '@/services/studentApi'
import type { StudentProfile } from '@/services/studentApi'
import type { User } from '@/types'
import {
  COMPENSATION_LABELS,
  EDUCATION_LEVEL_LABELS,
  FIELD_OF_STUDY_LABELS,
  INTERNSHIP_TYPE_LABELS,
  WORK_MODE_LABELS,
  labelFor,
} from '@/constants/profileChoices'
import PersonalEducationSection from './PersonalEducationSection'
import SkillsInterestsSection from './SkillsInterestsSection'
import PreferencesSection from './PreferencesSection'
import ResumeSection from './ResumeSection'
import ExtractedCVContent from './components/ExtractedCVContent'
import StudentRecommendations from './StudentRecommendations'
import InternshipSearch from './InternshipSearch'

type TabId = 'overview' | 'personal' | 'skills' | 'preferences' | 'resume' | 'recommendations' | 'search'

const TABS: Array<{ id: TabId; label: string; category?: string }> = [
  { id: 'overview', label: 'Overview', category: 'basic' },
  { id: 'personal', label: 'Personal & Education', category: 'basic' },
  { id: 'skills', label: 'Skills & Interests', category: 'professional' },
  { id: 'preferences', label: 'Preferences', category: 'professional' },
  { id: 'resume', label: 'Resume & CV', category: 'professional' },
  { id: 'recommendations', label: 'Recommendations', category: 'internships' },
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  const fetchProfileData = async () => {
    setIsLoading(true)
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
    setIsLoading(false)
  }

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fullName = useMemo(
    () =>
      user?.first_name || user?.last_name
        ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
        : user?.username || 'Student User',
    [user]
  )

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

  const completionPct = profile?.completion?.percent ?? null
  const sections = profile?.completion?.sections

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-sm font-medium text-gray-600">Loading your profile data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation / Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link
              to="/dashboard"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center gap-1 mb-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
          </div>
          <button
            onClick={fetchProfileData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 mb-6" role="alert">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Main Layout: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-4">
              {/* Profile Card Header in Sidebar */}
              <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-gray-200">
                <div className="relative mb-3">
                  {getProfilePhotoUrl(user) ? (
                    <img
                      src={getProfilePhotoUrl(user)}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      {fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h2 className="text-lg font-bold text-gray-900">{fullName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 uppercase tracking-wide mt-1">
                  {user?.role || 'student'}
                </span>
                <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                {profile?.city && profile?.country && (
                  <span className="text-xs text-gray-500 mt-1 block">
                    📍 {profile.city}, {profile.country}
                  </span>
                )}
              </div>

              {/* Profile Completion */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-gray-700">Profile Completion</span>
                  <span className="text-xs font-bold text-indigo-600">
                    {completionPct === null ? '—' : `${completionPct}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionPct === null ? 0 : Math.min(100, Math.max(0, completionPct))}%` }}
                  ></div>
                </div>
                {sections && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(sections).map(([key, complete]) => (
                      <span
                        key={key}
                        title={SECTION_LABELS[key] ?? key}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          complete ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {SECTION_LABELS[key] ?? key}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Side Navigation */}
              <nav className="space-y-4">
                {/* Basic Info Section */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Basic Information</h4>
                  <div className="space-y-1">
                    {TABS.filter(tab => tab.category === 'basic').map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Professional Profile Section */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Professional Profile</h4>
                  <div className="space-y-1">
                    {TABS.filter(tab => tab.category === 'professional').map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Internships Section */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Internships</h4>
                  <div className="space-y-1">
                    {TABS.filter(tab => tab.category === 'internships').map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
          <div className="flex-1 min-w-0">
            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Account Information</h3>
                  <dl className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Username</dt>
                      <dd className="font-medium text-gray-900">{user?.username || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Email Address</dt>
                      <dd className="font-medium text-gray-900">{user?.email}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Phone</dt>
                      <dd className="font-medium text-gray-900">{profile?.phone || 'Not provided'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Bio</dt>
                      <dd className="text-gray-700">{profile?.bio || 'No bio provided yet.'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                  <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Academic & Career Snapshot</h3>
                  <dl className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <dt className="text-gray-500">University</dt>
                      <dd className="font-medium text-gray-900">
                        {profile?.university || labelFor(EDUCATION_LEVEL_LABELS, profile?.education_level) || 'Not specified'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Field of Study</dt>
                      <dd className="font-medium text-gray-900">
                        {labelFor(FIELD_OF_STUDY_LABELS, profile?.field_of_study) || 'Not specified'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Education Level</dt>
                      <dd className="font-medium text-gray-900">
                        {labelFor(EDUCATION_LEVEL_LABELS, profile?.education_level) || 'Not specified'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Preferred Work Mode</dt>
                      <dd className="font-medium text-gray-900">
                        {labelFor(WORK_MODE_LABELS, profile?.work_type) || 'Not specified'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Target Internship Type</dt>
                      <dd className="font-medium text-gray-900">
                        {labelFor(INTERNSHIP_TYPE_LABELS, profile?.internship_type) || 'Not specified'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Compensation</dt>
                      <dd className="font-medium text-gray-900">
                        {labelFor(COMPENSATION_LABELS, profile?.compensation_preference) || 'Not specified'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {profile?.cv_data?.has_cv && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 border-b pb-2 mb-4">
                    Parsed CV Summary
                  </h3>
                  <ExtractedCVContent cvData={profile.cv_data} />
                </div>
              )}
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
  )
}