import { useEffect, useState } from 'react'
import api from '@/services/api'

type HealthStatus = 'checking...' | 'OK' | 'unreachable'

export default function HomePage() {
  const [status, setStatus] = useState<HealthStatus>('checking...')

  useEffect(() => {
    api
      .get('/health/')
      .then(() => setStatus('OK'))
      .catch(() => setStatus('unreachable'))
  }, [])

  const colour =
    status === 'OK'
      ? 'text-green-600'
      : status === 'unreachable'
      ? 'text-red-500'
      : 'text-yellow-500'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-primary-600">
        AI Internship Platform
      </h1>
      <p className="text-gray-500">Frontend ↔ Backend connection check</p>
      <div className="flex items-center gap-2 text-lg font-medium">
        <span className="text-gray-600">Backend /api/health/:</span>
        <span className={colour}>{status}</span>
      </div>
    </div>
  )
}
