'use client'

import { useRef, useEffect, useCallback, UIEvent } from 'react'
import clsx from 'clsx'

interface WheelColumnProps {
  label: string
  items: number[]
  value: number
  onChange: (val: number) => void
  padZero?: boolean
}

const ITEM_HEIGHT = 44 // px height for each item row

function WheelColumn({ label, items, value, onChange, padZero = true }: WheelColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Format number
  const formatItem = (item: number) => {
    return padZero ? String(item).padStart(2, '0') : String(item)
  }

  // Scroll to index
  const scrollToIndex = useCallback((index: number, smooth = true) => {
    if (!containerRef.current) return
    const targetY = index * ITEM_HEIGHT
    containerRef.current.scrollTo({
      top: targetY,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [])

  // Sync scroll on mount or external value change
  useEffect(() => {
    const targetIndex = items.indexOf(value)
    if (targetIndex !== -1 && !isScrollingRef.current) {
      scrollToIndex(targetIndex, false)
    }
  }, [value, items, scrollToIndex])

  // Handle scroll events and detect centered item
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    isScrollingRef.current = true
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)

    const target = e.currentTarget
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false
      const scrollTop = target.scrollTop
      const rawIndex = Math.round(scrollTop / ITEM_HEIGHT)
      const clampedIndex = Math.max(0, Math.min(items.length - 1, rawIndex))
      const newValue = items[clampedIndex]

      if (newValue !== undefined && newValue !== value) {
        onChange(newValue)
      }
      scrollToIndex(clampedIndex, true)
    }, 80)
  }

  // Wheel handling for desktop trackpad/mouse
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      containerRef.current.scrollTop += e.deltaY > 0 ? ITEM_HEIGHT : -ITEM_HEIGHT
    }
  }

  return (
    <div className="flex flex-col items-center select-none">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-sm">
        {label}
      </span>
      <div className="relative w-20 md:w-24 h-[220px] flex items-center justify-center">
        {/* Center selection box highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 h-[44px] rounded-md bg-surface-secondary border border-border"
          style={{ top: ITEM_HEIGHT * 2 }}
        />

        {/* Scrollable column container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onWheel={handleWheel}
          tabIndex={0}
          aria-label={`${label} selector`}
          className="w-full h-full overflow-y-auto snap-y snap-mandatory scrollbar-none outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-md"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Top spacer (2 empty rows) */}
          <div style={{ height: ITEM_HEIGHT * 2 }} />

          {/* Value items */}
          {items.map((item) => {
            const isSelected = item === value
            return (
              <div
                key={item}
                onClick={() => {
                  const idx = items.indexOf(item)
                  scrollToIndex(idx, true)
                  onChange(item)
                }}
                className={clsx(
                  'h-[44px] flex items-center justify-center font-mono tabular-nums snap-center cursor-pointer transition-all duration-150',
                  isSelected
                    ? 'text-primary font-semibold text-2xl scale-110'
                    : 'text-text-muted text-lg hover:text-text-secondary opacity-60 hover:opacity-90'
                )}
              >
                {formatItem(item)}
              </div>
            )
          })}

          {/* Bottom spacer (2 empty rows) */}
          <div style={{ height: ITEM_HEIGHT * 2 }} />
        </div>
      </div>
    </div>
  )
}

interface DurationPickerProps {
  value: number // Duration in total seconds
  onChange: (seconds: number) => void
  disabled?: boolean
}

export function DurationPicker({ value, onChange, disabled = false }: DurationPickerProps) {
  // Convert total seconds to hours, minutes, seconds
  const hours = Math.floor(value / 3600)
  const minutes = Math.floor((value % 3600) / 60)
  const seconds = value % 60

  const hoursList = Array.from({ length: 13 }, (_, i) => i) // 0 to 12
  const minutesList = Array.from({ length: 60 }, (_, i) => i) // 0 to 59
  const secondsList = Array.from({ length: 60 }, (_, i) => i) // 0 to 59

  const handleHoursChange = (newHours: number) => {
    const total = newHours * 3600 + minutes * 60 + seconds
    onChange(total)
  }

  const handleMinutesChange = (newMinutes: number) => {
    const total = hours * 3600 + newMinutes * 60 + seconds
    onChange(total)
  }

  const handleSecondsChange = (newSeconds: number) => {
    const total = hours * 3600 + minutes * 60 + newSeconds
    onChange(total)
  }

  return (
    <div
      className={clsx(
        'bg-surface border border-border rounded-lg p-lg shadow-[var(--shadow-card)] flex items-center justify-center gap-md md:gap-lg w-full max-w-sm mx-auto',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      <WheelColumn
        label="Hours"
        items={hoursList}
        value={hours}
        onChange={handleHoursChange}
      />
      <div className="text-text-muted font-mono font-bold text-xl pt-6">:</div>
      <WheelColumn
        label="Min"
        items={minutesList}
        value={minutes}
        onChange={handleMinutesChange}
      />
      <div className="text-text-muted font-mono font-bold text-xl pt-6">:</div>
      <WheelColumn
        label="Sec"
        items={secondsList}
        value={seconds}
        onChange={handleSecondsChange}
      />
    </div>
  )
}
