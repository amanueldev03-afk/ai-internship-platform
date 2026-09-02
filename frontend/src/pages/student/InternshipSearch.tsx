import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { searchInternships } from '@/services/internshipApi'
import type { InternshipFilters } from '@/types/filters'
import type { Internship } from '@/types'
import SearchFilterBar from '@/components/search/SearchFilterBar'
import RecommendationCard from '@/components/recommendations/RecommendationCard'
import RecommendationSkeleton from '@/components/recommendations/RecommendationSkeleton'
import RecommendationEmptyState from '@/components/recommendations/RecommendationEmptyState'
import RecommendationErrorState from '@/components/recommendations/RecommendationErrorState'

export default function InternshipSearch() {
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAppSelector((state) => state.auth)
  
  const [filters, setFilters] = useState<InternshipFilters>({})
  const [internships, setInternships] = useState<Internship[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') {
      navigate('/login')
      return
    }
  }, [isAuthenticated, role, navigate])

  const loadInternships = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await searchInternships(filters)
      setInternships(response.results)
      setTotalCount(response.count)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load internships')
      console.error('Failed to load internships:', err)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (isAuthenticated && role === 'student') {
      loadInternships()
    }
  }, [loadInternships, isAuthenticated, role])

  const handleApply = async (internshipId: number) => {
    // Apply functionality - can be integrated with recommendationApi
    console.log('Apply to internship:', internshipId)
  }

  const handleSave = async (internshipId: number) => {
    // Save functionality - can be integrated with recommendationApi
    console.log('Save internship:', internshipId)
  }

  const handleUnsave = async (internshipId: number) => {
    // Unsave functionality - can be integrated with recommendationApi
    console.log('Unsave internship:', internshipId)
  }

  // Convert Internship to Recommendation format for card component
  const internshipToRecommendation = (internship: Internship) => ({
    id: internship.id,
    match_score: 0, // No match score for search results
    internship,
    explanation: null,
    score_breakdown: null,
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div>
            <Link
              to="/profile"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Profile
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Search Internships</h1>
            <p className="text-gray-600 mt-1">
              {totalCount === 0 && !isLoading
                ? 'No internships found'
                : `${totalCount} internship${totalCount !== 1 ? 's' : ''} found`}
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <SearchFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          isLoading={isLoading}
        />

        {/* Results */}
        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <RecommendationSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <RecommendationErrorState
              error={error}
              onRetry={loadInternships}
            />
          ) : internships.length === 0 ? (
            <RecommendationEmptyState
              message="No internships match your search criteria. Try adjusting your filters."
              onRefresh={loadInternships}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {internships.map((internship) => (
                <RecommendationCard
                  key={internship.id}
                  recommendation={internshipToRecommendation(internship)}
                  isSaved={false}
                  isApplied={false}
                  onApply={handleApply}
                  onSave={handleSave}
                  onUnsave={handleUnsave}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
