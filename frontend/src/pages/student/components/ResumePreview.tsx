import { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'

type ResumePreviewProps = {
  url: string
  fileName?: string | null
}

function getFileType(url: string, fileName?: string | null): 'pdf' | 'docx' | 'image' | 'other' {
  // Inspect the server-provided URL first — it always carries the real file
  // extension regardless of any client-side display-name fallback (e.g. the
  // generic "Resume.pdf" passed in after a page reload). The display filename
  // is only consulted as a secondary hint when the URL gives no signal.
  const candidates = [url, fileName]
  for (const candidate of candidates) {
    if (!candidate) continue
    const target = candidate.toLowerCase()
    if (/\.pdf(\?|$|#)/i.test(target)) return 'pdf'
    if (/\.(docx|doc)(\?|$|#)/i.test(target)) return 'docx'
    if (/\.(png|jpe?g|webp|svg)(\?|$|#)/i.test(target)) return 'image'
  }
  return 'other'
}

export default function ResumePreview({ url, fileName }: ResumePreviewProps) {
  const fileType = getFileType(url, fileName)
  const displayName = fileName || url.split('/').pop() || 'Resume'
  const docxContainerRef = useRef<HTMLDivElement>(null)
  const [docxLoading, setDocxLoading] = useState<boolean>(false)
  const [docxError, setDocxError] = useState<string | null>(null)

  useEffect(() => {
    if (fileType === 'docx' && docxContainerRef.current && url) {
      setDocxLoading(true)
      setDocxError(null)
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to load document (${res.status})`)
          return res.blob()
        })
        .then(async (blob) => {
          if (docxContainerRef.current) {
            docxContainerRef.current.innerHTML = ''
            await renderAsync(blob, docxContainerRef.current, undefined, {
              inWrapper: false,
              ignoreWidth: true,
              breakPages: true,
            })
          }
        })
        .catch((err) => {
          console.error('Docx rendering error:', err)
          setDocxError('Unable to render DOCX inline. Please download to view.')
        })
        .finally(() => {
          setDocxLoading(false)
        })
    }
  }, [fileType, url])

  if (!url) return null

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm mt-4">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800 truncate">
          <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="truncate">{displayName}</span>
          <span className="text-xs uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
            {fileType.toUpperCase()}
          </span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Open / Download File ↗
        </a>
      </div>

      <div
        id="resume-preview-container"
        className="w-full bg-gray-100 flex flex-col items-center justify-center p-3 overflow-auto"
        style={{ minHeight: '500px', maxHeight: '80vh' }}
      >
        {fileType === 'pdf' && (
          <embed
            src={url}
            title={displayName}
            type="application/pdf"
            className="w-full rounded-lg bg-white shadow-inner"
            style={{ height: '75vh', border: 0 }}
          />
        )}

        {fileType === 'image' && (
          <div className="flex justify-center items-center p-4">
            <img
              src={url}
              alt={displayName}
              className="max-h-[70vh] w-auto rounded-lg shadow object-contain bg-white"
            />
          </div>
        )}

        {fileType === 'docx' && (
          <div className="w-full bg-white p-6 rounded-lg shadow min-h-[500px] overflow-auto">
            {docxLoading && (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-sm text-gray-500">Rendering Word Document...</p>
              </div>
            )}
            {docxError && (
              <div className="text-center py-10">
                <p className="text-sm text-red-600 mb-3">{docxError}</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
                >
                  Download DOCX to View ↗
                </a>
              </div>
            )}
            <div ref={docxContainerRef} className="docx-render-wrapper" />
          </div>
        )}

        {fileType === 'other' && (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-sm"
            >
              Download or Open Document ↗
            </a>
          </div>
        )}
      </div>
    </div>
  )
}