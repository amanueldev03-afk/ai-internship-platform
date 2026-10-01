import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Search, 
  Loader2, 
  KeyRound, 
  Utensils, 
  Building,
  QrCode,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  AlertTriangle,
  Check,
  X
} from 'lucide-react'
import api from '@/services/api'
import { Button } from '@/components/ui/button'

interface Track1Student {
  id: string
  student_id_number: string
  full_name: string
  email: string
  department: string
  campus_city: string
  academic_year: number
  gpa: string | null
  is_eligible: boolean
  eligibility_reason: string
  is_verified_by_dean: boolean
  dean_verified_at: string | null
  dean_verification_letter_qr?: string
  dean_dorm_food_letter_qr?: string
  has_score_roster: boolean
  roster_download_url?: string
  forwarded_to_uil: boolean
}

interface CampusLogistics {
  id: string
  student_id: string
  student_name?: string
  student_id_number?: string
  department?: string
  cohort_name?: string
  dean_approved: boolean
  dean_signature_hash?: string
  meal_card_number?: string
  meal_card_active: boolean
  dorm_block?: string
  dorm_room?: string
  key_issued: boolean
  valid_from: string
  valid_until: string
}

interface SquadTeam {
  id: string
  team_name: string
  project_title: string
  cohort_name?: string
  advisor_name?: string
  srs_status: string
  is_coding_unlocked: boolean
  defense_date?: string
  defense_venue?: string
  defense_scheduled: boolean
  advisor_score?: number
  uil_score?: number
  documentation_score?: number
  presentation_score?: number
  composite_score?: number
  composite_grade?: string
  score_sheet_unsealed?: boolean
}

export default function DeanDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as 'students' | 'defense' | 'logistics') || 'students'
  const setActiveTab = (tab: 'students' | 'defense' | 'logistics') => {
    setSearchParams({ tab })
  }

  // Students list state
  const [students, setStudents] = useState<Track1Student[]>([])
  const [deanDepartment, setDeanDepartment] = useState<string>('')
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [verifyingStudentId, setVerifyingStudentId] = useState<string | null>(null)
  const [searchStudent, setSearchStudent] = useState('')

  // QR Modal State
  const [qrModalData, setQrModalData] = useState<{ title: string; qrBase64: string; studentName: string } | null>(null)

  // Logistics state
  const [logisticsList, setLogisticsList] = useState<CampusLogistics[]>([])
  const [signingLogisticsId, setSigningLogisticsId] = useState<string | null>(null)

  // Teams & Grading state
  const [teams, setTeams] = useState<SquadTeam[]>([])
  const [schedulingTeam, setSchedulingTeam] = useState<SquadTeam | null>(null)
  const [defenseDate, setDefenseDate] = useState('')
  const [defenseVenue, setDefenseVenue] = useState('Conference Hall B, AAU Campus')
  const [gradingTeam, setGradingTeam] = useState<SquadTeam | null>(null)
  const [gradeInputs, setGradeInputs] = useState({
    advisor_score: 85,
    uil_score: 90,
    documentation_score: 88,
    presentation_score: 92,
  })
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchStudents()
    fetchLogistics()
    fetchTeams()
  }, [])

  const fetchStudents = async () => {
    setIsLoadingStudents(true)
    try {
      const res = await api.get('/v1/uil-profiles/dean/students/')
      const data = res.data
      setStudents(data.students || [])
      setDeanDepartment(data.dean_department || '')
    } catch {
      // silent
    } finally {
      setIsLoadingStudents(false)
    }
  }

  const fetchLogistics = async () => {
    try {
      const res = await api.get('/v1/logistics/')
      const data = res.data
      setLogisticsList(Array.isArray(data) ? data : data.results || [])
    } catch {
      // silent
    }
  }

  const fetchTeams = async () => {
    try {
      const res = await api.get('/v1/teams/')
      const data = res.data
      setTeams(Array.isArray(data) ? data : data.results || [])
    } catch {
      // fallback to mock or empty
    }
  }

  // 1-Click Verify Student
  const handleVerifyStudent = async (studentId: string) => {
    setVerifyingStudentId(studentId)
    try {
      const res = await api.post(`/v1/uil-profiles/dean/verify-student/${studentId}/`)
      alert('Student officially verified! Scannable Base64 QR letters and Excel roster generated.')
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                is_verified_by_dean: true,
                dean_verification_letter_qr: res.data.dean_verification_letter_qr,
                dean_dorm_food_letter_qr: res.data.dean_dorm_food_letter_qr,
                roster_download_url: res.data.roster_download_url,
                has_score_roster: true,
              }
            : s
        )
      )
      fetchLogistics()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Verification failed. Student must complete 3rd year (academic_year >= 4).')
    } finally {
      setVerifyingStudentId(null)
    }
  }

  // Logistics Sign
  const handleDeanLogisticsSign = async (id: string) => {
    setSigningLogisticsId(id)
    try {
      const res = await api.post(`/v1/logistics/${id}/dean-sign/`)
      setLogisticsList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...res.data } : item))
      )
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Cryptographic sign-off failed')
    } finally {
      setSigningLogisticsId(null)
    }
  }

  // Unseal UIL Score Sheet
  const handleUnseal = async (teamId: string) => {
    try {
      await api.post(`/v1/uil-profiles/dean/unseal-score-sheet/${teamId}/`)
      alert('UIL Score Sheet officially unsealed via QR verification!')
      fetchTeams()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Unseal failed.')
    }
  }

  // Schedule Defense
  const handleScheduleDefense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schedulingTeam) return
    setActionLoading(true)
    try {
      await api.post(`/v1/uil-profiles/dean/schedule-defense/${schedulingTeam.id}/`, {
        defense_date: defenseDate,
        defense_venue: defenseVenue,
      })
      alert(`Final defense scheduled for ${defenseDate}!`)
      setSchedulingTeam(null)
      fetchTeams()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Schedule defense failed.')
    } finally {
      setActionLoading(false)
    }
  }

  // Submit Final Composite Grade
  const handleSubmitFinalGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gradingTeam) return
    setActionLoading(true)
    try {
      const res = await api.post(`/v1/uil-profiles/dean/submit-final-grade/${gradingTeam.id}/`, gradeInputs)
      alert(`Final Composite Grade calculated: ${res.data.composite_score}% (${res.data.composite_grade})!`)
      setGradingTeam(null)
      fetchTeams()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Grade submission failed.')
    } finally {
      setActionLoading(false)
    }
  }

  const eligibleCount = students.filter((s) => s.is_eligible).length
  const verifiedCount = students.filter((s) => s.is_verified_by_dean).length

  const filteredStudents = students.filter((s) => {
    const q = searchStudent.toLowerCase()
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.student_id_number?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q)
    )
  })

  const previewComposite = (
    gradeInputs.advisor_score * 0.25 +
    gradeInputs.uil_score * 0.25 +
    gradeInputs.documentation_score * 0.25 +
    gradeInputs.presentation_score * 0.25
  ).toFixed(1)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0c0c0e] py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 mb-2">
              <Award className="w-3.5 h-3.5" />
              Department Dean Portal • {deanDepartment || 'Scoped Department View'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              Track 1 Verification, QR Letters & Final Composite Grading
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Verify 3rd-year completed students, issue Base64 QR authorization letters, download Excel rosters, and grade final project defenses.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { fetchStudents(); fetchLogistics(); fetchTeams(); }} variant="outline" className="text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Refresh Roster
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="card-gradient p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">Department Candidates</span>
              <Building className="w-5 h-5 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-neutral-900 dark:text-white">{students.length}</div>
            <div className="mt-1 text-[11px] text-neutral-400">{deanDepartment || 'Software Engineering'}</div>
          </div>

          <div className="card-gradient p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">3rd Year Completed (Year 4+)</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-neutral-900 dark:text-white">{eligibleCount}</div>
            <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">Academically eligible</div>
          </div>

          <div className="card-gradient p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">Officially Verified</span>
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-neutral-900 dark:text-white">{verifiedCount}</div>
            <div className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400">QR letters generated</div>
          </div>

          <div className="card-gradient p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">Logistics Candidates</span>
              <Utensils className="w-5 h-5 text-teal-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-neutral-900 dark:text-white">{logisticsList.length}</div>
            <div className="mt-1 text-[11px] text-neutral-400">Dorm & Meal Clearance</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-neutral-200/80 dark:border-neutral-800 pb-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'students'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Track 1 Candidates & Verification ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('defense')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'defense'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Defense & Composite Grading ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab('logistics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'logistics'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Campus Logistics Sign-Off ({logisticsList.length})
          </button>
        </div>

        {/* TAB 1: TRACK 1 CANDIDATES & 1-CLICK VERIFICATION */}
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-soft space-y-4 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Department Candidates (Strict 3rd-Year Completion Gate)
                </h3>
                <p className="text-xs text-neutral-500">
                  Only students with Year 4 or higher (completed 3rd year) qualify for official Dean verification.
                </p>
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student or ID..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none"
                />
              </div>
            </div>

            {isLoadingStudents ? (
              <div className="py-12 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                Loading department students...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No students found for department: {deanDepartment || 'Current Department'}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-[11px] font-bold text-neutral-400 uppercase">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">University ID</th>
                      <th className="py-3 px-4">Academic Year</th>
                      <th className="py-3 px-4">GPA</th>
                      <th className="py-3 px-4">Eligibility</th>
                      <th className="py-3 px-4">Dean Verification</th>
                      <th className="py-3 px-4">Base64 QR Letters</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {filteredStudents.map((stu) => (
                      <tr key={stu.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                        <td className="py-3 px-4">
                          <span className="font-bold text-neutral-900 dark:text-white block">{stu.full_name}</span>
                          <span className="text-[11px] text-neutral-400">{stu.email}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                          {stu.student_id_number}
                        </td>
                        <td className="py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">
                          Year {stu.academic_year}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {stu.gpa || '—'}
                        </td>
                        <td className="py-3 px-4">
                          {stu.is_eligible ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Eligible (Year 4+)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Ineligible (Year {stu.academic_year})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {stu.is_verified_by_dean ? (
                            <div className="space-y-0.5">
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                              </span>
                              <span className="text-[10px] text-neutral-400 block">
                                {stu.forwarded_to_uil ? 'Forwarded to UIL' : 'Pending student forward'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Unverified
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {stu.is_verified_by_dean ? (
                            <div className="flex items-center gap-2">
                              {stu.dean_verification_letter_qr && (
                                <button
                                  onClick={() =>
                                    setQrModalData({
                                      title: 'Dean Verification Letter QR',
                                      qrBase64: stu.dean_verification_letter_qr!,
                                      studentName: stu.full_name,
                                    })
                                  }
                                  className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 hover:bg-indigo-100"
                                  title="View Verification QR Letter"
                                >
                                  <QrCode className="w-4 h-4" />
                                </button>
                              )}
                              {stu.dean_dorm_food_letter_qr && (
                                <button
                                  onClick={() =>
                                    setQrModalData({
                                      title: 'Dean Dorm & Meal Clearance Letter QR',
                                      qrBase64: stu.dean_dorm_food_letter_qr!,
                                      studentName: stu.full_name,
                                    })
                                  }
                                  className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 hover:bg-teal-100"
                                  title="View Dorm & Food QR Letter"
                                >
                                  <Utensils className="w-4 h-4" />
                                </button>
                              )}
                              {stu.roster_download_url && (
                                <a
                                  href={stu.roster_download_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 hover:bg-emerald-100"
                                  title="Download Excel Score Sheet Template"
                                >
                                  <FileSpreadsheet className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-[10px]">Verify to generate</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!stu.is_verified_by_dean ? (
                            <Button
                              size="sm"
                              disabled={!stu.is_eligible || verifyingStudentId === stu.id}
                              onClick={() => handleVerifyStudent(stu.id)}
                              className="text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                            >
                              {verifyingStudentId === stu.id ? 'Verifying...' : '1-Click Verify'}
                            </Button>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" /> Authenticated
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DEFENSE SCHEDULING & COMPOSITE GRADING */}
        {activeTab === 'defense' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
              <div>
                <span className="font-bold block">Dean 4-Factor Composite Grading Formula:</span>
                <span>Final Score = (Advisor Score × 25%) + (UIL Score × 25%) + (Documentation Score × 25%) + (Presentation Score × 25%) = 100%</span>
              </div>
              <Sparkles className="w-5 h-5 text-amber-600" />
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
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                          Squad Defense
                        </span>
                        <h4 className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                          {team.team_name}
                        </h4>
                        <p className="text-xs text-neutral-500">Project: {team.project_title}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        team.composite_grade ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {team.composite_grade ? `Final Grade: ${team.composite_grade}` : 'Pending Grading'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-neutral-100 dark:border-neutral-800">
                      <div>
                        <span className="text-neutral-400">Advisor Score (25%):</span>{' '}
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {team.advisor_score !== undefined ? `${team.advisor_score}%` : 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400">UIL Score (25%):</span>{' '}
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {team.uil_score !== undefined ? `${team.uil_score}%` : 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400">Defense Scheduled:</span>{' '}
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {team.defense_date || 'Not Scheduled'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400">Composite Score:</span>{' '}
                        <span className="font-bold text-amber-600">
                          {team.composite_score ? `${team.composite_score}%` : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnseal(team.id)}
                        className="text-xs h-8"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1" /> Unseal Score Sheet
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSchedulingTeam(team)}
                        className="text-xs h-8"
                      >
                        <Calendar className="w-3.5 h-3.5 mr-1" /> Schedule Defense
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setGradingTeam(team)}
                        className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                      >
                        <Award className="w-3.5 h-3.5 mr-1" /> Compute Final Grade
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CAMPUS LOGISTICS SIGN-OFF */}
        {activeTab === 'logistics' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-soft">
            <div className="p-4 border-b border-neutral-200/80 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Track 1 Campus Logistics Clearance Chain
              </h3>
              <p className="text-xs text-neutral-500">
                Dean signs off on campus housing and meal entitlement. Unlocks Student Union meal card activation and Dormitory Admin room assignment.
              </p>
            </div>

            {logisticsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                No students in the campus logistics queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-[11px] font-bold text-neutral-400 uppercase">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">University ID</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Dean Signature Status</th>
                      <th className="py-3 px-4">Downstream Clearance</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {logisticsList.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                        <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">
                          {item.student_name || 'Student Candidate'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                          {item.student_id_number || '—'}
                        </td>
                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                          {item.department || 'Software Engineering'}
                        </td>
                        <td className="py-3 px-4">
                          {item.dean_approved ? (
                            <div>
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Digitally Signed
                              </span>
                              {item.dean_signature_hash && (
                                <span className="font-mono text-[9px] text-neutral-400 block truncate max-w-[150px]">
                                  SHA256: {item.dean_signature_hash}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Pending Signature
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span
                              className={`flex items-center gap-1 ${
                                item.meal_card_active ? 'text-emerald-600 font-bold' : 'text-neutral-400'
                              }`}
                            >
                              <Utensils className="w-3 h-3" /> Meal Card
                            </span>
                            <span
                              className={`flex items-center gap-1 ${
                                item.key_issued ? 'text-emerald-600 font-bold' : 'text-neutral-400'
                              }`}
                            >
                              <KeyRound className="w-3 h-3" /> Dorm Key
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!item.dean_approved ? (
                            <Button
                              size="sm"
                              disabled={signingLogisticsId === item.id}
                              onClick={() => handleDeanLogisticsSign(item.id)}
                              className="text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                            >
                              {signingLogisticsId === item.id ? 'Signing...' : 'Sign Clearance'}
                            </Button>
                          ) : (
                            <span className="text-neutral-400 text-[11px]">Verified</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR CODE MODAL */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-sm w-full p-6 space-y-4 border border-neutral-200 dark:border-neutral-800 shadow-xl text-center">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{qrModalData.title}</h3>
              <button onClick={() => setQrModalData(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-white rounded-xl border border-neutral-200 inline-block mx-auto shadow-sm">
              <img
                src={qrModalData.qrBase64}
                alt="Verification QR"
                className="w-48 h-48 object-contain mx-auto"
              />
            </div>
            <p className="text-xs text-neutral-500">
              Student: <span className="font-bold text-neutral-800 dark:text-neutral-200">{qrModalData.studentName}</span>
            </p>
            <Button size="sm" onClick={() => setQrModalData(null)} className="w-full text-xs">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* SCHEDULE DEFENSE MODAL */}
      {schedulingTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-neutral-200 dark:border-neutral-800 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Schedule Final Project Defense
            </h3>
            <p className="text-xs text-neutral-500">
              Squad: <span className="font-bold">{schedulingTeam.team_name}</span> • Project: {schedulingTeam.project_title}
            </p>
            <form onSubmit={handleScheduleDefense} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Defense Date & Time *
                </label>
                <input
                  required
                  type="datetime-local"
                  value={defenseDate}
                  onChange={(e) => setDefenseDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Venue / Meeting Hall *
                </label>
                <input
                  required
                  type="text"
                  value={defenseVenue}
                  onChange={(e) => setDefenseVenue(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSchedulingTeam(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={actionLoading} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                  {actionLoading ? 'Scheduling...' : 'Confirm Schedule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPOSITE GRADING MODAL */}
      {gradingTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-neutral-200 dark:border-neutral-800 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Dean Final Composite Grading Calculation
            </h3>
            <p className="text-xs text-neutral-500">
              Squad: <span className="font-bold">{gradingTeam.team_name}</span>
            </p>

            <form onSubmit={handleSubmitFinalGrade} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Advisor Score (25%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeInputs.advisor_score}
                    onChange={(e) => setGradeInputs((p) => ({ ...p, advisor_score: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    UIL Score (25%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeInputs.uil_score}
                    onChange={(e) => setGradeInputs((p) => ({ ...p, uil_score: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Documentation (25%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeInputs.documentation_score}
                    onChange={(e) => setGradeInputs((p) => ({ ...p, documentation_score: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Presentation (25%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeInputs.presentation_score}
                    onChange={(e) => setGradeInputs((p) => ({ ...p, presentation_score: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                  />
                </div>
              </div>

              {/* Calculated composite preview */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Composite Total:</span>
                <span className="text-base font-black text-amber-700 dark:text-amber-200">{previewComposite}%</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setGradingTeam(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={actionLoading} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                  {actionLoading ? 'Calculating...' : 'Seal & Submit Final Grade'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
