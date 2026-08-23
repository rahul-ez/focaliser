import { InputHTMLAttributes, forwardRef, useId } from 'react'
import clsx from 'clsx'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, disabled, className, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || generatedId

    return (
      <div className="w-full flex flex-col gap-xs">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-[0.04em] text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={clsx(
            'bg-surface border rounded-md px-md py-sm text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none',
            error
              ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
              : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20',
            disabled && 'bg-surface-muted text-text-muted cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-error text-xs font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-text-muted text-xs">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
