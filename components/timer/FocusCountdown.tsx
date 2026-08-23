'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { formatTimerDisplay } from '@/lib/timer/formatTime'

interface FocusCountdownProps {
  remainingSeconds: number
  onTakeBreak: () => void
  onStopSession: () => void
  disabled?: boolean
}

export function FocusCountdown({
  remainingSeconds,
  onTakeBreak,
  onStopSession,
  disabled = false,
}: FocusCountdownProps) {
  const [isHovered, setIsHovered] = useState(false)
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseMove = useCallback(() => {
    if (disabled) return
    setIsHovered(true)
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
    idleTimeoutRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 3000)
  }, [disabled])

  const handleMouseLeave = useCallback(() => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
    setIsHovered(false)
  }, [])

  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
    }
  }, [])

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-screen h-screen bg-focus-bg flex flex-col items-center justify-center relative select-none overflow-hidden cursor-default"
    >
      {/* Central numerals matching session.png */}
      <div
        className={clsx(
          'font-mono tabular-nums text-focus-fg font-medium tracking-tight text-[clamp(4rem,18vw,14rem)] leading-none transition-all duration-300',
          isHovered ? 'blur-md opacity-30 scale-[0.98]' : 'blur-none opacity-100 scale-100'
        )}
      >
        {formatTimerDisplay(remainingSeconds)}
      </div>

      {/* Hover reveal controls */}
      <AnimatePresence>
        {isHovered && !disabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-lg pointer-events-auto"
          >
            {/* Primary Action: Take a break? */}
            <button
              type="button"
              onClick={onTakeBreak}
              className="text-focus-fg-muted hover:text-focus-fg text-base md:text-lg font-medium transition-colors hover:underline underline-offset-8 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm px-md py-sm"
            >
              Take a break?
            </button>

            {/* Secondary Action: Stop session? */}
            <button
              type="button"
              onClick={onStopSession}
              className="text-focus-fg-muted hover:text-focus-fg text-xs md:text-sm font-medium opacity-75 hover:opacity-100 transition-all hover:underline underline-offset-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm px-sm py-xs"
            >
              Stop session?
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
