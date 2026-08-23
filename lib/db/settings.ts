import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'
import { DEFAULT_DURATION_SECONDS } from '@/lib/constants'

export type UserSettings = Database['public']['Tables']['user_settings']['Row']

/**
 * Gets user settings or returns fallback defaults if not yet created.
 */
export async function getUserSettings(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ default_duration_seconds: number }> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('default_duration_seconds')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[lib/db/settings:getUserSettings]', error)
      return { default_duration_seconds: DEFAULT_DURATION_SECONDS }
    }

    return {
      default_duration_seconds: data?.default_duration_seconds ?? DEFAULT_DURATION_SECONDS,
    }
  } catch (error) {
    console.error('[lib/db/settings:getUserSettings]', error)
    return { default_duration_seconds: DEFAULT_DURATION_SECONDS }
  }
}
