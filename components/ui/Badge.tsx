import { HTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

export type BadgeStatus = 'completed' | 'active' | 'abandoned' | 'on_break'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ status, children, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'rounded-full px-sm py-xs text-xs font-medium inline-flex items-center justify-center select-none',
          status === 'completed' && 'bg-success-light text-success',
          status === 'active' && 'bg-primary-light text-primary',
          status === 'abandoned' && 'bg-surface-muted text-text-muted',
          status === 'on_break' && 'bg-break-muted text-break-foreground',
          className
        )}
        {...props}
      >
        {children || status}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
