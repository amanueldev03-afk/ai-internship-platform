import { Building } from 'lucide-react'
import DormRoomManager from './DormRoomManager'

export default function DormDashboard() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0c0c0e] py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 mb-2">
            <Building className="w-3.5 h-3.5" />
            Dormitory Administration Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Dormitory Allocation & Key Issuance
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Assign blocks and room numbers and register key handovers for Track 1 in-house software house interns.
          </p>
        </div>

        <DormRoomManager />
      </div>
    </div>
  )
}
