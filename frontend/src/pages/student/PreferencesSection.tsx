import { useEffect, useMemo, useState } from 'react'
import * as studentApi from '@/services/studentApi'
import type { StudentPreferences } from '@/services/studentApi'
import { mapApiErrors, firstFieldError, flattenApiErrors } from '@/utils/apiErrors'
import {
  INTERNSHIP_TYPE_LABELS,
  WORK_MODE_LABELS,
  choiceOptions,
} from '@/constants/profileChoices'
import {
  SectionCard,
  FormField,
  Input,
  Select,
  ErrorBanner,
  SuccessBanner,
} from './components/ProfileForm'

const emptyForm = {
  country: '',
  city: '',
  work_mode: '',
  internship_type: '',
  availability_start: '',
  availability_end: '',
  availability_immediately: false,
}

type FormState = typeof emptyForm

export default function PreferencesSection({
  onSaved,
}: {
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<ReturnType<typeof mapApiErrors> | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    studentApi
      .getStudentPreferences()
      .then((data: StudentPreferences) => {
        if (cancelled) return
        setForm({
          country: data.country ?? '',
          city: data.city ?? '',
          work_mode: data.work_mode ?? '',
          internship_type: data.internship_type ?? '',
          availability_start: data.availability_start ?? '',
          availability_end: data.availability_end ?? '',
          availability_immediately: data.availability_immediately ?? false,
        })
      })
      .catch(() => {
        if (!cancelled) {
          setErrors({ fieldErrors: {}, nonFieldErrors: ['Failed to load your preferences. Please try again.'] })
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    const checked = 'checked' in e.target ? e.target.checked : undefined
    const type = 'type' in e.target ? e.target.type : undefined
    const newValue = type === 'checkbox' ? checked : value
    setForm((prev) => ({ ...prev, [name]: newValue }))
    setErrors(null)
    setSuccess(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setErrors(null)
    setSuccess(null)
    try {
      const payload: Record<string, string | boolean | null> = {
        country: form.country,
        city: form.city,
        availability_start: form.availability_start ? form.availability_start : null,
        availability_end: form.availability_end ? form.availability_end : null,
        availability_immediately: form.availability_immediately,
      }
      // Never submit an empty choice code — DRF would reject it with 400.
      if (form.work_mode) payload.work_mode = form.work_mode
      if (form.internship_type) payload.internship_type = form.internship_type

      await studentApi.updateStudentPreferences(payload)
      setSuccess('Internship preferences saved.')
      onSaved()
    } catch (error) {
      setErrors(mapApiErrors(error))
    } finally {
      setIsSaving(false)
    }
  }

  const errorMessage = useMemo(() => (errors ? flattenApiErrors(errors) : []), [errors])

  if (isLoading) {
    return (
      <SectionCard title="Internship Preferences">
        <p className="text-sm text-gray-500">Loading your preferences...</p>
      </SectionCard>
    )
  }

  return (
    <SectionCard
      title="Internship Preferences"
      description="Work mode and internship type come from fixed choice lists. Dates must be YYYY-MM-DD."
    >
      <ErrorBanner messages={errorMessage} />
      <SuccessBanner message={success} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Country" htmlFor="pref-country" error={firstFieldError(errors, 'country')}>
          <Input
            id="pref-country"
            name="country"
            value={form.country}
            onChange={handleChange}
            error={firstFieldError(errors, 'country')}
          />
        </FormField>
        <FormField label="City" htmlFor="pref-city" error={firstFieldError(errors, 'city')}>
          <Input
            id="pref-city"
            name="city"
            value={form.city}
            onChange={handleChange}
            error={firstFieldError(errors, 'city')}
          />
        </FormField>
        <FormField label="Work mode" htmlFor="pref-work-mode" error={firstFieldError(errors, 'work_mode')}>
          <Select
            id="pref-work-mode"
            name="work_mode"
            value={form.work_mode}
            onChange={handleChange}
            placeholder="Select work mode"
            options={choiceOptions(WORK_MODE_LABELS)}
            error={firstFieldError(errors, 'work_mode')}
          />
        </FormField>
        <FormField
          label="Internship type"
          htmlFor="pref-internship-type"
          error={firstFieldError(errors, 'internship_type')}
        >
          <Select
            id="pref-internship-type"
            name="internship_type"
            value={form.internship_type}
            onChange={handleChange}
            placeholder="Select internship type"
            options={choiceOptions(INTERNSHIP_TYPE_LABELS)}
            error={firstFieldError(errors, 'internship_type')}
          />
        </FormField>
        <FormField
          label="Availability start"
          htmlFor="pref-availability-start"
          error={firstFieldError(errors, 'availability_start')}
        >
          <Input
            id="pref-availability-start"
            name="availability_start"
            type="date"
            value={form.availability_start}
            onChange={handleChange}
            error={firstFieldError(errors, 'availability_start')}
          />
        </FormField>
        <FormField
          label="Availability end"
          htmlFor="pref-availability-end"
          error={firstFieldError(errors, 'availability_end')}
        >
          <Input
            id="pref-availability-end"
            name="availability_end"
            type="date"
            value={form.availability_end}
            onChange={handleChange}
            error={firstFieldError(errors, 'availability_end')}
          />
        </FormField>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <input
          id="pref-availability-immediately"
          name="availability_immediately"
          type="checkbox"
          checked={form.availability_immediately}
          onChange={handleChange}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label
          htmlFor="pref-availability-immediately"
          className="text-sm text-gray-700 cursor-pointer"
        >
          Available immediately
        </label>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
        <span className="text-xs text-gray-400">
          An availability window that ends before it starts is rejected by the API.
        </span>
      </div>
    </SectionCard>
  )
}