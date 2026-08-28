// -----------------------------------------------------------------------
// Shared TypeScript types — mirrors the Django model/serializer shapes.
// Expand each interface as the backend API is built out.
// -----------------------------------------------------------------------

export type UserRole = 'student' | 'admin'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: UserRole
  is_email_verified: boolean
}

export interface Internship {
  id: number
  title: string
  company: string
  location: string
  work_mode: 'remote' | 'onsite' | 'hybrid'
  deadline: string | null
  apply_url: string
  required_skills: string[]
  description: string
}

export interface Recommendation {
  id: number
  internship: Internship
  match_score: number       // 0–100
  match_explanation: string
  created_at: string
}

export interface Application {
  id: number
  internship: Internship
  applied_at: string
}

export interface ApiError {
  detail?: string
  [key: string]: unknown
}
