'use client'

import { ChangeEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { SESSION_LABEL_MAX_LENGTH } from '@/lib/constants'

interface LabelInputProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
}

export function LabelInput({ value, onChange, disabled = false }: LabelInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val.length <= SESSION_LABEL_MAX_LENGTH) {
      onChange(val)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-xs">
      <Input
        label="Session Label (Optional)"
        placeholder="What are you focusing on?"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        maxLength={SESSION_LABEL_MAX_LENGTH}
      />
      <div className="flex justify-end">
        <span className="text-text-muted text-xs tabular-nums">
          {value.length}/{SESSION_LABEL_MAX_LENGTH}
        </span>
      </div>
    </div>
  )
}
