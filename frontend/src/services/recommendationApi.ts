import api from './api'
import type { RecommendationResponse, Recommendation } from '@/types'

/**
 * Get AI-powered recommendations for the authenticated student.
 * @param refresh - Set to true to bust cache and re-score immediately
 */
export async function getRecommendations(refresh = false): Promise<RecommendationResponse> {
  const params = refresh ? { refresh: 'true' } : {}
  const response = await api.get<RecommendationResponse>('/recommendations/', { params })
  return response.data
}

/**
 * Get recommendation history for the authenticated student.
 */
export async function getRecommendationHistory(): Promise<Recommendation[]> {
  const response = await api.get<Recommendation[]>('/recommendations/history/')
  return response.data
}

/**
 * Submit feedback for a recommendation (view, save, apply, ignore).
 * @param internshipId - The ID of the internship
 * @param action - The action to perform: 'view' | 'save' | 'apply' | 'ignore'
 */
export async function submitRecommendationFeedback(
  internshipId: number,
  action: 'view' | 'save' | 'apply' | 'ignore'
): Promise<{ message: string; status: string }> {
  const response = await api.post<{ message: string; status: string }>(
    `/recommendations/${internshipId}/feedback/`,
    { action }
  )
  return response.data
}

/**
 * Apply to an internship.
 * @param internshipId - The ID of the internship
 * @param notes - Optional notes about the application
 */
export async function applyToInternship(
  internshipId: number,
  notes?: string
): Promise<{ id: number; internship: number; student: number; notes?: string; created_at: string }> {
  const response = await api.post(
    '/internships/applications/add/',
    { internship: internshipId, notes }
  )
  return response.data
}

/**
 * Save an internship to the student's saved list.
 * @param internshipId - The ID of the internship
 */
export async function saveInternship(
  internshipId: number
): Promise<{ id: number; internship: number; student: number; created_at: string }> {
  const response = await api.post('/internships/saved/add/', { internship: internshipId })
  return response.data
}

/**
 * Remove an internship from the student's saved list.
 * @param internshipId - The ID of the internship
 */
export async function unsaveInternship(internshipId: number): Promise<void> {
  await api.delete(`/internships/saved/${internshipId}/`)
}
