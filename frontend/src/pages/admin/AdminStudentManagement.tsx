import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAdminStudents,
  deactivateStudent,
  activateStudent,
  getStudentActivity,
  type AdminStudent,
  type StudentActivityResponse,
} from '@/services/adminApi'

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export default function AdminStudentManagement() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<AdminStudent[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null)
  const [activity, setActivity] = useState<StudentActivityResponse | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchStudents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number> = { page, page_size: 20 }
      if (search) params.search = search
      if (filterActive) params.is_active = filterActive
      const data = await getAdminStudents(params as any)
      setStudents(data.results)
      setTotalCount(data.count)
    } catch {
      setError('Failed to load students.')
    } finally {
      setIsLoading(false)
    }
  }, [page, search, filterActive])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchStudents()
  }

  const handleToggleActive = async (student: AdminStudent) => {
    setActionLoading(student.id)
    try {
      if (student.is_active) {
        await deactivateStudent(student.id)
      } else {
        await activateStudent(student.id)
      }
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, is_active: !s.is_active } : s))
      )
      if (selectedStudent?.id === student.id) {
        setSelectedStudent((prev) => (prev ? { ...prev, is_active: !prev.is_active } : prev))
      }
    } catch {
      setError('Action failed. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewActivity = async (student: AdminStudent) => {
    setSelectedStudent(student)
    setActivity(null)
    setActivityLoading(true)
    try {
      const data = await getStudentActivity(student.id)
      setActivity(data)
    } catch {
      setError('Failed to load student activity.')
    } finally {
      setActivityLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / 20)

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button onClick={() => navigate('/admin/dashboard')} className="mb-2 text-sm text-indigo-600 hover:text-indigo-500">&larr; Back to Dashboard</button>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="mt-1 text-sm text-slate-500">{totalCount} students registered</p>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Search</button>
          </form>
          <select
            value={filterActive}
            onChange={(e) => { setFilterActive(e.target.value); setPage(1) }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All statuses</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </select>
        </div>

        {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

        {isLoading ? (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading students...</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Last Login</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">{student.full_name || student.email}</div>
                      <div className="text-xs text-slate-500">{student.email}</div>
                      {student.university && <div className="text-xs text-slate-400">{student.university}</div>}
                    </td>
                    <td className="px-4 py-3"><Badge active={student.is_active} /></td>
                    <td className="px-4 py-3 text-xs text-slate-600">{new Date(student.date_joined).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{student.last_login ? new Date(student.last_login).toLocaleDateString() : 'Never'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewActivity(student)}
                          className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                        >
                          Activity
                        </button>
                        <button
                          onClick={() => handleToggleActive(student)}
                          disabled={actionLoading === student.id}
                          className={`rounded px-2 py-1 text-xs font-medium text-white disabled:opacity-50 ${
                            student.is_active
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {actionLoading === student.id ? '...' : student.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">No students found.</td></tr>
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">Prev</button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedStudent(null)}>
            <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Activity: {selectedStudent.full_name || selectedStudent.email}</h2>
                <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
              </div>
              {activityLoading ? (
                <p className="text-sm text-slate-500">Loading activity...</p>
              ) : activity ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Applications</p>
                      <p className="text-lg font-semibold text-slate-900">{activity.activity_counts.total_applications}</p>
                    </div>
                    <div className="rounded bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Saved</p>
                      <p className="text-lg font-semibold text-slate-900">{activity.activity_counts.total_saves}</p>
                    </div>
                    <div className="rounded bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Recommendations</p>
                      <p className="text-lg font-semibold text-slate-900">{activity.activity_counts.total_recommendations}</p>
                    </div>
                  </div>
                  {activity.results.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-slate-700">Recent Activity</h3>
                      {activity.results.map((entry) => (
                        <div key={entry.id} className="rounded border border-slate-100 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">{entry.action_display}</span>
                            <span className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
                          </div>
                          {entry.description && <p className="mt-1 text-xs text-slate-500">{entry.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No activity recorded yet.</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
