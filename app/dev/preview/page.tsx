'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { DurationPicker } from '@/components/timer/DurationPicker'
import { LabelInput } from '@/components/timer/LabelInput'
import { PlayButton } from '@/components/timer/PlayButton'
import { FocusCountdown } from '@/components/timer/FocusCountdown'
import { BreakStopwatch } from '@/components/timer/BreakStopwatch'
import { SessionEndAlert } from '@/components/timer/SessionEndAlert'

export default function DevPreviewPage() {
  const [previewDuration, setPreviewDuration] = useState(1500)
  const [previewLabel, setPreviewLabel] = useState('')
  const [sessionPreviewMode, setSessionPreviewMode] = useState<'none' | 'focus' | 'break' | 'alert'>('none')

  if (sessionPreviewMode === 'focus') {
    return (
      <div className="relative">
        <div className="absolute top-4 left-4 z-50">
          <Button variant="secondary" onClick={() => setSessionPreviewMode('none')}>
            Close Preview
          </Button>
        </div>
        <FocusCountdown
          remainingSeconds={previewDuration}
          onTakeBreak={() => setSessionPreviewMode('break')}
          onStopSession={() => setSessionPreviewMode('none')}
        />
      </div>
    )
  }

  if (sessionPreviewMode === 'break') {
    return (
      <div className="relative">
        <div className="absolute top-4 left-4 z-50">
          <Button variant="secondary" onClick={() => setSessionPreviewMode('none')}>
            Close Preview
          </Button>
        </div>
        <BreakStopwatch
          elapsedBreakSeconds={42}
          onResumeFocus={() => setSessionPreviewMode('focus')}
        />
      </div>
    )
  }

  if (sessionPreviewMode === 'alert') {
    return (
      <div className="relative">
        <div className="absolute top-4 left-4 z-50">
          <Button variant="secondary" onClick={() => setSessionPreviewMode('none')}>
            Close Preview
          </Button>
        </div>
        <SessionEndAlert onComplete={() => setSessionPreviewMode('none')} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-xl py-2xl w-full flex flex-col gap-2xl">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-xs">
          Component Preview & Design Token Audit
        </h1>
        <p className="text-sm text-text-secondary">
          Visual test gallery for shared UI primitives and state variants.
        </p>
      </div>

      {/* Fullscreen Session Previews */}
      <section className="flex flex-col gap-md">
        <h2 className="text-xl font-semibold text-text-primary">Fullscreen Session Screen Previews</h2>
        <Card className="flex flex-wrap items-center gap-md">
          <Button variant="primary" onClick={() => setSessionPreviewMode('focus')}>
            Launch Focus State Preview
          </Button>
          <Button variant="secondary" onClick={() => setSessionPreviewMode('break')}>
            Launch Break State Preview
          </Button>
          <Button variant="secondary" onClick={() => setSessionPreviewMode('alert')}>
            Launch Session Complete Alert Preview
          </Button>
        </Card>
      </section>

      {/* Timer & Home Controls */}
      <section className="flex flex-col gap-md">
        <h2 className="text-xl font-semibold text-text-primary">Home / Timer Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg items-start">
          <Card className="flex flex-col items-center gap-md">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Duration Picker
            </h3>
            <DurationPicker
              value={previewDuration}
              onChange={setPreviewDuration}
            />
            <p className="text-xs text-text-muted font-mono">
              Total seconds: {previewDuration} ({Math.floor(previewDuration / 60)}m {previewDuration % 60}s)
            </p>
          </Card>

          <Card className="flex flex-col items-center gap-lg">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Label & Play Button
            </h3>
            <LabelInput
              value={previewLabel}
              onChange={setPreviewLabel}
            />
            <div className="flex items-center gap-lg">
              <PlayButton onClick={() => alert(`Start session: ${previewDuration}s, label: "${previewLabel}"`)} />
              <PlayButton isLoading onClick={() => {}} />
              <PlayButton disabled onClick={() => {}} />
            </div>
          </Card>
        </div>
      </section>

      {/* Buttons */}
      <section className="flex flex-col gap-md">
        <h2 className="text-xl font-semibold text-text-primary">Buttons</h2>
        <div className="flex flex-wrap items-center gap-md">
          <Button variant="primary">Primary Button</Button>
          <Button variant="primary" disabled>Primary Disabled</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="secondary" disabled>Secondary Disabled</Button>
          <Button variant="ghost" context="chrome">Ghost (Chrome)</Button>
        </div>

        {/* Session context ghost buttons on black background */}
        <div className="bg-focus-bg rounded-lg p-lg flex flex-wrap items-center gap-lg mt-sm">
          <span className="text-focus-fg-muted text-xs uppercase tracking-wider font-mono">
            Session Context:
          </span>
          <Button variant="ghost" context="session">Take a break?</Button>
          <Button variant="ghost" context="session" className="text-xs">Stop session?</Button>
          <Button variant="ghost" context="session" disabled>Disabled Ghost</Button>
        </div>
      </section>

      {/* Cards */}
      <section className="flex flex-col gap-md">
        <h2 className="text-xl font-semibold text-text-primary">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <Card>
            <h3 className="text-base font-semibold text-text-primary mb-xs">Neutral Card</h3>
            <p className="text-sm text-text-secondary">
              Default surface container with subtle border and card shadow.
            </p>
          </Card>

          <Card accentColor="primary">
            <h3 className="text-base font-semibold text-text-primary mb-xs">Primary Accent Card</h3>
            <p className="text-sm text-text-secondary">
              Card with primary left accent bar for active/highlighted items.
            </p>
          </Card>

          <Card accentColor="success">
            <h3 className="text-base font-semibold text-text-primary mb-xs">Success Accent Card</h3>
            <p className="text-sm text-text-secondary">
              Card with success left accent bar for completed session records.
            </p>
          </Card>

          <Card accentColor="error">
            <h3 className="text-base font-semibold text-text-primary mb-xs">Error Accent Card</h3>
            <p className="text-sm text-text-secondary">
              Card with error left accent bar for auth/form error notices.
            </p>
          </Card>
        </div>
      </section>

      {/* Inputs */}
      <section className="flex flex-col gap-md">
        <h2 className="text-xl font-semibold text-text-primary">Form Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <Input
            label="Session Label"
            placeholder="e.g. Write chapter 3"
            helperText="Optional descriptive label for this session"
          />
          <Input
            label="Email Address"
            type="email"
            defaultValue="user@invalid-domain"
            error="Please enter a valid email address."
          />
          <Input
            label="Disabled Field"
            defaultValue="Preset configuration"
            disabled
            helperText="This setting cannot be changed"
          />
        </div>
      </section>

      {/* Badges */}
      <section className="flex flex-col gap-md">
        <h2 className="text-xl font-semibold text-text-primary">Badges</h2>
        <div className="flex flex-wrap items-center gap-md">
          <Badge status="completed">Completed</Badge>
          <Badge status="active">Active</Badge>
          <Badge status="abandoned">Abandoned</Badge>
          <Badge status="on_break">On Break</Badge>
        </div>
      </section>
    </div>
  )
}
