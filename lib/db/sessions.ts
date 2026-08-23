import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

export type FocusSession = Database['public']['Tables']['focus_sessions']['Row']
export type InsertFocusSession = Database['public']['Tables']['focus_sessions']['Insert']

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
