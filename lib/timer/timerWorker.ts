/**
 * Web Worker for drift-free countdown timer and break stopwatch.
 * Runs in background threads immune to browser tab sleep/throttling.
 */

interface StartMessage {
  command: 'start'
  remainingSeconds: number
  elapsedFocusSeconds?: number
}

interface StartBreakMessage {
  command: 'startBreak'
}

interface ResumeFocusMessage {
  command: 'resumeFocus'
}

interface StopMessage {
  command: 'stop'
}

type WorkerMessage = StartMessage | StartBreakMessage | ResumeFocusMessage | StopMessage

let mode: 'idle' | 'focus' | 'break' = 'idle'
let remainingSeconds = 0
let elapsedFocusSeconds = 0
let elapsedBreakSeconds = 0
let intervalId: ReturnType<typeof setInterval> | null = null

function clearIntervalTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function startFocusLoop() {
  clearIntervalTimer()
  mode = 'focus'

  intervalId = setInterval(() => {
    if (remainingSeconds <= 1) {
      remainingSeconds = 0
      elapsedFocusSeconds += 1
      clearIntervalTimer()
      self.postMessage({
        type: 'tick',
        mode: 'focus',
        remainingSeconds: 0,
        elapsedFocusSeconds,
      })
      self.postMessage({ type: 'complete' })
    } else {
      remainingSeconds -= 1
      elapsedFocusSeconds += 1
      self.postMessage({
        type: 'tick',
        mode: 'focus',
        remainingSeconds,
        elapsedFocusSeconds,
      })
    }
  }, 1000)
}

function startBreakLoop() {
  clearIntervalTimer()
  mode = 'break'
  elapsedBreakSeconds = 0

  intervalId = setInterval(() => {
    elapsedBreakSeconds += 1
    self.postMessage({
      type: 'tick',
      mode: 'break',
      elapsedBreakSeconds,
    })
  }, 1000)
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const data = e.data

  switch (data.command) {
    case 'start':
      remainingSeconds = data.remainingSeconds
      elapsedFocusSeconds = data.elapsedFocusSeconds ?? 0
      startFocusLoop()
      break

    case 'startBreak':
      startBreakLoop()
      break

    case 'resumeFocus':
      startFocusLoop()
      break

    case 'stop':
      clearIntervalTimer()
      mode = 'idle'
      break
  }
}
