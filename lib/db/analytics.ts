import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subWeeks,
  format,
  parseISO,
} from 'date-fns'
import { HEATMAP_WEEKS } from '@/lib/constants'

export interface DailyDataPoint {
  date: string // e.g. "2026-08-23"
  label: string // e.g. "Mon", "Tue" or "Aug 23"
  focusMinutes: number
  breakMinutes: number
  breakCount: number
  sessionCount: number
}

export interface PeriodSummary {
  period: 'week' | 'month'
  startDate: string
  endDate: string
  totalFocusSeconds: number
  totalBreakSeconds: number
  totalSessions: number
  totalBreaks: number
  avgSessionSeconds: number
  avgBreakSeconds: number
  dailyData: DailyDataPoint[]
}

export interface HeatmapDayValue {
  date: string
  count: number // total seconds focused
}

/**
 * Calculates aggregated analytics for a specified date interval.
 */
async function aggregatePeriod(
  supabase: SupabaseClient<Database>,
  userId: string,
  period: 'week' | 'month',
  intervalStart: Date,
  intervalEnd: Date
): Promise<PeriodSummary> {
  const startISO = intervalStart.toISOString()
  const endISO = intervalEnd.toISOString()

  // 1. Fetch completed focus sessions in interval
  const { data: sessions, error: sessionsError } = await supabase
    .from('focus_sessions')
    .select('id, actual_focus_seconds, started_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('started_at', startISO)
    .lte('started_at', endISO)

  if (sessionsError) {
    console.error('[lib/db/analytics:aggregatePeriod:sessions]', sessionsError)
    throw sessionsError
  }

  // 2. Fetch completed breaks in interval
  const { data: breaks, error: breaksError } = await supabase
    .from('breaks')
    .select('id, duration_seconds, started_at')
    .eq('user_id', userId)
    .not('duration_seconds', 'is', null)
    .gte('started_at', startISO)
    .lte('started_at', endISO)

  if (breaksError) {
    console.error('[lib/db/analytics:aggregatePeriod:breaks]', breaksError)
    throw breaksError
  }

  // 3. Build daily map for every day in interval
  const days = eachDayOfInterval({ start: intervalStart, end: intervalEnd })
  const dailyMap = new Map<string, DailyDataPoint>()

  for (const day of days) {
    const key = format(day, 'yyyy-MM-dd')
    const label = period === 'week' ? format(day, 'EEE') : format(day, 'MMM d')
    dailyMap.set(key, {
      date: key,
      label,
      focusMinutes: 0,
      breakMinutes: 0,
      breakCount: 0,
      sessionCount: 0,
    })
  }

  let totalFocusSeconds = 0
  let totalSessions = (sessions || []).length

  for (const s of sessions || []) {
    const dayKey = format(parseISO(s.started_at), 'yyyy-MM-dd')
    const focusSec = s.actual_focus_seconds || 0
    totalFocusSeconds += focusSec

    const dayPoint = dailyMap.get(dayKey)
    if (dayPoint) {
      dayPoint.focusMinutes += Math.round(focusSec / 60)
      dayPoint.sessionCount += 1
    }
  }

  let totalBreakSeconds = 0
  let totalBreaks = (breaks || []).length

  for (const b of breaks || []) {
    const dayKey = format(parseISO(b.started_at), 'yyyy-MM-dd')
    const breakSec = b.duration_seconds || 0
    totalBreakSeconds += breakSec

    const dayPoint = dailyMap.get(dayKey)
    if (dayPoint) {
      dayPoint.breakMinutes += Math.round(breakSec / 60)
      dayPoint.breakCount += 1
    }
  }

  const avgSessionSeconds = totalSessions > 0 ? Math.round(totalFocusSeconds / totalSessions) : 0
  const avgBreakSeconds = totalBreaks > 0 ? Math.round(totalBreakSeconds / totalBreaks) : 0

  return {
    period,
    startDate: startISO,
    endDate: endISO,
    totalFocusSeconds,
    totalBreakSeconds,
    totalSessions,
    totalBreaks,
    avgSessionSeconds,
    avgBreakSeconds,
    dailyData: Array.from(dailyMap.values()),
  }
}

/**
 * Gets analytics summary for the current week (Monday to Sunday).
 */
export async function getWeeklySummary(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<PeriodSummary> {
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 })
  const end = endOfWeek(now, { weekStartsOn: 1 })
  return aggregatePeriod(supabase, userId, 'week', start, end)
}

/**
 * Gets analytics summary for the current month.
 */
export async function getMonthlySummary(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<PeriodSummary> {
  const now = new Date()
  const start = startOfMonth(now)
  const end = endOfMonth(now)
  return aggregatePeriod(supabase, userId, 'month', start, end)
}

/**
 * Gets daily focus totals over the past N weeks for the activity heatmap.
 */
export async function getDailyTotals(
  supabase: SupabaseClient<Database>,
  userId: string,
  weeks: number = HEATMAP_WEEKS
): Promise<HeatmapDayValue[]> {
  try {
    const now = new Date()
    const startDate = subWeeks(now, weeks)

    const { data: sessions, error } = await supabase
      .from('focus_sessions')
      .select('actual_focus_seconds, started_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('started_at', startDate.toISOString())

    if (error) throw error

    const dailyTotalsMap = new Map<string, number>()

    for (const s of sessions || []) {
      const dateKey = format(parseISO(s.started_at), 'yyyy-MM-dd')
      const current = dailyTotalsMap.get(dateKey) || 0
      dailyTotalsMap.set(dateKey, current + (s.actual_focus_seconds || 0))
    }

    return Array.from(dailyTotalsMap.entries()).map(([date, count]) => ({
      date,
      count,
    }))
  } catch (error) {
    console.error('[lib/db/analytics:getDailyTotals]', error)
    return []
  }
}
