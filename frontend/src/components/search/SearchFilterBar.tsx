import { useState, useEffect } from 'react'
import type { InternshipFilters } from '@/types/filters'
import {
  INTERNSHIP_TYPE_CHOICES,
  WORK_MODE_CHOICES,
  WORK_TYPE_CHOICES,
  COMPENSATION_TYPE_CHOICES,
} from '@/types/filters'

interface SearchFilterBarProps {
  filters: InternshipFilters
  onFiltersChange: (filters: InternshipFilters) => void
  isLoading?: boolean
}

export default function SearchFilterBar({ filters, onFiltersChange, isLoading }: SearchFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search || '')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Update filters when debounced search changes
  useEffect(() => {
    onFiltersChange({ ...filters, search: debouncedSearch || undefined })
  }, [debouncedSearch])

  const handleFilterChange = (key: keyof InternshipFilters, value: string | number | undefined) => {
    onFiltersChange({ ...filters, [key]: value || undefined })
  }

  const clearFilter = (key: keyof InternshipFilters) => {
    onFiltersChange({ ...filters, [key]: undefined })
  }

  const clearAllFilters = () => {
    setSearchInput('')
    onFiltersChange({})
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      {/* Search Input */}
      <div className="mb-4">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <input
          id="search"
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by title, company, description..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          disabled={isLoading}
        />
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Internship Type */}
        <div>
          <label htmlFor="internship_type" className="block text-sm font-medium text-gray-700 mb-2">
            Internship Type
          </label>
          <select
            id="internship_type"
            value={filters.internship_type || ''}
            onChange={(e) => handleFilterChange('internship_type', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          >
            <option value="">All Types</option>
            {INTERNSHIP_TYPE_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>

        {/* Work Mode */}
        <div>
          <label htmlFor="work_mode" className="block text-sm font-medium text-gray-700 mb-2">
            Work Mode
          </label>
          <select
            id="work_mode"
            value={filters.work_mode || ''}
            onChange={(e) => handleFilterChange('work_mode', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          >
            <option value="">All Modes</option>
            {WORK_MODE_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>

        {/* Work Type */}
        <div>
          <label htmlFor="work_type" className="block text-sm font-medium text-gray-700 mb-2">
            Work Type
          </label>
          <select
            id="work_type"
            value={filters.work_type || ''}
            onChange={(e) => handleFilterChange('work_type', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          >
            <option value="">All Types</option>
            {WORK_TYPE_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>

        {/* Compensation Type */}
        <div>
          <label htmlFor="compensation_type" className="block text-sm font-medium text-gray-700 mb-2">
            Compensation
          </label>
          <select
            id="compensation_type"
            value={filters.compensation_type || ''}
            onChange={(e) => handleFilterChange('compensation_type', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          >
            <option value="">All</option>
            {COMPENSATION_TYPE_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Additional Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            id="location"
            type="text"
            value={filters.location || ''}
            onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
            placeholder="City, country..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          />
        </div>

        {/* Skill */}
        <div>
          <label htmlFor="skill" className="block text-sm font-medium text-gray-700 mb-2">
            Skill
          </label>
          <input
            id="skill"
            type="text"
            value={filters.skill || ''}
            onChange={(e) => handleFilterChange('skill', e.target.value || undefined)}
            placeholder="e.g., Python, React..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <input
            id="category"
            type="text"
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
            placeholder="e.g., Engineering, Design..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Active Filters & Clear */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilterCount > 0 && (
            <span className="text-sm text-gray-600">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
          )}
          {filters.internship_type && (
            <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
              {INTERNSHIP_TYPE_CHOICES.find(c => c.value === filters.internship_type)?.label}
              <button
                onClick={() => clearFilter('internship_type')}
                className="ml-1 hover:text-indigo-900"
                aria-label="Clear internship type filter"
              >
                ×
              </button>
            </span>
          )}
          {filters.work_mode && (
            <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
              {WORK_MODE_CHOICES.find(c => c.value === filters.work_mode)?.label}
              <button
                onClick={() => clearFilter('work_mode')}
                className="ml-1 hover:text-indigo-900"
                aria-label="Clear work mode filter"
              >
                ×
              </button>
            </span>
          )}
          {filters.work_type && (
            <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
              {WORK_TYPE_CHOICES.find(c => c.value === filters.work_type)?.label}
              <button
                onClick={() => clearFilter('work_type')}
                className="ml-1 hover:text-indigo-900"
                aria-label="Clear work type filter"
              >
                ×
              </button>
            </span>
          )}
          {filters.compensation_type && (
            <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
              {COMPENSATION_TYPE_CHOICES.find(c => c.value === filters.compensation_type)?.label}
              <button
                onClick={() => clearFilter('compensation_type')}
                className="ml-1 hover:text-indigo-900"
                aria-label="Clear compensation type filter"
              >
                ×
              </button>
            </span>
          )}
          {filters.location && (
            <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
              Location: {filters.location}
              <button
                onClick={() => clearFilter('location')}
                className="ml-1 hover:text-indigo-900"
                aria-label="Clear location filter"
              >
                ×
              </button>
            </span>
          )}
          {filters.skill && (
            <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
              Skill: {filters.skill}
              <button
                onClick={() => clearFilter('skill')}
                className="ml-1 hover:text-indigo-900"
                aria-label="Clear skill filter"
              >
                ×
              </button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
              Category: {filters.category}
              <button
                onClick={() => clearFilter('category')}
                className="ml-1 hover:text-indigo-900"
                aria-label="Clear category filter"
              >
                ×
              </button>
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            disabled={isLoading}
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  )
}
