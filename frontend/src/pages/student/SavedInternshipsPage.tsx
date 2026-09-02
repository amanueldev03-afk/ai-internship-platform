import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { getSavedInternships } from '@/services/internshipApi'
import type { SavedInternship, Recommendation } from '@/types'
import RecommendationCard from '@/components/recommendations/RecommendationCard'
import RecommendationSkeleton from '@/components/recommendations/RecommendationSkeleton'
import RecommendationErrorState from '@/components/recommendations/RecommendationErrorState'

export default function SavedInternshipsPage() {
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAppSelector((state) => state.auth)

  const [savedList, setSavedList] = useState<SavedInternship[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadSavedInternships = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getSavedInternships()
      setSavedList(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load saved internships')
      console.error('Failed to load saved internships:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') {
      navigate('/login')
      return
    }
    loadSavedInternships()
  }, [isAuthenticated, role, navigate, loadSavedInternships])

  const handleUnsave = (internshipId: number) => {
    // Immediately remove unsaved internship from the list
    setSavedList((prev) => prev.filter((item) => item.internship !== internshipId))
  }

  // Convert SavedInternship item to Recommendation format for unified card rendering
  const savedItemToRecommendation = (item: SavedInternship): Recommendation => {
    if (item.internship_details) {
      return {
        internship: item.internship_details,
        match_score: 0,
        explanation: [],
      }
    }

    return {
      internship: {
        id: item.internship,
        title: item.internship_title,
        organization_name: item.organization_name,
        description: '',
        internship_type: 'remote',
        work_type: 'full_time',
        required_skills: [],
        application_url: item.application_url,
        source_url: item.source_url,
        is_verified: true,
        is_expired: false,
        status: 'active',
        created_at: item.created_at,
        updated_at: item.created_at,
      },
      match_score: 0,
      explanation: [],
    }
  }

  if (!isAuthenticated || role !== 'student') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Saved Internships</h1>
            <p className="text-gray-600 mt-2">
              Internships you have bookmarked for later review • {savedList.length} saved
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/recommendations"
              className="inline-flex items-center px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
            >
              View Recommendations
            </Link>
            <Link
              to="/internships"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
            >
              Browse All
            </Link>
          </div>
        </div>

        {actionError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between text-red-700 text-sm">
            <span>{actionError}</span>
            <button
              onClick={() => setActionError(null)}
              className="text-red-500 hover:text-red-700 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RecommendationSkeleton />
            <RecommendationSkeleton />
            <RecommendationSkeleton />
          </div>
        ) : error ? (
          <RecommendationErrorState error={error} onRetry={loadSavedInternships} />
        ) : savedList.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Internships</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              You haven't saved any internships yet. Explore AI-recommended positions or browse listings to bookmark opportunities.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/recommendations"
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Explore Recommendations
              </Link>
              <Link
                to="/search"
                className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Search Listings
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedList.map((item) => (
              <RecommendationCard
                key={item.internship}
                recommendation={savedItemToRecommendation(item)}
                isSaved={true}
                onUnsave={handleUnsave}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
