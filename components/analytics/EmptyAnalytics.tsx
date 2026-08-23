import Link from 'next/link'
import { BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function EmptyAnalytics() {
  return (
    <Card className="flex flex-col items-center justify-center py-3xl px-xl text-center gap-md w-full">
      <BarChart2 size={36} className="text-text-muted stroke-[1.5]" />
      <div className="flex flex-col gap-xs max-w-sm">
        <h3 className="text-base font-semibold text-text-primary">
          No focus data yet
        </h3>
        <p className="text-sm text-text-secondary">
          Complete a focus session to view your daily and weekly habit analytics.
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
