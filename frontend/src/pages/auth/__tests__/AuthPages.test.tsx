import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import authReducer, { type AuthState } from '@/features/auth/authSlice'
import LoginPage from '../LoginPage'
import RegisterPage from '../RegisterPage'
import VerifyEmailPage from '../VerifyEmailPage'
import ForgotPasswordPage from '../ForgotPasswordPage'
import ResetPasswordPage from '../ResetPasswordPage'
import * as authApi from '@/services/authApi'

function createStore(authState: Partial<AuthState> = {}) {
  const defaultState: AuthState = {
    accessToken: null,
    refreshToken: null,
    role: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: true,
    error: null,
    ...authState,
  }

  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: defaultState,
    },
  })
}

describe('Authentication Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('LoginPage', () => {
    it('renders login form with email, password fields and sign in button', () => {
      const store = createStore()
      render(
        <Provider store={store}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </Provider>
      )

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
    })

    it('shows validation error when submitting empty fields', async () => {
      const store = createStore()
      render(
        <Provider store={store}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </Provider>
      )

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
      expect(await screen.findByText(/email address is required/i)).toBeInTheDocument()
    })

    it('displays unverified account alert when backend returns email verification requirement', () => {
      const store = createStore({
        error: 'Please verify your email before logging in.',
      })
      render(
        <Provider store={store}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </Provider>
      )

      expect(screen.getByText(/email verification required/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /need a new verification link/i })).toBeInTheDocument()
    })

    it('submits valid credentials and triggers login action', async () => {
      const store = createStore()
      const user = userEvent.setup()

      vi.spyOn(authApi, 'login').mockResolvedValueOnce({
        access: 'mock-access-token',
        refresh: 'mock-refresh-token',
        user: { id: 1, email: 'student@example.com', username: 'student1', role: 'student' },
      })

      render(
        <Provider store={store}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </Provider>
      )

      await user.type(screen.getByLabelText(/email address/i), 'student@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'SecurePass123!')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          email: 'student@example.com',
          password: 'SecurePass123!',
        })
      })
    })
  })

  describe('RegisterPage', () => {
    it('renders registration form fields', () => {
      const store = createStore()
      render(
        <Provider store={store}>
          <MemoryRouter>
            <RegisterPage />
          </MemoryRouter>
        </Provider>
      )

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('validates password mismatch on client side', async () => {
      const store = createStore()
      const user = userEvent.setup()

      render(
        <Provider store={store}>
          <MemoryRouter>
            <RegisterPage />
          </MemoryRouter>
        </Provider>
      )

      await user.type(screen.getByLabelText(/full name/i), 'Jane Doe')
      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'Password123!')
      await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPassword!')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    })

    it('displays success state after registration succeeds', async () => {
      const store = createStore()
      const user = userEvent.setup()

      vi.spyOn(authApi, 'register').mockResolvedValueOnce({
        message: 'Registration successful',
        user: { id: 1, email: 'student@example.com', username: 'student1', full_name: 'Student User' },
      })

      render(
        <Provider store={store}>
          <MemoryRouter>
            <RegisterPage />
          </MemoryRouter>
        </Provider>
      )

      await user.type(screen.getByLabelText(/full name/i), 'Student User')
      await user.type(screen.getByLabelText(/email address/i), 'student@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'SecurePass123!')
      await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(await screen.findByText(/registration successful!/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument()
    })
  })

  describe('VerifyEmailPage', () => {
    it('verifies token automatically from search parameters and shows success', async () => {
      vi.spyOn(authApi, 'verifyEmail').mockResolvedValueOnce({
        message: 'Email verified successfully.',
      })

      render(
        <MemoryRouter initialEntries={['/verify-email?uid=MQ&token=test-token-123']}>
          <Routes>
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Routes>
        </MemoryRouter>
      )

      expect(await screen.findByText(/email verified!/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /continue to login/i })).toBeInTheDocument()
      expect(authApi.verifyEmail).toHaveBeenCalledWith('MQ', 'test-token-123')
    })

    it('shows resend form and error message on verification failure', async () => {
      vi.spyOn(authApi, 'verifyEmail').mockRejectedValueOnce({
        response: {
          data: { detail: 'Invalid or expired verification token.' },
          status: 400,
        },
      })

      render(
        <MemoryRouter initialEntries={['/verify-email?uid=MQ&token=expired-token']}>
          <Routes>
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Routes>
        </MemoryRouter>
      )

      expect(await screen.findByText(/verification failed/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send verification email/i })).toBeInTheDocument()
    })

    it('handles resending verification email successfully', async () => {
      const user = userEvent.setup()
      vi.spyOn(authApi, 'resendVerification').mockResolvedValueOnce({
        message: 'A new verification email has been sent.',
      })

      render(
        <MemoryRouter initialEntries={['/verify-email']}>
          <Routes>
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Routes>
        </MemoryRouter>
      )

      await user.type(screen.getByLabelText(/email address/i), 'student@example.com')
      await user.click(screen.getByRole('button', { name: /send verification email/i }))

      expect(await screen.findByText(/a new verification link has been sent/i)).toBeInTheDocument()
      expect(authApi.resendVerification).toHaveBeenCalledWith('student@example.com')
    })
  })

  describe('ForgotPasswordPage', () => {
    it('submits email and displays generic success message', async () => {
      const user = userEvent.setup()
      vi.spyOn(authApi, 'forgotPassword').mockResolvedValueOnce({
        message: 'If an account exists with this email, a password reset link has been sent.',
      })

      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      )

      await user.type(screen.getByLabelText(/email address/i), 'student@example.com')
      await user.click(screen.getByRole('button', { name: /send password reset link/i }))

      expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
      expect(authApi.forgotPassword).toHaveBeenCalledWith('student@example.com')
    })
  })

  describe('ResetPasswordPage', () => {
    it('shows invalid link warning when uid or token is missing', () => {
      render(
        <MemoryRouter initialEntries={['/reset-password']}>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /request new reset link/i })).toBeInTheDocument()
    })

    it('submits new password with token and shows success message', async () => {
      const user = userEvent.setup()
      vi.spyOn(authApi, 'resetPassword').mockResolvedValueOnce({
        message: 'Password reset successfully.',
      })

      render(
        <MemoryRouter initialEntries={['/reset-password?uid=MQ&token=reset-token-456']}>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </MemoryRouter>
      )

      await user.type(screen.getByLabelText(/^new password/i), 'NewStrongPassword123!')
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewStrongPassword123!')
      await user.click(screen.getByRole('button', { name: /set new password/i }))

      expect(await screen.findByText(/password reset successful/i)).toBeInTheDocument()
      expect(authApi.resetPassword).toHaveBeenCalledWith(
        'MQ',
        'reset-token-456',
        'NewStrongPassword123!',
        'NewStrongPassword123!'
      )
    })
  })
})
