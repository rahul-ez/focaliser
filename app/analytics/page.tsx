import { createClient } from '@/lib/supabase/server'
import { getWeeklySummary, getMonthlySummary, type PeriodSummary } from '@/lib/db/analytics'
import { AnalyticsClient } from '@/components/analytics/AnalyticsClient'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Default empty summaries in case user is not loaded yet (middleware protects route)
  let weekly: PeriodSummary = {
    period: 'week',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    totalFocusSeconds: 0,
    totalBreakSeconds: 0,
    totalSessions: 0,
    totalBreaks: 0,
    avgSessionSeconds: 0,
    avgBreakSeconds: 0,
    dailyData: [],
  }

  let monthly: PeriodSummary = {
    period: 'month',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    totalFocusSeconds: 0,
    totalBreakSeconds: 0,
    totalSessions: 0,
    totalBreaks: 0,
    avgSessionSeconds: 0,
    avgBreakSeconds: 0,
    dailyData: [],
  }

  if (user) {
    const [w, m] = await Promise.all([
      getWeeklySummary(supabase, user.id),
      getMonthlySummary(supabase, user.id),
    ])
    weekly = w
    monthly = m
  }

  return (
    <div className="max-w-5xl mx-auto px-lg md:px-xl py-xl md:py-2xl w-full">
      <AnalyticsClient weekly={weekly} monthly={monthly} />
    </div>
  )
}
