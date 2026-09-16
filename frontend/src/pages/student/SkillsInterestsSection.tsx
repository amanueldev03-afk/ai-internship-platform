import { useCallback, useEffect, useMemo, useState } from 'react'
import * as studentApi from '@/services/studentApi'
import type { CareerInterest, Skill } from '@/services/studentApi'
import { mapApiErrors, flattenApiErrors } from '@/utils/apiErrors'
import { SectionCard, ErrorBanner, SuccessBanner, inputClassName } from './components/ProfileForm'

export default function SkillsInterestsSection({
  onSaved,
}: {
  onSaved: () => void
}) {
  const [mySkills, setMySkills] = useState<Skill[]>([])
  const [myInterests, setMyInterests] = useState<CareerInterest[]>([])
  const [skillChoices, setSkillChoices] = useState<Skill[]>([])
  const [interestChoices, setInterestChoices] = useState<CareerInterest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSkillId, setSelectedSkillId] = useState('')
  const [selectedInterestId, setSelectedInterestId] = useState('')
  const [pendingSkillId, setPendingSkillId] = useState<number | null>(null)
  const [pendingInterestId, setPendingInterestId] = useState<number | null>(null)
  const [errors, setErrors] = useState<ReturnType<typeof mapApiErrors> | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [skills, interests, skillCat, interestCat] = await Promise.all([
      studentApi.getStudentSkills(),
      studentApi.getStudentInterests(),
      studentApi.getSkillChoices(),
      studentApi.getInterestChoices(),
    ])
    setMySkills(skills)
    setMyInterests(interests)
    setSkillChoices(skillCat)
    setInterestChoices(interestCat)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refresh().catch(() => {
      setIsLoading(false)
      setErrors({
        fieldErrors: {},
        nonFieldErrors: [
          'Failed to load skills and interests from the catalogue. Please try again.',
        ],
      })
    })
  }, [refresh])

  const addableSkills = useMemo(
    () => skillChoices.filter((s) => !mySkills.some((mine) => mine.id === s.id)),
    [skillChoices, mySkills]
  )
  const addableInterests = useMemo(
    () => interestChoices.filter((i) => !myInterests.some((mine) => mine.id === i.id)),
    [interestChoices, myInterests]
  )

  const guard = async (
    action: () => Promise<void>
  ): Promise<boolean> => {
    setErrors(null)
    setSuccess(null)
    try {
      await action()
      setSuccess('Saved.')
      onSaved()
      return true
    } catch (error) {
      setErrors(mapApiErrors(error))
      return false
    }
  }

  const handleAddSkill = async () => {
    if (!selectedSkillId) return
    const skillId = Number(selectedSkillId)
    setPendingSkillId(skillId)
    await guard(async () => {
      await studentApi.addStudentSkill(skillId)
      await studentApi.getStudentSkills().then(setMySkills)
    })
    setPendingSkillId(null)
    setSelectedSkillId('')
  }

  const handleRemoveSkill = async (skillId: number) => {
    setPendingSkillId(skillId)
    await guard(async () => {
      await studentApi.removeStudentSkill(skillId)
      await studentApi.getStudentSkills().then(setMySkills)
    })
    setPendingSkillId(null)
  }

  const handleAddInterest = async () => {
    if (!selectedInterestId) return
    const interestId = Number(selectedInterestId)
    setPendingInterestId(interestId)
    await guard(async () => {
      await studentApi.addStudentInterest(interestId)
      await studentApi.getStudentInterests().then(setMyInterests)
    })
    setPendingInterestId(null)
    setSelectedInterestId('')
  }

  const handleRemoveInterest = async (interestId: number) => {
    setPendingInterestId(interestId)
    await guard(async () => {
      await studentApi.removeStudentInterest(interestId)
      await studentApi.getStudentInterests().then(setMyInterests)
    })
    setPendingInterestId(null)
  }

  const errorMessage = useMemo(() => (errors ? flattenApiErrors(errors) : []), [errors])

  if (isLoading) {
    return (
      <SectionCard title="Skills & Interests">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading catalogue...</p>
      </SectionCard>
    )
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Skills & Technologies"
        description="Add skills from the Task 1.3 catalogue — free-text skills are rejected by the API."
      >
        <ErrorBanner messages={errorMessage} />
        <SuccessBanner message={success} />

        <div className="flex flex-wrap gap-2.5">
          {mySkills.length === 0 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No skills added yet.</p>
          )}
          {mySkills.map((skill) => (
            <span
              key={skill.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold rounded-xl text-sm border border-primary-200/60 dark:border-primary-800/60 shadow-xs"
            >
              {skill.name}
              <button
                type="button"
                aria-label={`Remove skill ${skill.name}`}
                disabled={pendingSkillId === skill.id}
                onClick={() => handleRemoveSkill(skill.id)}
                className="text-primary-400 hover:text-error-600 dark:hover:text-error-400 disabled:opacity-50 transition-colors ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <select
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            className={inputClassName}
            disabled={addableSkills.length === 0}
            aria-label="Select skill from catalogue"
          >
            <option value="">
              {addableSkills.length === 0 ? 'All catalogue skills added' : 'Select a skill...'}
            </option>
            {addableSkills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
                {skill.category ? ` (${skill.category})` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddSkill}
            disabled={!selectedSkillId}
            className="btn-primary shrink-0 px-5 py-2.5 rounded-xl shadow-glow text-sm font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Add Skill
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Career Interests"
        description="Pick interests from the Task 1.3 catalogue — free-text interests are rejected by the API."
      >
        <div className="flex flex-wrap gap-2.5">
          {myInterests.length === 0 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No career interests added yet.</p>
          )}
          {myInterests.map((interest) => (
            <span
              key={interest.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold rounded-xl text-sm border border-teal-200/60 dark:border-teal-800/60 shadow-xs"
            >
              {interest.name}
              <button
                type="button"
                aria-label={`Remove interest ${interest.name}`}
                disabled={pendingInterestId === interest.id}
                onClick={() => handleRemoveInterest(interest.id)}
                className="text-teal-400 hover:text-error-600 dark:hover:text-error-400 disabled:opacity-50 transition-colors ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <select
            value={selectedInterestId}
            onChange={(e) => setSelectedInterestId(e.target.value)}
            className={inputClassName}
            disabled={addableInterests.length === 0}
            aria-label="Select interest from catalogue"
          >
            <option value="">
              {addableInterests.length === 0 ? 'All catalogue interests added' : 'Select an interest...'}
            </option>
            {addableInterests.map((interest) => (
              <option key={interest.id} value={interest.id}>
                {interest.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddInterest}
            disabled={!selectedInterestId}
            className="btn-accent shrink-0 px-5 py-2.5 rounded-xl shadow-glow text-sm font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Add Interest
          </button>
        </div>
      </SectionCard>
    </div>
  )
}