import type { ReactNode } from 'react'

export const inputClassName =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 ' +
  'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none ' +
  'bg-white disabled:opacity-60 disabled:cursor-not-allowed'

const errorClassName =
  'w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-gray-900 ' +
  'focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ' +
  'bg-white'

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export function FormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string | undefined
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export function Input({
  id,
  name,
  type = 'text',
  value,
  onChange,
  error,
  disabled,
}: {
  id?: string
  name?: string
  type?: string
  value: string | number
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void
  error?: string | undefined
  disabled?: boolean
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={error ? errorClassName : inputClassName}
    />
  )
}

export function Select({
  id,
  name,
  value,
  onChange,
  error,
  disabled,
  options,
  placeholder,
}: {
  id?: string
  name?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  error?: string | undefined
  disabled?: boolean
  options: Array<{ value: string; label: string }>
  placeholder?: string
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={error ? errorClassName : inputClassName}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export function TextArea({
  id,
  name,
  value,
  onChange,
  rows = 3,
  error,
  disabled,
}: {
  id?: string
  name?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
  error?: string | undefined
  disabled?: boolean
}) {
  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={error ? errorClassName : inputClassName}
    />
  )
}

export function ErrorBanner({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null
  return (
    <div role="alert" className="rounded-lg bg-red-50 p-4 border border-red-200">
      <ul className="list-disc list-inside space-y-1">
        {messages.map((message, idx) => (
          <li key={idx} className="text-sm text-red-700">
            {message}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SuccessBanner({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div role="status" className="rounded-lg bg-green-50 p-4 border border-green-200">
      <p className="text-sm text-green-700">{message}</p>
    </div>
  )
}