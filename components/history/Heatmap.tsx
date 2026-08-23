'use client'

import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'
import { subWeeks } from 'date-fns'
import { Card } from '@/components/ui/Card'
import { HEATMAP_WEEKS } from '@/lib/constants'
import type { HeatmapDayValue } from '@/lib/db/analytics'

interface HeatmapProps {
  dailyTotals: HeatmapDayValue[]
}

function classForValue(value?: HeatmapDayValue): string {
  if (!value || value.count === 0) return 'heatmap-scale-0'
  if (value.count < 1800) return 'heatmap-scale-1' // < 30 min
  if (value.count < 5400) return 'heatmap-scale-2' // 30 min - 1.5 hr
  return 'heatmap-scale-3' // 1.5 hr+
}

function titleForValue(value?: HeatmapDayValue): string {
  if (!value || !value.date) return 'No focus time'
  const minutes = Math.round((value.count || 0) / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  const formatted =
    hours > 0
      ? remainingMins > 0
        ? `${hours}h ${remainingMins}m`
        : `${hours}h`
      : `${minutes}m`

  return `${value.date}: ${formatted} focused`
}

export function Heatmap({ dailyTotals }: HeatmapProps) {
  const now = new Date()
  const startDate = subWeeks(now, HEATMAP_WEEKS)

  return (
    <Card className="flex flex-col gap-md w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-xs">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.04em] text-text-secondary">
            Activity Heatmap
          </h2>
          <p className="text-xs text-text-muted">
            Daily focus history over the past 52 weeks
          </p>
        </div>

        {/* Intensity Legend */}
        <div className="flex items-center gap-xs text-xs text-text-muted select-none self-end sm:self-auto">
          <span>Less</span>
          <span className="w-3 h-3 rounded-xs bg-surface-muted inline-block border border-border" />
          <span className="w-3 h-3 rounded-xs bg-primary-light inline-block" />
          <span className="w-3 h-3 rounded-xs bg-primary-muted inline-block" />
          <span className="w-3 h-3 rounded-xs bg-primary inline-block" />
          <span>More</span>
        </div>
      </div>

      {/* Overflow scroll wrapper for mobile & small screens */}
      <div className="w-full overflow-x-auto pb-xs">
        <div className="min-w-[640px] pt-sm">
          <CalendarHeatmap
            startDate={startDate}
            endDate={now}
            values={dailyTotals}
            classForValue={classForValue}
            titleForValue={titleForValue}
            showWeekdayLabels={false}
          />
        </div>
      </div>
    </Card>
  )
}
