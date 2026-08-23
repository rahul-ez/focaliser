import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, SessionStatus } from '@/lib/types/database.types'
import { SESSIONS_PAGE_SIZE } from '@/lib/constants'

export type FocusSession = Database['public']['Tables']['focus_sessions']['Row']
export type InsertFocusSession = Database['public']['Tables']['focus_sessions']['Insert']

export interface SessionWithBreaks extends FocusSession {
  break_count: number
}

/**
 * Creates a new focus session row with status 'active'.
 */
export async function createSession(
  supabase: SupabaseClient<Database>,
  input: { user_id: string; label: string | null; planned_duration_seconds: number }
): Promise<FocusSession> {
  try {
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: input.user_id,
        label: input.label,
        planned_duration_seconds: input.planned_duration_seconds,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[lib/db/sessions:createSession]', error)
    throw error
  }
}

/**
 * Updates a session status between 'active' and 'on_break'.
 */
export async function updateSessionStatus(
  supabase: SupabaseClient<Database>,
  input: { session_id: string; user_id: string; status: 'active' | 'on_break' }
): Promise<FocusSession> {
  try {
    const { data, error } = await supabase
      .from('focus_sessions')
      .update({
        status: input.status,
      })
      .eq('id', input.session_id)
      .eq('user_id', input.user_id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[lib/db/sessions:updateSessionStatus]', error)
    throw error
  }
}

/**
 * Closes a session as completed or abandoned, setting ended_at and actual_focus_seconds.
 */
export async function closeSession(
  supabase: SupabaseClient<Database>,
  input: {
    session_id: string
    user_id: string
    status: 'completed' | 'abandoned'
    actual_focus_seconds: number
    ended_at: string
  }
): Promise<FocusSession> {
  try {
    const { data, error } = await supabase
      .from('focus_sessions')
      .update({
        status: input.status,
        actual_focus_seconds: input.actual_focus_seconds,
        ended_at: input.ended_at,
      })
      .eq('id', input.session_id)
      .eq('user_id', input.user_id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[lib/db/sessions:closeSession]', error)
    throw error
  }
}

/**
 * Retrieves a session by ID scoped to the authenticated user.
 */
export async function getSessionById(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  userId: string
): Promise<FocusSession | null> {
  try {
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[lib/db/sessions:getSessionById]', error)
    throw error
  }
}

/**
 * Lists past sessions ordered reverse-chronologically with break counts.
 */
export async function listSessions(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number = SESSIONS_PAGE_SIZE,
  offset: number = 0
): Promise<SessionWithBreaks[]> {
  try {
    const { data: sessions, error } = await supabase
      .from('focus_sessions')
      .select('*, breaks(id)')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return (sessions || []).map((s) => {
      const breakList = s.breaks as unknown as Array<{ id: string }> | null
      const breakCount = Array.isArray(breakList) ? breakList.length : 0
      const { breaks: _b, ...sessionData } = s
      return {
        ...sessionData,
        break_count: breakCount,
      }
    })
  } catch (error) {
    console.error('[lib/db/sessions:listSessions]', error)
    throw error
  }
}
