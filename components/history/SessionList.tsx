import { format, parseISO } from 'date-fns'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { SessionWithBreaks } from '@/lib/db/sessions'
import { formatTimerDisplay } from '@/lib/timer/formatTime'

interface SessionListProps {
  sessions: SessionWithBreaks[]
}

function formatSessionDate(isoString: string): string {
  try {
    return format(parseISO(isoString), 'MMM d, yyyy · h:mm a')
  } catch {
    return isoString
  }
}

export function SessionList({ sessions }: SessionListProps) {
  if (sessions.length === 0) return null

  return (
    <div className="w-full flex flex-col gap-md">
      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block w-full overflow-hidden bg-surface border border-border rounded-lg shadow-[var(--shadow-card)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-secondary text-text-secondary text-xs font-semibold uppercase tracking-wide border-b border-border">
              <th className="px-md py-sm">Session Label</th>
              <th className="px-md py-sm">Date & Time</th>
              <th className="px-md py-sm font-mono">Planned / Focused</th>
              <th className="px-md py-sm text-center">Breaks</th>
              <th className="px-md py-sm text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light text-sm">
            {sessions.map((session) => {
              const label = session.label || 'Untitled Session'
              const plannedFormatted = formatTimerDisplay(session.planned_duration_seconds)
              const actualFormatted = formatTimerDisplay(session.actual_focus_seconds)

              return (
                <tr
                  key={session.id}
                  className="hover:bg-surface-secondary transition-colors"
                >
                  <td className="px-md py-sm font-medium text-text-primary">
                    {label}
                  </td>
                  <td className="px-md py-sm text-text-secondary text-xs">
                    {formatSessionDate(session.started_at)}
                  </td>
                  <td className="px-md py-sm font-mono text-xs text-text-secondary">
                    <span className="text-text-primary font-medium">{actualFormatted}</span>
                    <span className="text-text-muted"> / {plannedFormatted}</span>
                  </td>
                  <td className="px-md py-sm text-center text-xs text-text-secondary">
                    {session.break_count}
                  </td>
                  <td className="px-md py-sm text-right">
                    <Badge status={session.status}>
                      {session.status === 'completed'
                        ? 'Completed'
                        : session.status === 'abandoned'
                        ? 'Abandoned'
                        : session.status === 'on_break'
                        ? 'On Break'
                        : 'Active'}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View (< md) */}
      <div className="flex md:hidden flex-col gap-sm">
        {sessions.map((session) => {
          const label = session.label || 'Untitled Session'
          const plannedFormatted = formatTimerDisplay(session.planned_duration_seconds)
          const actualFormatted = formatTimerDisplay(session.actual_focus_seconds)

          return (
            <Card
              key={session.id}
              accentColor={session.status === 'completed' ? 'success' : undefined}
              className="flex flex-col gap-sm p-md"
            >
              <div className="flex items-start justify-between gap-sm">
                <div className="flex flex-col">
                  <span className="font-semibold text-text-primary text-sm">
                    {label}
                  </span>
                  <span className="text-xs text-text-muted mt-0.5">
                    {formatSessionDate(session.started_at)}
                  </span>
                </div>
                <Badge status={session.status}>
                  {session.status === 'completed'
                    ? 'Completed'
                    : session.status === 'abandoned'
                    ? 'Abandoned'
                    : session.status === 'on_break'
                    ? 'On Break'
                    : 'Active'}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-t border-border-light pt-xs text-xs text-text-secondary">
                <span className="font-mono">
                  Focus: <strong className="text-text-primary">{actualFormatted}</strong> / {plannedFormatted}
                </span>
                <span>
                  {session.break_count} break{session.break_count === 1 ? '' : 's'}
                </span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
