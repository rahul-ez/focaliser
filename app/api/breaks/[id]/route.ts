import { createClient } from '@/lib/supabase/server'
import { endBreak } from '@/lib/db/breaks'
import { updateSessionStatus } from '@/lib/db/sessions'
import { z } from 'zod'

const patchBreakSchema = z.object({
  session_id: z.string().uuid(),
  ended_at: z.string().optional(),
  duration_seconds: z.number().int().min(0),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: breakId } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = patchBreakSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const endedAt = parsed.data.ended_at || new Date().toISOString()

    // Update break record with ended_at and duration_seconds
    const breakRecord = await endBreak(supabase, {
      break_id: breakId,
      user_id: user.id,
      ended_at: endedAt,
      duration_seconds: parsed.data.duration_seconds,
    })

    // Restore session status to 'active'
    await updateSessionStatus(supabase, {
      session_id: parsed.data.session_id,
      user_id: user.id,
      status: 'active',
    })

    return Response.json({ break: breakRecord })
  } catch (error) {
    console.error('[api/breaks/[id]:PATCH]', error)
    return Response.json({ error: 'Failed to end break' }, { status: 500 })
  }
}
