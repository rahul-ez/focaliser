import { create } from 'zustand'
import { writeSessionBuffer, clearSessionBuffer, readSessionBuffer } from '@/lib/timer/sessionBuffer'

export type SessionStatus = 'idle' | 'active' | 'on_break' | 'completed' | 'abandoned'

export interface FocusSessionState {
  sessionId: string | null
  status: SessionStatus
  remainingSeconds: number
  elapsedFocusSeconds: number
  currentBreakId: string | null
  elapsedBreakSeconds: number
  isCompleted: boolean

  // Actions
  initWorker: () => void
  startSession: (durationSeconds: number, label: string | null) => Promise<void>
  startBreak: () => Promise<void>
  resumeSession: () => Promise<void>
  stopSession: () => Promise<void>
  completeSession: () => Promise<void>
  restoreFromBuffer: () => Promise<boolean>
  reset: () => void
}

let workerInstance: Worker | null = null

function getWorker(): Worker | null {
  if (typeof window === 'undefined') return null
  if (!workerInstance) {
    workerInstance = new Worker(new URL('./timerWorker.ts', import.meta.url))
  }
  return workerInstance
}

export const useFocusSession = create<FocusSessionState>((set, get) => ({
  sessionId: null,
  status: 'idle',
  remainingSeconds: 0,
  elapsedFocusSeconds: 0,
  currentBreakId: null,
  elapsedBreakSeconds: 0,
  isCompleted: false,

  initWorker: () => {
    const worker = getWorker()
    if (!worker) return

    worker.onmessage = (e: MessageEvent) => {
      const data = e.data
      if (data.type === 'tick') {
        if (data.mode === 'focus') {
          set({
            remainingSeconds: data.remainingSeconds,
            elapsedFocusSeconds: data.elapsedFocusSeconds,
          })

          // Periodic buffer write (every 5 ticks)
          const state = get()
          if (state.sessionId && state.status === 'active' && data.remainingSeconds % 5 === 0) {
            writeSessionBuffer({
              sessionId: state.sessionId,
              remainingSeconds: data.remainingSeconds,
              elapsedFocusSeconds: data.elapsedFocusSeconds,
              status: 'active',
              updatedAt: Date.now(),
            })
          }
        } else if (data.mode === 'break') {
          set({
            elapsedBreakSeconds: data.elapsedBreakSeconds,
          })
        }
      } else if (data.type === 'complete') {
        set({ isCompleted: true })
      }
    }
  },

  startSession: async (durationSeconds: number, label: string | null) => {
    try {
      get().initWorker()
      const worker = getWorker()

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        currentBreakId: null,
        elapsedBreakSeconds: 0,
        isCompleted: false,
      })

      if (worker) {
        worker.postMessage({
          command: 'start',
          remainingSeconds: durationSeconds,
          elapsedFocusSeconds: 0,
        })
      }

      await writeSessionBuffer({
        sessionId: session.id,
        remainingSeconds: durationSeconds,
        elapsedFocusSeconds: 0,
        status: 'active',
        updatedAt: Date.now(),
      })
    } catch (error) {
      console.error('[timer/useFocusSession:startSession]', error)
      throw error
    }
  },

  startBreak: async () => {
    const { sessionId } = get()
    if (!sessionId) return

    try {
      const response = await fetch('/api/breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })

      if (!response.ok) {
        throw new Error('Failed to start break')
      }

      const { break: breakRecord } = await response.json()
      const worker = getWorker()
      if (worker) {
        worker.postMessage({ command: 'startBreak' })
      }

      set({
        status: 'on_break',
        currentBreakId: breakRecord.id,
        elapsedBreakSeconds: 0,
      })

      const state = get()
      await writeSessionBuffer({
        sessionId: state.sessionId!,
        remainingSeconds: state.remainingSeconds,
        elapsedFocusSeconds: state.elapsedFocusSeconds,
        status: 'on_break',
        breakId: breakRecord.id,
        elapsedBreakSeconds: 0,
        updatedAt: Date.now(),
      })
    } catch (error) {
      console.error('[timer/useFocusSession:startBreak]', error)
      throw error
    }
  },

  resumeSession: async () => {
    const { sessionId, currentBreakId, elapsedBreakSeconds, remainingSeconds, elapsedFocusSeconds } = get()
    if (!sessionId || !currentBreakId) return

    try {
      const response = await fetch(`/api/breaks/${currentBreakId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          duration_seconds: elapsedBreakSeconds,
          ended_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to end break')
      }

      const worker = getWorker()
      if (worker) {
        worker.postMessage({ command: 'resumeFocus' })
      }

      set({
        status: 'active',
        currentBreakId: null,
        elapsedBreakSeconds: 0,
      })

      await writeSessionBuffer({
        sessionId,
        remainingSeconds,
        elapsedFocusSeconds,
        status: 'active',
        updatedAt: Date.now(),
      })
    } catch (error) {
      console.error('[timer/useFocusSession:resumeSession]', error)
      throw error
    }
  },

  stopSession: async () => {
    const { sessionId, elapsedFocusSeconds } = get()
    if (!sessionId) return

    try {
      const worker = getWorker()
      if (worker) {
        worker.postMessage({ command: 'stop' })
      }

      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'abandoned',
          actual_focus_seconds: elapsedFocusSeconds,
          ended_at: new Date().toISOString(),
        }),
      })

      await clearSessionBuffer()
      get().reset()
    } catch (error) {
      console.error('[timer/useFocusSession:stopSession]', error)
      await clearSessionBuffer()
      get().reset()
      throw error
    }
  },

  completeSession: async () => {
    const { sessionId, elapsedFocusSeconds } = get()
    if (!sessionId) return

    try {
      const worker = getWorker()
      if (worker) {
        worker.postMessage({ command: 'stop' })
      }

      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          actual_focus_seconds: elapsedFocusSeconds,
          ended_at: new Date().toISOString(),
        }),
      })

      await clearSessionBuffer()
      get().reset()
    } catch (error) {
      console.error('[timer/useFocusSession:completeSession]', error)
      await clearSessionBuffer()
      get().reset()
    }
  },

  restoreFromBuffer: async () => {
    try {
      const buffered = await readSessionBuffer()
      if (!buffered || !buffered.sessionId) return false

      get().initWorker()
      const worker = getWorker()

      set({
        sessionId: buffered.sessionId,
        status: buffered.status,
        remainingSeconds: buffered.remainingSeconds,
        elapsedFocusSeconds: buffered.elapsedFocusSeconds,
        currentBreakId: buffered.breakId || null,
        elapsedBreakSeconds: buffered.elapsedBreakSeconds || 0,
        isCompleted: false,
      })

      if (worker) {
        if (buffered.status === 'active') {
          worker.postMessage({
            command: 'start',
            remainingSeconds: buffered.remainingSeconds,
            elapsedFocusSeconds: buffered.elapsedFocusSeconds,
          })
        } else if (buffered.status === 'on_break') {
          worker.postMessage({ command: 'startBreak' })
        }
      }

      return true
    } catch (error) {
      console.error('[timer/useFocusSession:restoreFromBuffer]', error)
      return false
    }
  },

  reset: () => {
    const worker = getWorker()
    if (worker) {
      worker.postMessage({ command: 'stop' })
    }
    set({
      sessionId: null,
      status: 'idle',
      remainingSeconds: 0,
      elapsedFocusSeconds: 0,
      currentBreakId: null,
      elapsedBreakSeconds: 0,
      isCompleted: false,
    })
  },
}))
