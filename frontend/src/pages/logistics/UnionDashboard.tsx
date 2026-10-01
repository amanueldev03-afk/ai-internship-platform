import { Utensils } from 'lucide-react'
import MealCardTracker from './MealCardTracker'

export default function UnionDashboard() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0c0c0e] py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 mb-2">
            <Utensils className="w-3.5 h-3.5" />
            Student Union Campus Dining Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Cafeteria Meal Card Tracker & Activation
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Activate electronic cafeteria meal cards for Track 1 in-house interns cleared with Dean cryptographic digital signature.
          </p>
        </div>

        <MealCardTracker />
      </div>
    </div>
  )
}
