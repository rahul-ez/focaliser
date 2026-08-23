import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

export type Break = Database['public']['Tables']['breaks']['Row']

/**
 * Inserts a new break record when user enters break state.
 */
export async function createBreak(
  supabase: SupabaseClient<Database>,
  input: { session_id: string; user_id: string }
): Promise<Break> {
  try {
    const { data, error } = await supabase
      .from('breaks')
      .insert({
        session_id: input.session_id,
        user_id: input.user_id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[lib/db/breaks:createBreak]', error)
    throw error
  }
}

/**
 * Closes an open break record with ended_at and computed duration_seconds.
 */
export async function endBreak(
  supabase: SupabaseClient<Database>,
  input: { break_id: string; user_id: string; ended_at: string; duration_seconds: number }
): Promise<Break> {
  try {
    const { data, error } = await supabase
      .from('breaks')
      .update({
        ended_at: input.ended_at,
        duration_seconds: input.duration_seconds,
      })
      .eq('id', input.break_id)
      .eq('user_id', input.user_id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[lib/db/breaks:endBreak]', error)
    throw error
  }
}
