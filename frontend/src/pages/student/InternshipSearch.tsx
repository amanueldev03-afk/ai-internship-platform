import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { searchInternships, getSavedInternships } from '@/services/internshipApi'
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
  const [savedInternships, setSavedInternships] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') {
      navigate('/login')
      return
    }
  }, [isAuthenticated, role, navigate])

  const loadSavedState = useCallback(async () => {
    try {
      const savedData = await getSavedInternships()
      if (Array.isArray(savedData)) {
        setSavedInternships(new Set(savedData.map((s) => s.internship)))
      }
    } catch {
      // Non-critical, ignore
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && role === 'student') {
      loadSavedState()
    }
  }, [isAuthenticated, role, loadSavedState])

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
    console.log('Applied to internship:', internshipId)
  }

  const handleSave = useCallback((internshipId: number) => {
    setSavedInternships((prev) => new Set([...prev, internshipId]))
  }, [])

  const handleUnsave = useCallback((internshipId: number) => {
    setSavedInternships((prev) => {
      const next = new Set(prev)
      next.delete(internshipId)
      return next
    })
  }, [])

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
        {/* Header with Navigation */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Browse Internships</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Browse & Search Internships</h1>
            <p className="text-gray-600 mt-1">
              {totalCount === 0 && !isLoading
                ? 'No internships found'
                : `${totalCount} active internship${totalCount !== 1 ? 's' : ''} available`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/recommendations"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              ✨ AI Matches
            </Link>
            <Link
              to="/saved"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ♥ Saved ({savedInternships.size})
            </Link>
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
                  isSaved={savedInternships.has(internship.id)}
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
