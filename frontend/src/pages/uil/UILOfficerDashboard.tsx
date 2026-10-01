import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Building, 
  Users, 
  Cpu, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  Loader2, 
  UserCheck, 
  FileCheck, 
  QrCode, 
  School, 
  Check, 
  X
} from 'lucide-react'
import api from '@/services/api'
import { Button } from '@/components/ui/button'

interface InHouseCohort {
  id: string
  university_name: string
  academic_year: string
  start_date: string
  end_date: string
  capacity_k: number
  enrolled_count: number
  is_open: boolean
  student_count: number
  teams_count: number
}

interface FormulatedTeam {
  id: string
  team_name: string
  project_title: string
  members: any[]
}

interface PendingAdvisor {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  department?: string
  university_name?: string
  created_at: string
}

interface Track1Team {
  id: string
  team_name: string
  project_title: string
  advisor_name?: string
  srs_status: string
  documentation_deadline?: string
  implementation_deadline?: string
  documentation_submission?: string
  implementation_submission?: string
  advisor_rating?: number
  advisor_score?: number
  advisor_notes?: string
  uil_score?: number
  is_uil_sealed?: boolean
  uil_qr_code?: string
}

export default function UILOfficerDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as 'cohorts' | 'balancer' | 'advisors' | 'sealing') || 'cohorts'
  const setActiveTab = (tab: 'cohorts' | 'balancer' | 'advisors' | 'sealing') => {
    setSearchParams({ tab })
  }
  const [cohorts, setCohorts] = useState<InHouseCohort[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [balancingCohortId, setBalancingCohortId] = useState<string | null>(null)
  const [balancedTeams, setBalancedTeams] = useState<FormulatedTeam[]>([])
  const [squadSize, setSquadSize] = useState(5)
  const [selectedCohortId, setSelectedCohortId] = useState<string>('')

  // Advisor Approvals
  const [pendingAdvisors, setPendingAdvisors] = useState<PendingAdvisor[]>([])
  const [isLoadingAdvisors, setIsLoadingAdvisors] = useState(false)
  const [approvingAdvisorId, setApprovingAdvisorId] = useState<number | null>(null)

  // Teams & Sealing
  const [teams, setTeams] = useState<Track1Team[]>([])
  const [sealingTeam, setSealingTeam] = useState<Track1Team | null>(null)
  const [uilScoreInput, setUilScoreInput] = useState(88)
  const [uilNotesInput, setUilNotesInput] = useState('Excellent full-stack architecture, comprehensive tests and clean implementation.')
  const [qrModalSeal, setQrModalSeal] = useState<{ title: string; qrBase64: string } | null>(null)

  // Create Cohort Modal
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false)
  const [creatingCohort, setCreatingCohort] = useState(false)
  const [newCohort, setNewCohort] = useState({
    university_name: 'Addis Ababa University',
    academic_year: '2023/2024',
    start_date: '2026-10-01',
    end_date: '2027-01-31',
    capacity_k: 50,
  })

  useEffect(() => {
    fetchCohorts()
    fetchPendingAdvisors()
    fetchTeams()
  }, [])

  const fetchCohorts = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/v1/projects/cohorts/')
      const data = res.data
      const list = Array.isArray(data) ? data : data.results || []
      setCohorts(list)
      if (list.length > 0) {
        setSelectedCohortId((prev) => prev || list[0].id)
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPendingAdvisors = async () => {
    setIsLoadingAdvisors(true)
    try {
      const res = await api.get('/v1/auth/uil/pending-advisors/')
      setPendingAdvisors(Array.isArray(res.data) ? res.data : [])
    } catch {
      // silent
    } finally {
      setIsLoadingAdvisors(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const res = await api.get('/v1/teams/')
      setTeams(Array.isArray(res.data) ? res.data : res.data.results || [])
    } catch {
      // silent
    }
  }

  const handleApproveAdvisor = async (advisorId: number) => {
    setApprovingAdvisorId(advisorId)
    try {
      await api.post(`/v1/auth/uil/approve-advisor/${advisorId}/`)
      alert('Academic Advisor approved successfully! Login access unlocked.')
      setPendingAdvisors((prev) => prev.filter((a) => a.id !== advisorId))
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Approval failed.')
    } finally {
      setApprovingAdvisorId(null)
    }
  }

  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingCohort(true)
    try {
      const res = await api.post('/v1/projects/cohorts/', newCohort)
      setCohorts((prev) => [res.data, ...prev])
      setIsCohortModalOpen(false)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create cohort')
    } finally {
      setCreatingCohort(false)
    }
  }

  const handleTriggerBalancer = async (cohortId: string) => {
    setBalancingCohortId(cohortId)
    setBalancedTeams([])
    try {
      const res = await api.post(`/v1/projects/cohorts/${cohortId}/balance/`, {
        squad_size: squadSize,
      })
      setBalancedTeams(Array.isArray(res.data) ? res.data : [])
      fetchCohorts()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Squad formulation failed')
    } finally {
      setBalancingCohortId(null)
    }
  }

  // Review SRS documentation starting implementation countdown timer
  const handleReviewDoc = async (teamId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.post(`/v1/teams/${teamId}/review-documentation/`, {
        status,
        feedback: status === 'APPROVED' ? 'SRS documentation meets high software engineering standards. Coding unlocked.' : 'Please revise SRS architecture.',
        implementation_deadline_days: 14,
      })
      alert(`Documentation ${status}! Implementation countdown timer started.`)
      fetchTeams()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Review failed.')
    }
  }

  // UIL Seal Score Sheet
  const handleSealScoreSheet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sealingTeam) return
    try {
      const res = await api.post(`/v1/teams/${sealingTeam.id}/uil-score-seal/`, {
        uil_score: uilScoreInput,
        uil_notes: uilNotesInput,
      })
      alert('Score sheet cryptographically sealed with UIL Base64 QR code!')
      setQrModalSeal({
        title: `UIL Official Seal QR - Squad ${sealingTeam.team_name}`,
        qrBase64: res.data.uil_qr_code,
      })
      setSealingTeam(null)
      fetchTeams()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Score sealing failed.')
    }
  }

  const totalCapacity = cohorts.reduce((acc, c) => acc + (c.capacity_k || 0), 0)
  const totalEnrolled = cohorts.reduce((acc, c) => acc + (c.enrolled_count || 0), 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0c0c0e] py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 mb-2">
              <Building className="w-3.5 h-3.5" />
              University-Industry Linkage (UIL) Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              Track 1 Cohort Capacity, Squad Balancer & Sealing Gate
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Configure software house cohorts, formulate balanced squads, approve Academic Advisors, and cryptographically seal final score sheets.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button onClick={() => setIsCohortModalOpen(true)} className="text-xs font-bold shadow-glow">
              <Plus className="w-4 h-4 mr-1.5" /> Create Cohort
            </Button>
            <Button onClick={() => { fetchCohorts(); fetchPendingAdvisors(); fetchTeams(); }} disabled={isLoading} variant="outline" className="text-xs">
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="card-gradient p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">Cohort Capacity (K)</span>
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-neutral-900 dark:text-white">{totalCapacity}</div>
            <div className="mt-1 text-[11px] text-neutral-400">Target cohort seats</div>
          </div>

          <div className="card-gradient p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">Enrolled Students</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-neutral-900 dark:text-white">{totalEnrolled}</div>
            <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">Accepted into Track 1</div>
          </div>

          <div className="card-gradient p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">Pending Advisors</span>
              <School className="w-5 h-5 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-neutral-900 dark:text-white">{pendingAdvisors.length}</div>
            <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">Awaiting UIL approval</div>
          </div>

          <div className="card-gradient p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">Active Squads</span>
              <Calendar className="w-5 h-5 text-primary-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-neutral-900 dark:text-white">{teams.length}</div>
            <div className="mt-1 text-[11px] text-neutral-400">Software house projects</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-neutral-200/80 dark:border-neutral-800 pb-2">
          <button
            onClick={() => setActiveTab('cohorts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'cohorts'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            In-House Cohorts ({cohorts.length})
          </button>
          <button
            onClick={() => setActiveTab('balancer')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'balancer'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Squad Balancer
          </button>
          <button
            onClick={() => setActiveTab('advisors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'advisors'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Advisor Approvals ({pendingAdvisors.length})
          </button>
          <button
            onClick={() => setActiveTab('sealing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'sealing'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Documentation Gate & QR Score Sealing ({teams.length})
          </button>
        </div>

        {/* TAB 1: COHORTS GRID */}
        {activeTab === 'cohorts' && (
          <div className="space-y-4">
            {cohorts.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
                No in-house cohorts created yet. Click "Create Cohort" to establish a Track 1 cohort.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cohorts.map((cohort) => (
                  <div
                    key={cohort.id}
                    className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-soft space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          Academic Year {cohort.academic_year}
                        </span>
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                          {cohort.university_name}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {cohort.start_date} to {cohort.end_date}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                        Capacity: {cohort.capacity_k}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-neutral-100 dark:border-neutral-800/80">
                      <div>
                        <span className="text-neutral-400">Accepted Students:</span>{' '}
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {cohort.enrolled_count || cohort.student_count || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400">Formed Squads:</span>{' '}
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {cohort.teams_count || 0}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedCohortId(cohort.id)
                        setActiveTab('balancer')
                      }}
                      className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Cpu className="w-3.5 h-3.5 mr-1.5" /> Form Balanced Squads
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SQUAD BALANCER */}
        {activeTab === 'balancer' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-4 shadow-soft">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Algorithmic Role Balancing (~2 Frontend, ~2 Backend, ~1 DevOps/QA)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Select Target Cohort
                  </label>
                  <select
                    value={selectedCohortId}
                    onChange={(e) => setSelectedCohortId(e.target.value)}
                    className="w-full p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                  >
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.university_name} ({c.academic_year})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Squad Size
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="8"
                    value={squadSize}
                    onChange={(e) => setSquadSize(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    disabled={!selectedCohortId || balancingCohortId === selectedCohortId}
                    onClick={() => selectedCohortId && handleTriggerBalancer(selectedCohortId)}
                    className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white h-9"
                  >
                    {balancingCohortId === selectedCohortId ? 'Formulating...' : 'Run Balancer'}
                  </Button>
                </div>
              </div>
            </div>

            {balancedTeams.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {balancedTeams.map((team) => (
                  <div key={team.id} className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">Formulated Squad</span>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{team.team_name}</h4>
                    <p className="text-xs text-neutral-500">Project: {team.project_title}</p>
                    <span className="text-xs text-emerald-600 font-bold block">Balanced & Saved</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PENDING ADVISORS APPROVAL */}
        {activeTab === 'advisors' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-soft">
            <div className="p-4 border-b border-neutral-200/80 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Academic Advisors Pending UIL Approval Gate
              </h3>
              <p className="text-xs text-neutral-500">
                Institutional security requirement: Faculty Advisors cannot log in or manage squads until officially vetted by UIL Officer.
              </p>
            </div>

            {isLoadingAdvisors ? (
              <div className="p-8 text-center text-xs text-neutral-400">Loading pending advisors...</div>
            ) : pendingAdvisors.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                No academic advisors currently awaiting approval. All advisors are active.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-[11px] font-bold text-neutral-400 uppercase">
                    <tr>
                      <th className="py-3 px-4">Faculty Advisor</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">University</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {pendingAdvisors.map((adv) => (
                      <tr key={adv.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                        <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">
                          {adv.full_name || `${adv.first_name} ${adv.last_name}`}
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                          {adv.email}
                        </td>
                        <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                          {adv.department || 'Computer Science & Engineering'}
                        </td>
                        <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                          {adv.university_name || 'Addis Ababa University'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            disabled={approvingAdvisorId === adv.id}
                            onClick={() => handleApproveAdvisor(adv.id)}
                            className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            {approvingAdvisorId === adv.id ? 'Approving...' : 'Approve Advisor'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SQUAD DOCUMENTATION GATE & QR SCORE SEALING */}
        {activeTab === 'sealing' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
              <div>
                <span className="font-bold block">Documentation Gate & Cryptographic UIL Seal:</span>
                <span>Approving SRS unlocks the 14-day implementation countdown timer. Review Advisor ratings, input UIL score, and generate the HMAC-signed UIL QR Seal.</span>
              </div>
              <QrCode className="w-5 h-5 text-indigo-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.length === 0 ? (
                <div className="col-span-2 p-12 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
                  No project squads found.
                </div>
              ) : (
                teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-4 shadow-soft"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          Squad Governance
                        </span>
                        <h4 className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                          {team.team_name}
                        </h4>
                        <p className="text-xs text-neutral-500">Project: {team.project_title}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        team.is_uil_sealed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {team.is_uil_sealed ? 'UIL Sealed' : 'Unsealed'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-neutral-100 dark:border-neutral-800">
                      <div>
                        <span className="text-neutral-400">SRS Status:</span>{' '}
                        <span className={`font-bold ${team.srs_status === 'APPROVED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {team.srs_status}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400">Advisor Rating:</span>{' '}
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {team.advisor_rating ? `${team.advisor_rating}/5 Stars (${team.advisor_score}%)` : 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400">Documentation Timer:</span>{' '}
                        <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                          {team.documentation_deadline ? new Date(team.documentation_deadline).toLocaleDateString() : 'Active'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400">Implementation Timer:</span>{' '}
                        <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                          {team.implementation_deadline ? new Date(team.implementation_deadline).toLocaleDateString() : 'Locked'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {team.srs_status !== 'APPROVED' ? (
                        <Button
                          size="sm"
                          onClick={() => handleReviewDoc(team.id, 'APPROVED')}
                          className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Approve SRS & Start Coding Timer
                        </Button>
                      ) : (
                        <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Documentation Approved
                        </span>
                      )}

                      {!team.is_uil_sealed ? (
                        <Button
                          size="sm"
                          onClick={() => setSealingTeam(team)}
                          className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold ml-auto"
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1" /> Input Score & Seal Sheet
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setQrModalSeal({
                              title: `UIL QR Seal - ${team.team_name}`,
                              qrBase64: team.uil_qr_code!,
                            })
                          }
                          className="text-xs h-8 ml-auto"
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1" /> View UIL QR Seal
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* CREATE COHORT MODAL */}
      {isCohortModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-neutral-200 dark:border-neutral-800 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Launch Track 1 In-House Cohort
            </h3>
            <form onSubmit={handleCreateCohort} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  University Name *
                </label>
                <input
                  required
                  type="text"
                  value={newCohort.university_name}
                  onChange={(e) => setNewCohort((p) => ({ ...p, university_name: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Academic Year *
                  </label>
                  <input
                    required
                    type="text"
                    value={newCohort.academic_year}
                    onChange={(e) => setNewCohort((p) => ({ ...p, academic_year: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Capacity (K) *
                  </label>
                  <input
                    required
                    type="number"
                    value={newCohort.capacity_k}
                    onChange={(e) => setNewCohort((p) => ({ ...p, capacity_k: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCohortModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creatingCohort} className="bg-indigo-600 text-white font-bold">
                  {creatingCohort ? 'Creating...' : 'Establish Cohort'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UIL SCORE SEAL MODAL */}
      {sealingTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-neutral-200 dark:border-neutral-800 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              UIL Officer Final Score Sheet Seal
            </h3>
            <p className="text-xs text-neutral-500">
              Squad: <span className="font-bold">{sealingTeam.team_name}</span> • Advisor Score: {sealingTeam.advisor_score || 85}%
            </p>

            <form onSubmit={handleSealScoreSheet} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  UIL Institutional Score (out of 100) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={uilScoreInput}
                  onChange={(e) => setUilScoreInput(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Institutional Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={uilNotesInput}
                  onChange={(e) => setUilNotesInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSealingTeam(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  Seal Sheet & Generate UIL QR
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL PREVIEW */}
      {qrModalSeal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-sm w-full p-6 space-y-4 border border-neutral-200 dark:border-neutral-800 shadow-xl text-center">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{qrModalSeal.title}</h3>
              <button onClick={() => setQrModalSeal(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-white rounded-xl border border-neutral-200 inline-block mx-auto shadow-sm">
              <img
                src={qrModalSeal.qrBase64}
                alt="UIL QR Seal"
                className="w-48 h-48 object-contain mx-auto"
              />
            </div>
            <p className="text-xs text-neutral-500">
              Score sheet cryptographically locked with UIL signature.
            </p>
            <Button size="sm" onClick={() => setQrModalSeal(null)} className="w-full text-xs">
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
