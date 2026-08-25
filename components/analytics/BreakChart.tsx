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
const BREAK_COLOR = '#D98C82' // --color-break
const TEXT_MUTED = '#8B8888' // --color-text-muted
const BORDER_COLOR = '#DBD9D9' // --color-border

interface BreakChartProps {
  data: DailyDataPoint[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload?: DailyDataPoint }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const minutes = payload[0].value
    const breakCount = payload[0].payload?.breakCount ?? 0

    return (
      <div className="bg-surface border border-border rounded-md px-md py-xs shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold text-text-secondary mb-0.5">{label}</p>
        <p className="text-sm font-mono font-medium text-text-primary">
          {minutes}m break time
        </p>
        <p className="text-xs text-text-muted">
          {breakCount} break{breakCount === 1 ? '' : 's'}
        </p>
      </div>
    )
  }
  return null
}

export function BreakChart({ data }: BreakChartProps) {
  return (
    <Card className="flex flex-col gap-md w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.04em] text-text-secondary">
          Break Time & Count
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
              dataKey="breakMinutes"
              fill={BREAK_COLOR}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
