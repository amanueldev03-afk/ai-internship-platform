import { useEffect, useState, useCallback } from 'react'
import {
  getMealCardQueue,
  activateMealCard,
  type CampusLogisticsItem,
} from '@/services/logisticsApi'
import {
  CreditCard,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Utensils,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MealCardTracker() {
  const [students, setStudents] = useState<CampusLogisticsItem[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isActivating, setIsActivating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Modal / Inline input state for card activation
  const [cardInputs, setCardInputs] = useState<Record<string, string>>({})

  const fetchQueue = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getMealCardQueue(search)
      setStudents(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch meal card queue'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQueue()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchQueue])

  const handleInputChange = (id: string, value: string) => {
    setCardInputs((prev) => ({ ...prev, [id]: value }))
  }

  const handleGenerateCardNumber = (id: string, studentId: string) => {
    const cleanId = studentId.replace(/[^a-zA-Z0-9]/g, '').slice(-4) || '0001'
    const generated = `MC-2024-${cleanId}-${Math.floor(1000 + Math.random() * 9000)}`
    handleInputChange(id, generated)
  }

  const handleActivate = async (id: string, defaultCardNumber?: string) => {
    const cardNumber = cardInputs[id] || defaultCardNumber
    if (!cardNumber || !cardNumber.trim()) {
      setError('Please provide or generate a valid meal card number.')
      return
    }

    try {
      setIsActivating(id)
      setError(null)
      const updated = await activateMealCard(id, cardNumber.trim())
      setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)))
      setSuccessMessage(`Meal card '${cardNumber}' successfully activated for ${updated.student_name}!`)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Activation failed'
      setError(msg)
    } finally {
      setIsActivating(null)
    }
  }

  // Filter queue by active / pending
  const filteredStudents = students.filter((item) => {
    if (statusFilter === 'pending') return !item.meal_card_active
    if (statusFilter === 'active') return item.meal_card_active
    return true
  })

  // Statistics
  const totalApproved = students.length
  const totalActive = students.filter((s) => s.meal_card_active).length
  const totalPending = students.filter((s) => !s.meal_card_active).length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Utensils className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Student Union Meal Card Tracker
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Paperless campus logistics & dining hall clearance for Track 1 In-House cohorts.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={fetchQueue}
            disabled={isLoading}
            className="flex items-center gap-2 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Dean Approved Queue
              </p>
              <p className="text-3xl font-extrabold mt-1 text-slate-900 dark:text-slate-50">
                {totalApproved}
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Active Meal Cards
              </p>
              <p className="text-3xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
                {totalActive}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Pending Card Issuance
              </p>
              <p className="text-3xl font-extrabold mt-1 text-amber-600 dark:text-amber-400">
                {totalPending}
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          {/* Search by ID/Name */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student ID or name..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Pending ({totalPending})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Active ({totalActive})
            </button>
          </div>
        </div>

        {/* Student Queue Table / Cards */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-3 text-sm text-slate-500">Loading meal clearance queue...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">No students found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {search ? 'Try adjusting your search query.' : 'No students in the Dean-approved queue for this filter.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Dean Sign-Off</th>
                    <th className="py-3.5 px-4">Validity</th>
                    <th className="py-3.5 px-4">Meal Card Number</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                  {filteredStudents.map((item) => {
                    const isPending = !item.meal_card_active
                    const inputValue = cardInputs[item.id] !== undefined ? cardInputs[item.id] : item.meal_card_number

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors">
                        {/* Student details */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {item.student_name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                              {item.student_id_number}
                            </span>
                            <span>• {item.department}</span>
                          </div>
                        </td>

                        {/* Dean Sign-off & Cryptographic signature */}
                        <td className="py-4 px-4">
                          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Signed by Dean</span>
                          </div>
                          {item.dean_signature_hash && (
                            <div
                              className="text-[11px] font-mono text-slate-400 mt-0.5 max-w-[160px] truncate"
                              title={`HMAC-SHA256 Signature: ${item.dean_signature_hash}`}
                            >
                              Hash: {item.dean_signature_hash.slice(0, 14)}...
                            </div>
                          )}
                        </td>

                        {/* Validity dates */}
                        <td className="py-4 px-4 text-xs text-slate-600 dark:text-slate-300">
                          {item.valid_from && item.valid_until ? (
                            <div>
                              <span>{item.valid_from}</span>
                              <span className="mx-1 text-slate-400">to</span>
                              <span>{item.valid_until}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Full Cohort</span>
                          )}
                        </td>

                        {/* Meal card number input / display */}
                        <td className="py-4 px-4">
                          {item.meal_card_active ? (
                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 text-xs">
                              {item.meal_card_number}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => handleInputChange(item.id, e.target.value)}
                                placeholder="MC-2024-XXXX"
                                className="w-36 px-2.5 py-1 text-xs font-mono rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleGenerateCardNumber(item.id, item.student_id_number)}
                                title="Auto-generate Card Number"
                                className="p-1 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Status badge */}
                        <td className="py-4 px-4">
                          {item.meal_card_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3" />
                              Pending Card
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          {isPending ? (
                            <Button
                              size="sm"
                              disabled={isActivating === item.id}
                              onClick={() => handleActivate(item.id, inputValue)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5"
                            >
                              {isActivating === item.id ? (
                                <span className="flex items-center gap-1.5">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Activating...
                                </span>
                              ) : (
                                '1-Click Activate'
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Issued</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
