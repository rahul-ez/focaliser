'use client'

import { useState } from 'react'
import clsx from 'clsx'
import type { PeriodSummary } from '@/lib/db/analytics'
import { AveragesSummary } from '@/components/analytics/AveragesSummary'
import { FocusTimeChart } from '@/components/analytics/FocusTimeChart'
import { BreakChart } from '@/components/analytics/BreakChart'
import { EmptyAnalytics } from '@/components/analytics/EmptyAnalytics'

interface AnalyticsClientProps {
  weekly: PeriodSummary
  monthly: PeriodSummary
}

export function AnalyticsClient({ weekly, monthly }: AnalyticsClientProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const currentSummary = period === 'week' ? weekly : monthly
  const hasData = currentSummary.totalSessions > 0

  return (
    <div className="w-full flex flex-col gap-xl">
      {/* Header with period toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-border-light pb-lg">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary leading-[1.2]">
            Analytics
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Review your focus habits, sessions, and break patterns.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="inline-flex bg-surface-secondary border border-border rounded-md p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={clsx(
              'px-md py-xs text-xs font-semibold rounded-sm transition-all cursor-pointer',
              period === 'week'
                ? 'bg-surface text-primary shadow-[var(--shadow-card)]'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={clsx(
              'px-md py-xs text-xs font-semibold rounded-sm transition-all cursor-pointer',
              period === 'month'
                ? 'bg-surface text-primary shadow-[var(--shadow-card)]'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Content */}
      {!hasData ? (
        <EmptyAnalytics />
      ) : (
        <div className="flex flex-col gap-xl">
          <AveragesSummary summary={currentSummary} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <FocusTimeChart data={currentSummary.dailyData} />
            <BreakChart data={currentSummary.dailyData} />
          </div>
        </div>
      )}
    </div>
  )
}
