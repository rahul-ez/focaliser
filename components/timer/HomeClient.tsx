'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DurationPicker } from '@/components/timer/DurationPicker'
import { LabelInput } from '@/components/timer/LabelInput'
import { PlayButton } from '@/components/timer/PlayButton'
import { useFocusSession } from '@/lib/timer/useFocusSession'
import { DEFAULT_DURATION_SECONDS, MIN_SESSION_DURATION_SECONDS } from '@/lib/constants'

interface HomeClientProps {
  initialDuration?: number
}

export function HomeClient({ initialDuration = DEFAULT_DURATION_SECONDS }: HomeClientProps) {
  const router = useRouter()
  const startSession = useFocusSession((state) => state.startSession)

  const [duration, setDuration] = useState<number>(initialDuration)
  const [label, setLabel] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    if (duration < MIN_SESSION_DURATION_SECONDS) {
      setError('Please set a duration of at least 1 minute.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await startSession(duration, label)
      router.push('/session')
    } catch (err: unknown) {
      console.error('[HomeClient:handleStart]', err)
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
    <div className="w-full flex flex-col items-center gap-xl">
      <DurationPicker
        value={duration}
        disabled={isLoading}
        onChange={(newDuration) => {
          setDuration(newDuration)
          if (error && newDuration >= MIN_SESSION_DURATION_SECONDS) {
            setError(null)
          }
        }}
      />

      <LabelInput
        value={label}
        disabled={isLoading}
        onChange={setLabel}
      />

      <div className="flex flex-col items-center gap-sm">
        <PlayButton
          onClick={handleStart}
          isLoading={isLoading}
          disabled={duration < MIN_SESSION_DURATION_SECONDS || isLoading}
        />
        {error && (
          <p className="text-error text-sm font-medium text-center max-w-sm">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
