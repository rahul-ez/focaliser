'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SESSION_END_ALERT_DURATION_MS } from '@/lib/constants'

interface SessionEndAlertProps {
  onComplete: () => void
}

export function SessionEndAlert({ onComplete }: SessionEndAlertProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const timer = setTimeout(() => {
      onComplete()
    }, SESSION_END_ALERT_DURATION_MS)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="w-screen h-screen bg-focus-bg flex flex-col items-center justify-center relative select-none overflow-hidden cursor-default">
      <motion.div
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [1, 0.2, 1, 0.2, 1] }}
        transition={{
          duration: SESSION_END_ALERT_DURATION_MS / 1000,
          ease: 'easeInOut',
        }}
        className="font-mono tabular-nums text-focus-fg font-medium tracking-tight text-[clamp(4rem,18vw,14rem)] leading-none"
      >
        00:00
      </motion.div>
    </div>
  )
}
