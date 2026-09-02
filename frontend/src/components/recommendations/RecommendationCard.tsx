import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Recommendation } from '@/types'
import { saveInternship, unsaveInternship } from '@/services/internshipApi'
import { applyToInternship } from '@/services/recommendationApi'

interface RecommendationCardProps {
  recommendation: Recommendation
  isSaved?: boolean
  isApplied?: boolean
  onApply?: (internshipId: number) => void
  onSave?: (internshipId: number) => void
  onUnsave?: (internshipId: number) => void
}

export default function RecommendationCard({
  recommendation,
  isSaved = false,
  isApplied = false,
  onApply,
  onSave,
  onUnsave,
}: RecommendationCardProps) {
  const { internship, match_score, explanation } = recommendation
  const [isSaving, setIsSaving] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [localSaved, setLocalSaved] = useState(isSaved)
  const [localApplied, setLocalApplied] = useState(isApplied)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLocalSaved(isSaved)
  }, [isSaved])

  useEffect(() => {
    setLocalApplied(isApplied)
  }, [isApplied])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    setError(null)

    try {
      if (localSaved) {
        await unsaveInternship(internship.id)
        setLocalSaved(false)
        onUnsave?.(internship.id)
      } else {
        await saveInternship(internship.id)
        setLocalSaved(true)
        onSave?.(internship.id)
      }
    } catch (err: any) {
      setError(localSaved ? 'Failed to unsave internship' : 'Failed to save internship')
      console.error('Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleApply = async () => {
    if (isApplying || localApplied) return
    setIsApplying(true)
    setError(null)

    try {
      if (internship.application_url) {
        window.open(internship.application_url, '_blank', 'noopener,noreferrer')
      }
      await applyToInternship(internship.id)
      setLocalApplied(true)
      onApply?.(internship.id)
    } catch (err: any) {
      setError('Failed to apply to internship')
      console.error('Apply error:', err)
    } finally {
      setIsApplying(false)
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  const location = internship.city && internship.country
    ? `${internship.city}, ${internship.country}`
    : internship.city || internship.country || internship.location_text || 'Location not specified'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      {/* Header: Company, Title, Match Score */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link
            to={`/internships/${internship.id}`}
            className="block hover:text-indigo-600 transition-colors"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-1">{internship.title}</h3>
          </Link>
          <p className="text-gray-600 text-sm">{internship.organization_name}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getMatchScoreColor(match_score)}`}>
          AI Match: {Math.round(match_score)}%
        </div>
      </div>

      {/* Location, Work Mode, Deadline */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-600">
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Deadline: {formatDate(internship.application_deadline)}
        </span>
      </div>

      {/* Required Skills */}
      {internship.required_skills && internship.required_skills.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Required Skills</p>
          <div className="flex flex-wrap gap-2">
            {internship.required_skills.slice(0, 6).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md"
              >
                {skill}
              </span>
            ))}
            {internship.required_skills.length > 6 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                +{internship.required_skills.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Short Description */}
      <p className="text-gray-700 text-sm mb-4 line-clamp-3">
        {internship.description}
      </p>

      {/* AI Explanation */}
      {explanation && explanation.length > 0 && (
        <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
          <p className="text-xs font-medium text-indigo-900 uppercase tracking-wide mb-1">Why this matches you</p>
          <p className="text-sm text-indigo-800">
            {explanation.join(' ')}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={handleApply}
          disabled={isApplying || localApplied}
          className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            localApplied
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isApplying ? 'Applying...' : localApplied ? 'Applied' : 'Apply'}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            localSaved
              ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={localSaved ? 'Unsave' : 'Save'}
        >
          {isSaving ? '...' : localSaved ? '♥ Saved' : '♡ Save'}
        </button>
      </div>
    </div>
  )
}
