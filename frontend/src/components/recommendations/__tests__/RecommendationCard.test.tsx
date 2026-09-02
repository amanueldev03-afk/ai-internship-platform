import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RecommendationCard from '../RecommendationCard'
import * as internshipApi from '@/services/internshipApi'

const mockRecommendation = {
  id: 1,
  match_score: 92,
  explanation: ['Matches your React skill', 'Matches remote preference'],
  internship: {
    id: 1,
    title: 'Frontend Engineer Intern',
    organization_name: 'Tech Corp',
    description: 'Build modern React interfaces.',
    internship_type: 'remote' as const,
    work_type: 'full_time',
    required_skills: ['React', 'TypeScript'],
    application_url: 'https://example.com/apply/1',
    is_verified: true,
    is_expired: false,
    status: 'active',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
}

describe('RecommendationCard - Save/Unsave Toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays Save button when isSaved is false', () => {
    render(
      <MemoryRouter>
        <RecommendationCard recommendation={mockRecommendation} isSaved={false} />
      </MemoryRouter>
    )

    const saveBtn = screen.getByRole('button', { name: /Save/i })
    expect(saveBtn).toBeInTheDocument()
    expect(saveBtn.textContent).toContain('Save')
  })

  it('displays Saved button when isSaved is true', () => {
    render(
      <MemoryRouter>
        <RecommendationCard recommendation={mockRecommendation} isSaved={true} />
      </MemoryRouter>
    )

    const savedBtn = screen.getByRole('button', { name: /Unsave/i })
    expect(savedBtn).toBeInTheDocument()
    expect(savedBtn.textContent).toContain('Saved')
  })

  it('clicking Save calls saveInternship API and toggles to Saved state immediately', async () => {
    const saveSpy = vi.spyOn(internshipApi, 'saveInternship').mockResolvedValueOnce({
      id: 10,
      internship: 1,
      saved: true,
    })
    const onSave = vi.fn()

    render(
      <MemoryRouter>
        <RecommendationCard
          recommendation={mockRecommendation}
          isSaved={false}
          onSave={onSave}
        />
      </MemoryRouter>
    )

    const saveBtn = screen.getByRole('button', { name: /Save/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith(1)
      expect(onSave).toHaveBeenCalledWith(1)
      expect(screen.getByRole('button', { name: /Unsave/i })).toBeInTheDocument()
    })
  })

  it('clicking Unsave calls unsaveInternship API and toggles to Save state immediately', async () => {
    const unsaveSpy = vi.spyOn(internshipApi, 'unsaveInternship').mockResolvedValueOnce({ saved: false })
    const onUnsave = vi.fn()

    render(
      <MemoryRouter>
        <RecommendationCard
          recommendation={mockRecommendation}
          isSaved={true}
          onUnsave={onUnsave}
        />
      </MemoryRouter>
    )

    const savedBtn = screen.getByRole('button', { name: /Unsave/i })
    fireEvent.click(savedBtn)

    await waitFor(() => {
      expect(unsaveSpy).toHaveBeenCalledWith(1)
      expect(onUnsave).toHaveBeenCalledWith(1)
      expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument()
    })
  })

  it('does not falsely toggle state if save API fails', async () => {
    vi.spyOn(internshipApi, 'saveInternship').mockRejectedValueOnce(new Error('Network error'))

    render(
      <MemoryRouter>
        <RecommendationCard recommendation={mockRecommendation} isSaved={false} />
      </MemoryRouter>
    )

    const saveBtn = screen.getByRole('button', { name: /Save/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText('Failed to save internship')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument()
    })
  })

  it('does not falsely toggle state if unsave API fails', async () => {
    vi.spyOn(internshipApi, 'unsaveInternship').mockRejectedValueOnce(new Error('Server error'))

    render(
      <MemoryRouter>
        <RecommendationCard recommendation={mockRecommendation} isSaved={true} />
      </MemoryRouter>
    )

    const unsaveBtn = screen.getByRole('button', { name: /Unsave/i })
    fireEvent.click(unsaveBtn)

    await waitFor(() => {
      expect(screen.getByText('Failed to unsave internship')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Unsave/i })).toBeInTheDocument()
    })
  })
})