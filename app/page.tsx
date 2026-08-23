import { createClient } from '@/lib/supabase/server'
import { getUserSettings } from '@/lib/db/settings'
import { HomeClient } from '@/components/timer/HomeClient'
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
    <div className="max-w-5xl mx-auto px-lg md:px-xl py-xl md:py-2xl w-full flex flex-col items-center">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary leading-[1.1] text-center mb-xl">
        Ready to focus?
      </h1>
      <HomeClient initialDuration={initialDuration} />
    </div>
  )
}
