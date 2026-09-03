import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { logoutUser } from '@/features/auth/authSlice'
import { getAdminAnalytics, type AdminAnalytics } from '@/services/adminAnalyticsApi'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.auth.user)
  const { isLoading: authLoading } = useAppSelector((state) => state.auth)
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    getAdminAnalytics()
      .then((data) => {
        if (isCurrent) setAnalytics(data)
      })
      .catch(() => {
        if (isCurrent) setError('Unable to load administrator analytics.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const handleLogout = async () => {
    await dispatch(logoutUser(localStorage.getItem('refresh_token')))
    navigate('/login')
  }

  const navLinks = [
    { label: 'User Management', path: '/admin/students', icon: '👤' },
    { label: 'Internship Review', path: '/admin/internships/review', icon: '📋' },
    { label: 'Data Sources', path: '/admin/data-sources', icon: '🔗' },
    { label: 'AI Monitoring', path: '/admin/ai-monitoring', icon: '🤖' },
  ]

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Operations overview</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Live platform analytics for {user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={authLoading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {authLoading ? 'Logging out...' : 'Logout'}
          </button>
        </header>

        <nav className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="text-sm font-medium text-slate-700">{link.label}</span>
            </button>
          ))}
        </nav>

        {isLoading && <p className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading analytics...</p>}
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error}</p>}

        {analytics && !error && (
          <div className="space-y-8">
            <section aria-labelledby="user-statistics">
              <h2 id="user-statistics" className="mb-3 text-lg font-semibold text-slate-900">Users</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Total users" value={analytics.users.total} />
                <StatCard label="Students" value={analytics.users.students} />
                <StatCard label="Administrators" value={analytics.users.admins} />
              </div>
            </section>

            <section aria-labelledby="internship-statistics">
              <h2 id="internship-statistics" className="mb-3 text-lg font-semibold text-slate-900">Internships</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Total internships" value={analytics.internships.total} />
                <StatCard label="Active" value={analytics.internships.active} />
                <StatCard label="Needs review" value={analytics.internships.needs_review} />
              </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
              <section aria-labelledby="skills-heading" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 id="skills-heading" className="text-lg font-semibold text-slate-900">Most-requested skills</h2>
                {analytics.most_requested_skills.length === 0 ? (
                  <p className="mt-6 text-sm text-slate-500">No internship skill demand has been recorded yet.</p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {analytics.most_requested_skills.map((item) => {
                      const maximum = analytics.most_requested_skills[0]?.count || 1
                      return (
                        <div key={item.skill}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{item.skill}</span>
                            <span className="text-slate-500">{item.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${(item.count / maximum) * 100}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              <section aria-labelledby="recommendation-statistics" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 id="recommendation-statistics" className="text-lg font-semibold text-slate-900">Recommendations</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <StatCard label="Total recommendations" value={analytics.recommendations.total} />
                  <StatCard label="Average match score" value={analytics.recommendations.average_match_score === null ? 'No data' : `${analytics.recommendations.average_match_score.toFixed(1)}%`} />
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
