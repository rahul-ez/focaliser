import { ButtonHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  context?: 'chrome' | 'session'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      context = 'chrome',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={clsx(
          'text-sm font-semibold transition-colors focus:outline-none cursor-pointer disabled:cursor-not-allowed',
          // Primary Variant
          variant === 'primary' && [
            'bg-primary text-primary-foreground rounded-md px-lg py-sm',
            'hover:bg-primary-dark',
            'active:bg-primary-dark active:scale-[0.98]',
            'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:bg-primary-muted disabled:text-primary-foreground/70 disabled:active:scale-100',
          ],
          // Secondary Variant
          variant === 'secondary' && [
            'bg-surface border border-border text-text-primary rounded-md px-lg py-sm',
            'hover:bg-surface-secondary',
            'active:bg-surface-tertiary',
            'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:opacity-50',
          ],
          // Ghost Variant
          variant === 'ghost' && [
            'bg-transparent font-medium underline-offset-4 focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm',
            context === 'session'
              ? 'text-focus-fg-muted hover:text-focus-fg hover:underline active:text-focus-fg'
              : 'text-text-secondary hover:text-text-primary hover:underline active:text-text-primary',
            'disabled:opacity-40 disabled:pointer-events-none',
          ],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
