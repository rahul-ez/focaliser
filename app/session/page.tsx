'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFocusSession } from '@/lib/timer/useFocusSession'
import { FocusCountdown } from '@/components/timer/FocusCountdown'
import { BreakStopwatch } from '@/components/timer/BreakStopwatch'
import { SessionEndAlert } from '@/components/timer/SessionEndAlert'

export default function SessionPage() {
  const router = useRouter()
  const {
    sessionId,
    status,
    remainingSeconds,
    elapsedBreakSeconds,
    isCompleted,
    initWorker,
    startBreak,
    resumeSession,
    stopSession,
    completeSession,
    restoreFromBuffer,
  } = useFocusSession()

  const [isInitializing, setIsInitializing] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // Initialize and check buffer on mount
  useEffect(() => {
    initWorker()

    async function checkActiveSession() {
      if (!sessionId) {
        const restored = await restoreFromBuffer()
        if (!restored) {
          router.replace('/')
          return
        }
      }
      setIsInitializing(false)
    }

    checkActiveSession()
  }, [sessionId, initWorker, restoreFromBuffer, router])

  const handleTakeBreak = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      await startBreak()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResumeFocus = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      await resumeSession()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStopSession = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      await stopSession()
      router.replace('/')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSessionEndComplete = async () => {
    await completeSession()
    router.replace('/')
  }

  if (isInitializing) {
    return <div className="w-screen h-screen bg-focus-bg" />
  }

  // 1. Session Complete Alert
  if (isCompleted || remainingSeconds === 0) {
    return <SessionEndAlert onComplete={handleSessionEndComplete} />
  }

  // 2. Break State (Stopwatch counting up in muted red)
  if (status === 'on_break') {
    return (
      <BreakStopwatch
        elapsedBreakSeconds={elapsedBreakSeconds}
        onResumeFocus={handleResumeFocus}
        disabled={isProcessing}
      />
    )
  }

  // 3. Focus State (Countdown in white numerals matching session.png)
  return (
    <FocusCountdown
      remainingSeconds={remainingSeconds}
      onTakeBreak={handleTakeBreak}
      onStopSession={handleStopSession}
      disabled={isProcessing}
    />
  )
}
