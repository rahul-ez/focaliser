import { Card } from '@/components/ui/Card'
import type { PeriodSummary } from '@/lib/db/analytics'

interface AveragesSummaryProps {
  summary: PeriodSummary
}

function formatDurationHuman(seconds: number): string {
  if (seconds === 0) return '0m'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  return `${minutes}m`
}

export function AveragesSummary({ summary }: AveragesSummaryProps) {
  const cards = [
    {
      title: 'Total Focus Time',
      value: formatDurationHuman(summary.totalFocusSeconds),
      subtext: `${summary.totalSessions} completed session${summary.totalSessions === 1 ? '' : 's'}`,
    },
    {
      title: 'Avg Session Length',
      value: formatDurationHuman(summary.avgSessionSeconds),
      subtext: 'Per focus session',
    },
    {
      title: 'Total Breaks',
      value: String(summary.totalBreaks),
      subtext: summary.totalSessions > 0
        ? `${(summary.totalBreaks / summary.totalSessions).toFixed(1)} avg per session`
        : 'No breaks taken',
    },
    {
      title: 'Avg Break Time',
      value: formatDurationHuman(summary.avgBreakSeconds),
      subtext: `${formatDurationHuman(summary.totalBreakSeconds)} total break time`,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-md w-full">
      {cards.map((card) => (
        <Card key={card.title} className="flex flex-col gap-xs">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-text-secondary">
            {card.title}
          </span>
          <span className="text-3xl font-semibold text-text-primary font-mono tabular-nums leading-tight">
            {card.value}
          </span>
          <span className="text-xs text-text-muted mt-xs">
            {card.subtext}
          </span>
        </Card>
      ))}
    </div>
  )
}
