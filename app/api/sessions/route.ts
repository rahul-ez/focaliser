import { createClient } from '@/lib/supabase/server'
import { createSession } from '@/lib/db/sessions'
import { createSessionSchema } from '@/lib/validation/session'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createSessionSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const session = await createSession(supabase, {
      user_id: user.id,
      label: parsed.data.label ?? null,
      planned_duration_seconds: parsed.data.planned_duration_seconds,
    })

    return Response.json({ session }, { status: 201 })
  } catch (error) {
    console.error('[api/sessions:POST]', error)
    return Response.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
