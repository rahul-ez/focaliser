import { createClient } from '@/lib/supabase/server'
import { listSessions, type SessionWithBreaks } from '@/lib/db/sessions'
import { getDailyTotals, type HeatmapDayValue } from '@/lib/db/analytics'
import { Heatmap } from '@/components/history/Heatmap'
import { SessionList } from '@/components/history/SessionList'
import { EmptyHistory } from '@/components/history/EmptyHistory'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let sessions: SessionWithBreaks[] = []
  let dailyTotals: HeatmapDayValue[] = []

  if (user) {
    const [fetchedSessions, fetchedTotals] = await Promise.all([
      listSessions(supabase, user.id),
      getDailyTotals(supabase, user.id),
    ])
    sessions = fetchedSessions
    dailyTotals = fetchedTotals
  }

  return (
    <div className="max-w-5xl mx-auto px-lg md:px-xl py-xl md:py-2xl w-full flex flex-col gap-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary leading-[1.2]">
          Past Sessions
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Review your chronological focus session history and daily activity heatmap.
        </p>
      </div>

      {/* Activity Heatmap */}
      <Heatmap dailyTotals={dailyTotals} />

      {/* Sessions Log */}
      <section className="flex flex-col gap-md">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            Session History
          </h2>
          <span className="text-xs text-text-muted font-mono">
            {sessions.length} session{sessions.length === 1 ? '' : 's'}
          </span>
        </div>

        {sessions.length === 0 ? (
          <EmptyHistory />
        ) : (
          <SessionList sessions={sessions} />
        )}
      </section>
    </div>
  )
}
