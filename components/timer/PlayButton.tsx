'use client'

import { ButtonHTMLAttributes } from 'react'
import { Play, Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface PlayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
}

export function PlayButton({
  onClick,
  disabled = false,
  isLoading = false,
  className,
  ...props
}: PlayButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label="Start Focus Session"
      className={clsx(
        'w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-card)] transition-all cursor-pointer select-none',
        'hover:bg-primary-dark hover:shadow-[var(--shadow-card-hover)]',
        'active:bg-primary-dark active:scale-95',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:bg-primary-muted disabled:text-primary-foreground/70 disabled:cursor-not-allowed disabled:active:scale-100',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-7 h-7 animate-spin text-primary-foreground" />
      ) : (
        <Play className="w-7 h-7 fill-current translate-x-0.5" />
      )}
    </button>
  )
}
