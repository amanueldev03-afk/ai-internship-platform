interface RecommendationEmptyStateProps {
  message?: string
  onRefresh?: () => void
  refreshText?: string
}

export default function RecommendationEmptyState({ 
  message, 
  onRefresh, 
  refreshText = 'Refresh Recommendations' 
}: RecommendationEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No recommendations available</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {message || "We couldn't find any internship recommendations for you yet. Complete your profile and upload your CV to get personalized recommendations."}
      </p>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {refreshText}
        </button>
      )}
    </div>
  )
}
