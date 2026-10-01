import api from './api'

export interface CampusLogisticsItem {
  id: string
  student: string | number
  student_id_number: string
  student_name: string
  student_email: string
  department: string
  academic_year: number
  cohort: string
  cohort_name: string
  cohort_academic_year: string
  dean_approved: boolean
  dean_signature_hash: string
  dean_signed_by: string | null
  dean_signed_by_name: string
  dean_signed_at: string | null
  signature_verified: boolean
  meal_card_number: string
  meal_card_active: boolean
  meal_card_issued_at: string | null
  meal_card_issued_by: string | null
  meal_card_issued_by_name: string
  dorm_block: string
  dorm_room: string
  dorm_bed_number: string
  dorm_status: 'UNASSIGNED' | 'ASSIGNED' | 'KEY_ISSUED' | 'PENDING_KEY_RETURN' | 'RETURNED'
  key_issued: boolean
  key_issued_at: string | null
  key_issued_by: string | null
  key_issued_by_name: string
  valid_from: string | null
  valid_until: string | null
  is_valid_today: boolean
  cleared_at_exit: boolean
  created_at: string
  updated_at: string
}

export interface DormRoomOccupant {
  student_id: string
  student_name: string
  bed_number: string
  key_issued: boolean
  key_issued_at: string | null
  dorm_status: string
  logistics_id: string
}

export interface DormRoomItem {
  block: string
  room: string
  bed_capacity: number
  occupied_beds: number
  occupants: DormRoomOccupant[]
}

export interface DormRoomGridResponse {
  rooms: DormRoomItem[]
  total_rooms_with_occupants: number
}

export async function getCampusLogistics(params?: Record<string, string | boolean | undefined>): Promise<CampusLogisticsItem[]> {
  const response = await api.get<CampusLogisticsItem[]>('/v1/logistics/', { params })
  return response.data
}

export async function getMealCardQueue(search?: string, active?: boolean): Promise<CampusLogisticsItem[]> {
  const params: Record<string, string | boolean> = {}
  if (search) params.search = search
  if (active !== undefined) params.active = active
  const response = await api.get<CampusLogisticsItem[]>('/v1/logistics/meal-cards/', { params })
  return response.data
}

export async function activateMealCard(id: string, mealCardNumber: string): Promise<CampusLogisticsItem> {
  const response = await api.post<CampusLogisticsItem>(`/v1/logistics/${id}/activate-meal-card/`, {
    meal_card_number: mealCardNumber,
  })
  return response.data
}

export async function getDormRoomGrid(block?: string): Promise<DormRoomGridResponse> {
  const params: Record<string, string> = {}
  if (block) params.block = block
  const response = await api.get<DormRoomGridResponse>('/v1/logistics/dorm-rooms/', { params })
  return response.data
}

export async function assignDormRoom(
  id: string,
  data: { dorm_block: string; dorm_room: string; dorm_bed_number: string; issue_key?: boolean }
): Promise<CampusLogisticsItem> {
  const response = await api.post<CampusLogisticsItem>(`/v1/logistics/${id}/assign-dorm/`, data)
  return response.data
}

export async function returnDormKey(id: string): Promise<CampusLogisticsItem> {
  const response = await api.post<CampusLogisticsItem>(`/v1/logistics/${id}/return-key/`)
  return response.data
}

export async function deanSignOff(id: string): Promise<CampusLogisticsItem> {
  const response = await api.post<CampusLogisticsItem>(`/v1/logistics/${id}/dean-sign/`)
  return response.data
}
