import { useEffect, useMemo, useRef, useState } from 'react'
import * as studentApi from '@/services/studentApi'
import type { CVStatus, ResumeStatus, StudentProfile } from '@/services/studentApi'
import { mapApiErrors, flattenApiErrors } from '@/utils/apiErrors'
import { SectionCard, ErrorBanner, SuccessBanner, inputClassName } from './components/ProfileForm'
import ExtractedCVContent, { toParsedCVData } from './components/ExtractedCVContent'
import ResumePreview from './components/ResumePreview'

const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 20
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

type UploadPhase = 'idle' | 'uploading' | 'polling' | 'done'

function statusBadgeClasses(status: string | null | undefined): string {
  if (status === 'COMPLETED') return 'bg-green-100 text-green-800'
  if (status === 'FAILED') return 'bg-red-100 text-red-800'
  if (status === 'PROCESSING' || status === 'PENDING') return 'bg-amber-100 text-amber-800'
  return 'bg-gray-100 text-gray-800'
}

export default function ResumeSection({
  profile,
  onSaved,
}: {
  profile: StudentProfile | null
  onSaved: () => void
}) {
  const [status, setStatus] = useState<ResumeStatus | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<UploadPhase>('idle')
  const [cvStatus, setCvStatus] = useState<CVStatus | null>(null)
  const [errors, setErrors] = useState<ReturnType<typeof mapApiErrors> | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const timerRef = useRef<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    let cancelled = false
    studentApi
      .getResumeStatus()
      .then((data) => {
        if (!cancelled) setStatus(data)
      })
      .catch(() => {
        // If the user doesn't have a resume yet or initial request fails, default gracefully
        if (!cancelled) {
          setStatus({
            has_resume: false,
            resume_url: null,
            cv_id: null,
            processing_status: null,
            processing_error: null,
          })
        }
      })
    return () => {
      cancelled = true
      clearTimer()
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null
    setFile(chosen)
    setErrors(null)
    setSuccess(null)

    if (chosen) {
      if (chosen.size > MAX_FILE_SIZE_BYTES) {
        setErrors({
          fieldErrors: { file: ['File size exceeds 5 MB limit. Please select a smaller file.'] },
          nonFieldErrors: [],
        })
      } else if (!/\.(pdf|docx)$/i.test(chosen.name)) {
        setErrors({
          fieldErrors: { file: ['Only PDF (.pdf) and Microsoft Word (.docx) files are supported.'] },
          nonFieldErrors: [],
        })
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrors({
        fieldErrors: { file: ['File size exceeds 5 MB limit. Please select a smaller file.'] },
        nonFieldErrors: [],
      })
      return
    }

    if (!/\.(pdf|docx)$/i.test(file.name)) {
      setErrors({
        fieldErrors: { file: ['Only PDF (.pdf) and Microsoft Word (.docx) files are supported.'] },
        nonFieldErrors: [],
      })
      return
    }

    setErrors(null)
    setSuccess(null)
    setPhase('uploading')

    try {
      const uploadResult = await studentApi.uploadResume(file)
      setSuccess('Resume uploaded. Processing in background.')
      setStatus((prev) => ({
        has_resume: true,
        resume_url: uploadResult.resume_url || prev?.resume_url || null,
        cv_id: uploadResult.cv_id || prev?.cv_id || null,
        processing_status: uploadResult.processing_status || 'PENDING',
        processing_error: null,
      }))

      const poll = async (attempt: number) => {
        try {
          const cv = await studentApi.getCVStatus()
          setCvStatus(cv)
          setStatus((prev) => ({
            has_resume: true,
            resume_url: prev?.resume_url || null,
            cv_id: cv.cv_id || prev?.cv_id || null,
            processing_status: cv.processing_status,
            processing_error: cv.processing_error,
          }))

          if (cv.processing_status === 'PENDING' || cv.processing_status === 'PROCESSING') {
            if (attempt < MAX_POLLS) {
              timerRef.current = window.setTimeout(() => poll(attempt + 1), POLL_INTERVAL_MS)
              setPhase('polling')
              return
            }
          }
        } catch {
          // Continue if single poll fails
        }
        setPhase('done')
        onSaved()
      }

      await poll(0)
    } catch (error) {
      setErrors(mapApiErrors(error))
      setPhase('idle')
    }
  }

  useEffect(() => {
    return clearTimer
  }, [])

  const parsed = useMemo(
    () => toParsedCVData(cvStatus, profile?.cv_data),
    [cvStatus, profile]
  )

  const errorMessage = useMemo(() => (errors ? flattenApiErrors(errors) : []), [errors])

  const isBusy = phase === 'uploading' || phase === 'polling'
  const statusCode = cvStatus?.processing_status ?? status?.processing_status
  const haveResume =
    cvStatus !== null || status?.has_resume === true || Boolean(profile?.resume)
  const resumeUrl = status?.resume_url ?? profile?.resume
  const resumeFileName = useMemo(() => {
    if (resumeUrl) return resumeUrl.split('/').pop()?.split('?')[0] || null
    return null
  }, [resumeUrl])

  return (
    <SectionCard
      title="Resume / CV"
      description="Upload a PDF or DOCX (max 5 MB). The API content-sniffs the file — only genuine PDFs and DOCX files are accepted."
    >
      <ErrorBanner messages={errorMessage} />
      <SuccessBanner message={success} />

      {/* Current status */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClasses(statusCode)}`}
        >
          {haveResume
            ? statusCode === 'COMPLETED'
              ? 'Processed'
              : statusCode || 'Uploaded'
            : 'No Resume Uploaded'}
        </span>
        {status?.processing_error && (
          <span className="text-xs text-red-600">{status.processing_error}</span>
        )}
        {resumeUrl && (
          <button
            type="button"
            onClick={() => setPreviewOpen((v) => !v)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center gap-1"
            aria-expanded={previewOpen}
          >
            {previewOpen ? 'Hide resume preview' : 'View resume ↗'}
          </button>
        )}
        {phase === 'uploading' && (
          <span className="text-xs text-gray-500">Uploading resume...</span>
        )}
        {phase === 'polling' && (
          <span className="text-xs text-indigo-600 font-medium animate-pulse">
            Analyzing resume with AI in the background...
          </span>
        )}
      </div>

      {/* Uploader */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center">
        <input
          type="file"
          aria-label="Resume file input"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          disabled={isBusy}
          className={`${inputClassName} file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700`}
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || isBusy}
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isBusy ? 'Uploading...' : 'Upload Resume'}
        </button>
      </div>

      {file && (
        <p className="text-xs text-gray-500">
          {file.name} — {Math.ceil(file.size / 1024)} KB selected.
        </p>
      )}

      {resumeUrl && previewOpen && (
        <div className="mt-4">
          <ResumePreview url={resumeUrl} fileName={file?.name || resumeFileName} />
        </div>
      )}

      {/* Extracted data once processing completes */}
      {statusCode === 'FAILED' && status?.processing_error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">
            CV processing failed: {status.processing_error}. Please re-upload your CV.
          </p>
        </div>
      )}

      {parsed.hasContent && (
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-3">Parsed CV Data</h3>
          <ExtractedCVContent cvStatus={cvStatus} cvData={profile?.cv_data} />
        </div>
      )}
    </SectionCard>
  )
}