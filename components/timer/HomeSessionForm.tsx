'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'
import { useFocusSession } from '@/lib/timer/useFocusSession'
import {
  DEFAULT_DURATION_SECONDS,
  MAX_SESSION_DURATION_SECONDS,
  MIN_SESSION_DURATION_SECONDS,
} from '@/lib/constants'

interface HomeSessionFormProps {
  initialDuration?: number
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
  }

  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function parseDuration(value: string): number | null {
  const parts = value.trim().split(':')
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) {
    return null
  }

  const numbers = parts.map(Number)
  if (parts.length === 2) {
    const [minutes, seconds] = numbers
    if (seconds > 59) return null
    return minutes * 60 + seconds
  }

  const [hours, minutes, seconds] = numbers
  if (minutes > 59 || seconds > 59) return null
  return hours * 3600 + minutes * 60 + seconds
}

export function HomeSessionForm({
  initialDuration = DEFAULT_DURATION_SECONDS,
}: HomeSessionFormProps) {
  const router = useRouter()
  const startSession = useFocusSession((state) => state.startSession)
  const [durationValue, setDurationValue] = useState(formatDuration(initialDuration))
  const [label, setLabel] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const duration = parseDuration(durationValue)

    if (
      duration === null ||
      duration < MIN_SESSION_DURATION_SECONDS ||
      duration > MAX_SESSION_DURATION_SECONDS
    ) {
      setError('Enter a duration between 1 minute and 12 hours.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await startSession(duration, label.trim() || null)
      router.push('/session')
    } catch (err: unknown) {
      console.error('[HomeSessionForm:handleStart]', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to start session. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleStart}
      className="flex items-center gap-lg w-full max-w-2xl mx-auto flex-wrap justify-center"
    >
      <div className="flex flex-col items-center">
        <input
          type="text"
          inputMode="numeric"
          aria-label="Session duration"
          value={durationValue}
          onChange={(event) => {
            setDurationValue(event.target.value)
            if (error) setError(null)
          }}
          placeholder="25:00"
          disabled={isLoading}
          className="font-mono tabular-nums text-2xl text-text-primary bg-transparent border-0 border-b border-border text-center w-24 py-xs placeholder:text-text-muted focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
        />
        {error && <p className="text-error text-xs mt-xs text-center">{error}</p>}
      </div>
      <input
        type="text"
        aria-label="Session label"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        placeholder="What are you focusing on?"
        disabled={isLoading}
        className="font-sans text-base text-text-primary bg-transparent border-0 border-b border-border flex-1 min-w-[220px] py-xs placeholder:text-text-muted focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
      />
      <button
        type="submit"
        aria-label="Start session"
        disabled={isLoading}
        className="shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-all hover:bg-primary-dark active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:bg-primary-muted disabled:cursor-not-allowed"
      >
        <Play size={18} strokeWidth={2} fill="currentColor" />
      </button>
    </form>
  )
}
