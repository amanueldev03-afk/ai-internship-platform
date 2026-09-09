import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getInternshipReviewQueue,
  approveInternship,
  rejectInternship,
  removeInternship,
  type InternshipReviewItem,
} from '@/services/adminApi'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    removed: 'bg-gray-100 text-gray-700',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  )
}

export default function AdminInternshipReview() {
  const navigate = useNavigate()
  const [items, setItems] = useState<InternshipReviewItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [reasonFilter, setReasonFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<InternshipReviewItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number> = { page, page_size: 20 }
      if (search) params.search = search
      if (reasonFilter) params.reason = reasonFilter
      const data = await getInternshipReviewQueue(params as any)
      setItems(data.results)
      setTotalCount(data.count)
    } catch {
      setError('Failed to load review queue.')
    } finally {
      setIsLoading(false)
    }
  }, [page, search, reasonFilter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleApprove = async (id: number) => {
    setActionLoading(id)
    try {
      await approveInternship(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      setTotalCount((prev) => prev - 1)
    } catch {
      setError('Approve failed.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setActionLoading(rejectModal.id)
    try {
      await rejectInternship(rejectModal.id, rejectReason)
      setItems((prev) => prev.filter((item) => item.id !== rejectModal.id))
      setTotalCount((prev) => prev - 1)
      setRejectModal(null)
      setRejectReason('')
    } catch {
      setError('Reject failed.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemove = async (id: number) => {
    setActionLoading(id)
    try {
      await removeInternship(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      setTotalCount((prev) => prev - 1)
    } catch {
      setError('Remove failed.')
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = Math.ceil(totalCount / 20)

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <button onClick={() => navigate('/admin/dashboard')} className="mb-2 text-sm text-indigo-600 hover:text-indigo-500">&larr; Back to Dashboard</button>
          <h1 className="text-2xl font-bold text-slate-900">Internship Review Queue</h1>
          <p className="mt-1 text-sm text-slate-500">{totalCount} items flagged for review</p>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchItems() }} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search internships..."
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Search</button>
          </form>
          <select
            value={reasonFilter}
            onChange={(e) => { setReasonFilter(e.target.value); setPage(1) }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All reasons</option>
            <option value="broken_link">Broken link</option>
            <option value="near_duplicate">Near duplicate</option>
          </select>
        </div>

        {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

        {isLoading ? (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading review queue...</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <p className="text-lg font-medium text-slate-900">All clear!</p>
            <p className="mt-1 text-sm text-slate-500">No internships are currently flagged for review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900 truncate">{item.title}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.organization_name}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      {item.source_name && <span>Source: {item.source_name}</span>}
                      {item.data_source_name && <span>Data Source: {item.data_source_name}</span>}
                    </div>
                    {item.invalid_urls.length > 0 && (
                      <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">
                        Invalid URLs: {item.invalid_urls.join(', ')}
                      </div>
                    )}
                    {item.low_confidence_skills.length > 0 && (
                      <div className="mt-1 rounded bg-yellow-50 p-2 text-xs text-yellow-700">
                        Low-confidence skills: {item.low_confidence_skills.join(', ')}
                      </div>
                    )}
                    {item.pending_duplicate_count > 0 && (
                      <div className="mt-1 rounded bg-orange-50 p-2 text-xs text-orange-700">
                        {item.pending_duplicate_count} pending duplicate flag(s)
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={actionLoading === item.id}
                      className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === item.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setRejectModal(item)}
                      disabled={actionLoading === item.id}
                      className="rounded bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={actionLoading === item.id}
                      className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}

        {rejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRejectModal(null)}>
            <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-slate-900">Reject Internship</h2>
              <p className="mt-1 text-sm text-slate-500">{rejectModal.title}</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason (optional)..."
                className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={3}
              />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setRejectModal(null)} className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
                <button onClick={handleReject} className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">Confirm Reject</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
