import { create } from 'zustand'

export type SessionStatus = 'idle' | 'active' | 'on_break' | 'completed' | 'abandoned'

export interface FocusSessionState {
  sessionId: string | null
  status: SessionStatus
  remainingSeconds: number
  elapsedFocusSeconds: number
  startSession: (durationSeconds: number, label: string | null) => Promise<void>
  startBreak: () => Promise<void>
  resumeSession: () => Promise<void>
  stopSession: () => Promise<void>
  completeSession: () => Promise<void>
  reset: () => void
}

export const useFocusSession = create<FocusSessionState>((set) => ({
  sessionId: null,
  status: 'idle',
  remainingSeconds: 0,
  elapsedFocusSeconds: 0,

  startSession: async (durationSeconds: number, label: string | null) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planned_duration_seconds: durationSeconds,
          label: label || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to start session')
      }

      const { session } = await response.json()
      set({
        sessionId: session.id,
        status: 'active',
        remainingSeconds: durationSeconds,
        elapsedFocusSeconds: 0,
      })
    } catch (error) {
      console.error('[timer/useFocusSession:startSession]', error)
      throw error
    }
  },

  reset: () => {
    set({
      sessionId: null,
      status: 'idle',
      remainingSeconds: 0,
      elapsedFocusSeconds: 0,
    })
  },

  // Handlers for later phases (Phase 3)
  startBreak: async () => {},
  resumeSession: async () => {},
  stopSession: async () => {},
  completeSession: async () => {},
}))
