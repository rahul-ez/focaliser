import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function EmptyHistory() {
  return (
    <Card className="flex flex-col items-center justify-center py-3xl px-xl text-center gap-md w-full">
      <Clock size={36} className="text-text-muted stroke-[1.5]" />
      <div className="flex flex-col gap-xs max-w-sm">
        <h3 className="text-base font-semibold text-text-primary">
          No past sessions yet
        </h3>
        <p className="text-sm text-text-secondary">
          Your completed focus sessions and break history will appear here once you finish a session.
        </p>
      </div>
      <Link href="/">
        <Button variant="primary">
          Start a Focus Session
        </Button>
      </Link>
    </Card>
  )
}
