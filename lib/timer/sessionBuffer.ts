import { openDB } from 'idb'

const DB_NAME = 'focaliser-buffer'
const STORE_NAME = 'session-buffer'
const BUFFER_KEY = 'current-session'

export interface BufferedSession {
  sessionId: string
  remainingSeconds: number
  elapsedFocusSeconds: number
  status: 'active' | 'on_break' | 'completed' | 'abandoned'
  breakId?: string | null
  elapsedBreakSeconds?: number
  updatedAt: number
}

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    },
  })
}

/**
 * Writes the current active session state into IndexedDB for page reload recovery.
 */
export async function writeSessionBuffer(state: BufferedSession): Promise<void> {
  try {
    const db = await getDb()
    await db.put(STORE_NAME, state, BUFFER_KEY)
  } catch (error) {
    console.error('[timer/sessionBuffer:write]', error)
  }
}

/**
 * Reads any existing buffered session.
 */
export async function readSessionBuffer(): Promise<BufferedSession | null> {
  try {
    const db = await getDb()
    const session = await db.get(STORE_NAME, BUFFER_KEY)
    return session ?? null
  } catch (error) {
    console.error('[timer/sessionBuffer:read]', error)
    return null
  }
}

/**
 * Clears the session buffer when a session completes or is abandoned.
 */
export async function clearSessionBuffer(): Promise<void> {
  try {
    const db = await getDb()
    await db.delete(STORE_NAME, BUFFER_KEY)
  } catch (error) {
    console.error('[timer/sessionBuffer:clear]', error)
  }
}
