import { useEffect, useMemo, useState } from 'react'
import * as studentApi from '@/services/studentApi'
import * as authApi from '@/services/authApi'
import type { User } from '@/types'
import {
  mapApiErrors,
  firstFieldError,
  flattenApiErrors,
} from '@/utils/apiErrors'
import {
  CURRENT_YEAR_LABELS,
  EDUCATION_LEVEL_LABELS,
  FIELD_OF_STUDY_LABELS,
  choiceOptions,
} from '@/constants/profileChoices'
import {
  SectionCard,
  FormField,
  Input,
  Select,
  TextArea,
  ErrorBanner,
  SuccessBanner,
} from './components/ProfileForm'

const emptyForm = {
  phone: '',
  country: '',
  city: '',
  date_of_birth: '',
  bio: '',
  education_level: '',
  current_year: '',
  field_of_study: '',
  university: '',
}

type FormState = typeof emptyForm

export default function PersonalEducationSection({
  onSaved,
}: {
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [errors, setErrors] = useState<ReturnType<typeof mapApiErrors> | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      studentApi.getStudentMe(),
      authApi.getCurrentUser(),
    ])
      .then(([studentData, userData]) => {
        if (cancelled) return
        setForm({
          phone: studentData.phone ?? '',
          country: studentData.country ?? '',
          city: studentData.city ?? '',
          date_of_birth: studentData.date_of_birth ?? '',
          bio: studentData.bio ?? '',
          education_level: studentData.education_level ?? '',
          current_year: studentData.current_year ?? '',
          field_of_study: studentData.field_of_study ?? '',
          university: studentData.university ?? '',
        })
        setUser(userData)
      })
      .catch(() => {
        if (!cancelled) setErrors({ fieldErrors: {}, nonFieldErrors: ['Failed to load your profile. Please try again.'] })
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors(null)
    setSuccess(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setErrors(null)
    setSuccess(null)
    try {
      await studentApi.updateStudentMe({
        phone: form.phone,
        country: form.country,
        city: form.city,
        date_of_birth: form.date_of_birth ? form.date_of_birth : null,
        bio: form.bio,
        education_level: form.education_level,
        current_year: form.current_year,
        field_of_study: form.field_of_study,
        university: form.university,
      })
      setSuccess('Personal and education details saved.')
      onSaved()
    } catch (error) {
      setErrors(mapApiErrors(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setErrors({ fieldErrors: {}, nonFieldErrors: ['Profile photo must be a JPEG, PNG, GIF, or WebP image.'] })
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setErrors({ fieldErrors: {}, nonFieldErrors: ['Profile photo must be less than 5MB.'] })
      return
    }

    setIsUploadingPhoto(true)
    setErrors(null)
    setSuccess(null)
    try {
      const updatedUser = await authApi.updateUser({ profile_photo: file })
      setUser(updatedUser)
      setSuccess('Profile photo updated successfully.')
      onSaved()
    } catch (error) {
      console.error('Profile photo upload error:', error)
      setErrors(mapApiErrors(error))
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // Helper to get full URL for profile photo
  const getProfilePhotoUrl = (user: User | null) => {
    // Use the full URL from backend if available
    if (user?.profile_photo_url) {
      return user.profile_photo_url
    }
    // Fallback to constructing URL from relative path
    if (user?.profile_photo) {
      if (user.profile_photo.startsWith('http://') || user.profile_photo.startsWith('https://')) {
        return user.profile_photo
      }
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      const baseUrl = apiBaseUrl.replace('/api', '')
      return `${baseUrl}/media/${user.profile_photo}`
    }
    return null
  }

  const errorMessage = useMemo(() => (errors ? flattenApiErrors(errors) : []), [errors])

  if (isLoading) {
    return (
      <SectionCard title="Personal & Education">
        <p className="text-sm text-gray-500">Loading your details...</p>
      </SectionCard>
    )
  }

  return (
    <SectionCard
      title="Personal & Education"
      description="These fields power the AI matching engine. Education choices are fixed lists — pick a canonical value."
    >
      <ErrorBanner messages={errorMessage} />
      <SuccessBanner message={success} />

      {/* Profile Photo Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
        <div className="flex items-center gap-4">
          {getProfilePhotoUrl(user) ? (
            <img
              src={getProfilePhotoUrl(user)}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
              <span className="text-gray-400 text-2xl">?</span>
            </div>
          )}
          <div>
            <input
              type="file"
              id="profile-photo"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handlePhotoUpload}
              disabled={isUploadingPhoto}
              className="hidden"
            />
            <label
              htmlFor="profile-photo"
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                isUploadingPhoto
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isUploadingPhoto ? 'Uploading...' : user?.profile_photo ? 'Change Photo' : 'Upload Photo'}
            </label>
            <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF, or WebP (max 5MB)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Phone" htmlFor="me-phone" error={firstFieldError(errors, 'phone')}>
          <Input
            id="me-phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            error={firstFieldError(errors, 'phone')}
          />
        </FormField>
        <FormField label="Country" htmlFor="me-country" error={firstFieldError(errors, 'country')}>
          <Input
            id="me-country"
            name="country"
            value={form.country}
            onChange={handleChange}
            error={firstFieldError(errors, 'country')}
          />
        </FormField>
        <FormField label="City" htmlFor="me-city" error={firstFieldError(errors, 'city')}>
          <Input
            id="me-city"
            name="city"
            value={form.city}
            onChange={handleChange}
            error={firstFieldError(errors, 'city')}
          />
        </FormField>
        <FormField label="Date of birth" htmlFor="me-dob" error={firstFieldError(errors, 'date_of_birth')}>
          <Input
            id="me-dob"
            name="date_of_birth"
            type="date"
            value={form.date_of_birth}
            onChange={handleChange}
            error={firstFieldError(errors, 'date_of_birth')}
          />
        </FormField>
        <FormField label="Education level" htmlFor="me-edu-level" error={firstFieldError(errors, 'education_level')}>
          <Select
            id="me-edu-level"
            name="education_level"
            value={form.education_level}
            onChange={handleChange}
            placeholder="Select education level"
            options={choiceOptions(EDUCATION_LEVEL_LABELS)}
            error={firstFieldError(errors, 'education_level')}
          />
        </FormField>
        <FormField label="Current year" htmlFor="me-current-year" error={firstFieldError(errors, 'current_year')}>
          <Select
            id="me-current-year"
            name="current_year"
            value={form.current_year}
            onChange={handleChange}
            placeholder="Select current year"
            options={choiceOptions(CURRENT_YEAR_LABELS)}
            error={firstFieldError(errors, 'current_year')}
          />
        </FormField>
        <FormField label="Field of study" htmlFor="me-field" error={firstFieldError(errors, 'field_of_study')}>
          <Select
            id="me-field"
            name="field_of_study"
            value={form.field_of_study}
            onChange={handleChange}
            placeholder="Select field of study"
            options={choiceOptions(FIELD_OF_STUDY_LABELS)}
            error={firstFieldError(errors, 'field_of_study')}
          />
        </FormField>
        <FormField label="University" htmlFor="me-university" error={firstFieldError(errors, 'university')}>
          <Input
            id="me-university"
            name="university"
            value={form.university}
            onChange={handleChange}
            error={firstFieldError(errors, 'university')}
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Bio" htmlFor="me-bio" error={firstFieldError(errors, 'bio')}>
            <TextArea
              id="me-bio"
              name="bio"
              rows={3}
              value={form.bio}
              onChange={handleChange}
              error={firstFieldError(errors, 'bio')}
            />
          </FormField>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <span className="text-xs text-gray-400">Updates your profile instantly.</span>
      </div>
    </SectionCard>
  )
}