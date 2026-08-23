import { HTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accentColor?: 'primary' | 'success' | 'warning' | 'error'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, accentColor, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'bg-surface border border-border rounded-lg p-lg shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow',
          accentColor === 'primary' && 'border-l-4 border-l-primary',
          accentColor === 'success' && 'border-l-4 border-l-success',
          accentColor === 'warning' && 'border-l-4 border-l-warning',
          accentColor === 'error' && 'border-l-4 border-l-error',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
