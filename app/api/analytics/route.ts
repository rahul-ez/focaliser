import { createClient } from '@/lib/supabase/server'
import { getWeeklySummary, getMonthlySummary } from '@/lib/db/analytics'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')

    if (period === 'month') {
      const summary = await getMonthlySummary(supabase, user.id)
      return Response.json({ summary })
    } else if (period === 'week') {
      const summary = await getWeeklySummary(supabase, user.id)
      return Response.json({ summary })
    }

    // Default: return both
    const [weekly, monthly] = await Promise.all([
      getWeeklySummary(supabase, user.id),
      getMonthlySummary(supabase, user.id),
    ])

    return Response.json({ weekly, monthly })
  } catch (error) {
    console.error('[api/analytics:GET]', error)
    return Response.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
