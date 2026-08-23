'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import type { DailyDataPoint } from '@/lib/db/analytics'

// Explicit token color mappings per library-docs.md
const PRIMARY_COLOR = '#5B5FEF' // --color-primary
const TEXT_MUTED = '#8C8A86' // --color-text-muted
const BORDER_COLOR = '#E5E3E0' // --color-border

interface FocusTimeChartProps {
  data: DailyDataPoint[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const minutes = payload[0].value
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    const timeFormatted =
      hours > 0
        ? remainingMins > 0
          ? `${hours}h ${remainingMins}m`
          : `${hours}h`
        : `${minutes}m`

    return (
      <div className="bg-surface border border-border rounded-md px-md py-xs shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold text-text-secondary mb-0.5">{label}</p>
        <p className="text-sm font-mono font-medium text-primary">
          {timeFormatted}
        </p>
      </div>
    )
  }
  return null
}

export function FocusTimeChart({ data }: FocusTimeChartProps) {
  return (
    <Card className="flex flex-col gap-md w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.04em] text-text-secondary">
          Focus Time
        </h3>
        <span className="text-xs text-text-muted font-mono">Daily (minutes)</span>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              stroke={BORDER_COLOR}
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.5}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: TEXT_MUTED }}
              tickLine={false}
              axisLine={{ stroke: BORDER_COLOR }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: TEXT_MUTED }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(24, 24, 27, 0.04)' }}
            />
            <Bar
              dataKey="focusMinutes"
              fill={PRIMARY_COLOR}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
