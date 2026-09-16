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
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading your preferences...</p>
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
          className="w-4 h-4 text-primary-600 border-neutral-300 dark:border-neutral-700 rounded focus:ring-primary-500 dark:bg-neutral-900"
        />
        <label
          htmlFor="pref-availability-immediately"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer"
        >
          Available immediately
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary inline-flex items-center px-5 py-2.5 rounded-xl shadow-glow text-sm font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
          An availability window that ends before it starts is rejected by the API.
        </span>
      </div>
    </SectionCard>
  )
}