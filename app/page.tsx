import { createClient } from '@/lib/supabase/server'
import { getUserSettings } from '@/lib/db/settings'
import { HomeSessionForm } from '@/components/timer/HomeSessionForm'
import { DEFAULT_DURATION_SECONDS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialDuration = DEFAULT_DURATION_SECONDS

  if (user) {
    const settings = await getUserSettings(supabase, user.id)
    initialDuration = settings.default_duration_seconds
  }

  return (
    <main className="w-full min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center px-xl">
      <h1 className="font-serif font-medium text-text-primary text-center leading-[1.15] mb-2xl text-[clamp(2.5rem,6vw,5rem)]">
        Ready to focus?
      </h1>
      <HomeSessionForm initialDuration={initialDuration} />
    </main>
  )
}
