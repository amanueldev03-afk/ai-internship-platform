import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { getInternshipDetail } from '@/services/internshipApi'
import { saveInternship, unsaveInternship } from '@/services/recommendationApi'
import type { Internship } from '@/types'

export default function InternshipDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAppSelector((state) => state.auth)
  
  const [internship, setInternship] = useState<Internship | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') {
      navigate('/login')
      return
    }

    const fetchInternship = async () => {
      setIsLoading(true)
      setError(null)
      setSaveError(null)

      try {
        const data = await getInternshipDetail(Number(id))
        setInternship(data)
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Internship not found')
        } else {
          setError(err.response?.data?.detail || err.message || 'Failed to load internship details')
        }
        console.error('Failed to load internship:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchInternship()
    }
  }, [id, isAuthenticated, role, navigate])

  const handleSave = async () => {
    if (!internship || isSaving) return
    
    setIsSaving(true)
    setSaveError(null)

    try {
      if (isSaved) {
        await unsaveInternship(internship.id)
        setIsSaved(false)
      } else {
        await saveInternship(internship.id)
        setIsSaved(true)
      }
    } catch (err: any) {
      setSaveError(isSaved ? 'Failed to unsave internship' : 'Failed to save internship')
      console.error('Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleApply = () => {
    if (!internship?.application_url) return
    
    // Open external application URL in new tab with security attributes
    window.open(internship.application_url, '_blank', 'noopener,noreferrer')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline specified'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const location = internship?.city && internship?.country
    ? `${internship.city}, ${internship.country}`
    : internship?.city || internship?.country || internship?.location_text || 'Location not specified'

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              to="/recommendations"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Recommendations
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              to="/recommendations"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Recommendations
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error === 'Internship not found' ? 'Internship Not Found' : 'Error Loading Internship'}
            </h2>
            <p className="text-gray-600 mb-6">
              {error === 'Internship not found'
                ? 'The internship may have been removed or is no longer available.'
                : 'An error occurred while loading the internship details. Please try again.'}
            </p>
            <Link
              to="/recommendations"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Recommendations
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Internship not loaded
  if (!internship) {
    return null
  }

  const hasApplicationUrl = internship.application_url && internship.application_url.trim() !== ''

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            to="/recommendations"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Recommendations
          </Link>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {internship.title}
                </h1>
                <p className="text-lg text-gray-600">{internship.organization_name}</p>
              </div>
              
              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isSaved
                    ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={isSaved ? 'Unsave' : 'Save'}
              >
                {isSaving ? '...' : isSaved ? '♥ Saved' : '♡ Save'}
              </button>
            </div>

            {/* Meta Information */}
            <div className="flex flex-wrap gap-4 mt-6 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {location}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {internship.internship_type.charAt(0).toUpperCase() + internship.internship_type.slice(1)}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Deadline: {formatDate(internship.application_deadline)}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
              {internship.description}
            </div>
          </div>

          {/* Required Skills */}
          {internship.required_skills && internship.required_skills.length > 0 && (
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {internship.required_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Save Error */}
          {saveError && (
            <div className="p-4 bg-red-50 text-red-700 text-sm">
              {saveError}
            </div>
          )}

          {/* Actions */}
          <div className="p-6 sm:p-8 bg-gray-50">
            {hasApplicationUrl ? (
              <button
                onClick={handleApply}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Apply Now
                <span className="sr-only"> — Opens employer website in a new tab</span>
              </button>
            ) : (
              <div className="text-gray-500 text-sm">
                Application URL not available. Please check back later or contact the employer directly.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
