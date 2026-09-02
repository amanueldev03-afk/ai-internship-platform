export interface ApplicationUrlValidationResult {
  isValid: boolean
  error: string | null
}

/**
 * Validates an internship's application URL before redirection.
 * Enforces reachability, syntax, and flagging checks.
 */
export function validateApplicationUrl(internship?: {
  application_url?: string | null
  is_flagged?: boolean
  is_expired?: boolean
  status?: string
  url_validation?: {
    application_url_valid?: boolean
    status?: string
    [key: string]: any
  } | null
}): ApplicationUrlValidationResult {
  if (!internship) {
    return {
      isValid: false,
      error: 'Internship details are unavailable.',
    }
  }

  const rawUrl = internship.application_url?.trim()

  if (!rawUrl) {
    return {
      isValid: false,
      error: 'Application URL is missing for this internship.',
    }
  }

  // Syntax and protocol check
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Application URL is malformed or uses an unsupported protocol.',
      }
    }
  } catch {
    return {
      isValid: false,
      error: 'Application URL is invalid or malformed.',
    }
  }

  // Flagged listing check (Task 5.9 / Task 8.2)
  if (internship.is_flagged) {
    return {
      isValid: false,
      error: 'This listing has been flagged for a broken or unreachable application link.',
    }
  }

  // Background URL validation results check
  if (
    internship.url_validation &&
    (internship.url_validation.application_url_valid === false ||
      internship.url_validation.status === 'dead' ||
      internship.url_validation.status === 'unreachable')
  ) {
    return {
      isValid: false,
      error: 'The employer application link is unreachable or dead.',
    }
  }

  // Expired listing check
  if (internship.is_expired || internship.status === 'expired') {
    return {
      isValid: false,
      error: 'The application deadline for this internship has passed.',
    }
  }

  return {
    isValid: true,
    error: null,
  }
}
