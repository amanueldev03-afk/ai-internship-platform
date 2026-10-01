import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Briefcase, Database, Brain, Sparkles, LogOut, ChevronRight, ShieldCheck, Check, Loader2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { logoutUser } from '@/features/auth/authSlice'
import { getAdminAnalytics, type AdminAnalytics } from '@/services/adminAnalyticsApi'
import api from '@/services/api'
import { Button } from '@/components/ui/button'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-gradient rounded-3xl p-6 shadow-card hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1">
      <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-3xl font-black gradient-text">{value}</p>
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

  // Institutional Staff Approval Queue
  const [pendingStaff, setPendingStaff] = useState<any[]>([])
  const [isLoadingStaff, setIsLoadingStaff] = useState(false)
  const [approvingStaffId, setApprovingStaffId] = useState<number | null>(null)

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

    fetchPendingStaff()

    return () => {
      isCurrent = false
    }
  }, [])

  const fetchPendingStaff = async () => {
    setIsLoadingStaff(true)
    try {
      const res = await api.get('/v1/auth/admin/pending-staff/')
      setPendingStaff(Array.isArray(res.data) ? res.data : [])
    } catch {
      // silent
    } finally {
      setIsLoadingStaff(false)
    }
  }

  const handleApproveStaff = async (staffId: number) => {
    setApprovingStaffId(staffId)
    try {
      await api.post(`/v1/auth/admin/approve-staff/${staffId}/`)
      alert('Institutional staff member approved successfully! Login access unlocked.')
      setPendingStaff((prev) => prev.filter((s) => s.id !== staffId))
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Approval failed.')
    } finally {
      setApprovingStaffId(null)
    }
  }

  const handleLogout = async () => {
    await dispatch(logoutUser(localStorage.getItem('refresh_token')))
    navigate('/login')
  }

  const navLinks = [
    { label: 'User Management', path: '/admin/students', icon: Users, desc: 'Manage students & admins' },
    { label: 'Internship Review', path: '/admin/internships/review', icon: Briefcase, desc: 'Review & approve jobs' },
    { label: 'Data Sources', path: '/admin/data-sources', icon: Database, desc: 'Scraper health & logs' },
    { label: 'AI Monitoring', path: '/admin/ai-monitoring', icon: Brain, desc: 'Embeddings & model latency' },
  ]

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 animate-fade-in pb-16">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="card-gradient p-6 sm:p-8 rounded-3xl shadow-soft flex flex-wrap items-center justify-between gap-4 animate-slide-up">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Operations Central
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
              Admin <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Live platform analytics & intelligence overview for {user?.email}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            disabled={authLoading}
            className="rounded-2xl text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            {authLoading ? 'Logging out...' : 'Logout'}
          </Button>
        </header>

        <nav className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="card-gradient flex items-center justify-between p-5 rounded-3xl shadow-card hover:shadow-glow hover:border-primary-400/60 text-left transition-all duration-300 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-neutral-900 dark:text-white">{link.label}</span>
                    <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">{link.desc}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </button>
            )
          })}
        </nav>

        {isLoading && (
          <div className="card-gradient p-8 rounded-3xl animate-pulse space-y-4 text-center">
            <p className="text-xs font-semibold text-neutral-500">Loading analytics...</p>
            <div className="h-20 bg-neutral-100 dark:bg-neutral-800/60 rounded-2xl" />
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-2xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-950/40 p-4 text-error-700 dark:text-error-300 text-xs font-medium animate-scale-in">
            {error}
          </div>
        )}

        {/* INSTITUTIONAL STAFF APPROVAL QUEUE */}
        <section aria-labelledby="staff-approvals" className="card-gradient rounded-3xl p-6 sm:p-8 shadow-card border border-neutral-200/80 dark:border-neutral-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 id="staff-approvals" className="text-base font-bold text-neutral-900 dark:text-white">
                  Institutional Staff Approval Queue
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Deans, UIL Officers, Student Union, and Dorm Admins require platform administrator verification before login access is granted.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPendingStaff}
              disabled={isLoadingStaff}
              className="text-xs self-start sm:self-auto"
            >
              {isLoadingStaff ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Refresh Staff Queue
            </Button>
          </div>

          {isLoadingStaff ? (
            <div className="p-8 text-center text-xs text-neutral-400">Loading pending institutional staff...</div>
          ) : pendingStaff.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800">
              <Check className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              All institutional staff registrations are verified. No pending approvals.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-[11px] font-bold text-neutral-400 uppercase">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department / Office</th>
                    <th className="py-3 px-4">University</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {pendingStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                      <td className="py-3 px-4">
                        <span className="font-bold text-neutral-900 dark:text-white block">
                          {staff.full_name || `${staff.first_name || ''} ${staff.last_name || ''}`}
                        </span>
                        <span className="text-[11px] text-neutral-400">{staff.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                          {staff.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                        {staff.department || 'General Administration'}
                      </td>
                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                        {staff.university_name || 'Addis Ababa University'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          disabled={approvingStaffId === staff.id}
                          onClick={() => handleApproveStaff(staff.id)}
                          className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          {approvingStaffId === staff.id ? 'Approving...' : 'Approve Staff'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {analytics && !error && (
          <div className="space-y-8 animate-slide-up">
            <section aria-labelledby="user-statistics">
              <h2 id="user-statistics" className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">
                User Demographics
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Total Users" value={analytics.users.total} />
                <StatCard label="Students" value={analytics.users.students} />
                <StatCard label="Administrators" value={analytics.users.admins} />
              </div>
            </section>

            <section aria-labelledby="internship-statistics">
              <h2 id="internship-statistics" className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">
                Internship Inventory
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Total Internships" value={analytics.internships.total} />
                <StatCard label="Active Listings" value={analytics.internships.active} />
                <StatCard label="Needs Review" value={analytics.internships.needs_review} />
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <section aria-labelledby="skills-heading" className="card-gradient rounded-3xl p-6 sm:p-8 shadow-card">
                <h2 id="skills-heading" className="text-base font-bold text-neutral-900 dark:text-white mb-4">
                  Most-Requested Technical Skills
                </h2>
                {analytics.most_requested_skills.length === 0 ? (
                  <p className="text-xs text-neutral-500 font-medium">No internship skill demand recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {analytics.most_requested_skills.map((item) => {
                      const maximum = analytics.most_requested_skills[0]?.count || 1
                      const pct = Math.round((item.count / maximum) * 100)
                      return (
                        <div key={item.skill} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-neutral-700 dark:text-neutral-300">{item.skill}</span>
                            <span className="text-primary-600 dark:text-primary-400">{item.count} roles</span>
                          </div>
                          <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              <section aria-labelledby="recommendation-statistics" className="card-gradient rounded-3xl p-6 sm:p-8 shadow-card space-y-4">
                <h2 id="recommendation-statistics" className="text-base font-bold text-neutral-900 dark:text-white">
                  Recommendation Performance
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <StatCard label="Total Matches Generated" value={analytics.recommendations.total} />
                  <StatCard
                    label="Average Match Score"
                    value={analytics.recommendations.average_match_score === null ? 'No data' : `${analytics.recommendations.average_match_score.toFixed(1)}%`}
                  />
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
