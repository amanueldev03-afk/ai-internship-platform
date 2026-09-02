import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { getRecommendations } from '@/services/recommendationApi'
import { getSavedInternships } from '@/services/internshipApi'
import type { Recommendation } from '@/types'
import RecommendationCard from '@/components/recommendations/RecommendationCard'
import RecommendationSkeleton from '@/components/recommendations/RecommendationSkeleton'
import RecommendationEmptyState from '@/components/recommendations/RecommendationEmptyState'
import RecommendationErrorState from '@/components/recommendations/RecommendationErrorState'

export default function StudentRecommendations() {
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAppSelector((state) => state.auth)
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savedInternships, setSavedInternships] = useState<Set<number>>(new Set())
  const [appliedInternships, setAppliedInternships] = useState<Set<number>>(new Set())
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
  })

  const loadRecommendations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [response, savedData] = await Promise.all([
        getRecommendations(),
        getSavedInternships().catch(() => []),
      ])
      
      setRecommendations(response.results)
      if (Array.isArray(savedData)) {
        setSavedInternships(new Set(savedData.map((s) => s.internship)))
      }
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
      })
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load recommendations')
      console.error('Failed to load recommendations:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') {
      navigate('/login')
      return
    }
    loadRecommendations()
  }, [isAuthenticated, role, navigate, loadRecommendations])

  const handleApply = useCallback((internshipId: number) => {
    setAppliedInternships((prev) => new Set([...prev, internshipId]))
  }, [])

  const handleSave = useCallback((internshipId: number) => {
    setSavedInternships((prev) => new Set([...prev, internshipId]))
  }, [])

  const handleUnsave = useCallback((internshipId: number) => {
    setSavedInternships((prev) => {
      const newSet = new Set(prev)
      newSet.delete(internshipId)
      return newSet
    })
  }, [])

  // Sort recommendations by descending match score (backend already does this, but ensure frontend maintains order)
  const sortedRecommendations = useMemo(() => {
    return [...recommendations].sort((a, b) => b.match_score - a.match_score)
  }, [recommendations])

  if (!isAuthenticated || role !== 'student') {
    return null // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Recommendations</h1>
            <p className="text-gray-600 mt-2">AI-powered internship matches based on your profile</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RecommendationSkeleton />
            <RecommendationSkeleton />
            <RecommendationSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Recommendations</h1>
            <p className="text-gray-600 mt-2">AI-powered internship matches based on your profile</p>
          </div>
          <RecommendationErrorState error={error} onRetry={loadRecommendations} />
        </div>
      </div>
    )
  }

  if (sortedRecommendations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Recommendations</h1>
            <p className="text-gray-600 mt-2">AI-powered internship matches based on your profile</p>
          </div>
          <RecommendationEmptyState onRefresh={loadRecommendations} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">AI Matches</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Your AI Recommendations</h1>
            <p className="text-gray-600 mt-2">
              Personalized matches ranked by skill and profile fit • {pagination.count} recommendation{pagination.count !== 1 ? 's' : ''} available
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/internships"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
            >
              Browse All Listings
            </Link>
            <Link
              to="/saved"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              Saved ({savedInternships.size})
            </Link>
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.internship.id}
              recommendation={recommendation}
              isSaved={savedInternships.has(recommendation.internship.id)}
              isApplied={appliedInternships.has(recommendation.internship.id)}
              onApply={handleApply}
              onSave={handleSave}
              onUnsave={handleUnsave}
            />
          ))}
        </div>

        {/* Pagination */}
        {(pagination.next || pagination.previous) && (
          <div className="mt-8 flex justify-center gap-4">
            {pagination.previous && (
              <button
                onClick={() => {
                  // Handle previous page - would need to parse URL and fetch
                  console.log('Previous page:', pagination.previous)
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Previous
              </button>
            )}
            {pagination.next && (
              <button
                onClick={() => {
                  // Handle next page - would need to parse URL and fetch
                  console.log('Next page:', pagination.next)
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
