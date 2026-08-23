import { createClient } from '@/lib/supabase/server'
import { closeSession, updateSessionStatus } from '@/lib/db/sessions'
import { z } from 'zod'

const patchSessionSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.enum(['completed', 'abandoned']),
    actual_focus_seconds: z.number().int().min(0),
    ended_at: z.string().optional(),
  }),
  z.object({
    status: z.enum(['active', 'on_break']),
  }),
])

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = patchSessionSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      )
    }

    if (parsed.data.status === 'completed' || parsed.data.status === 'abandoned') {
      const session = await closeSession(supabase, {
        session_id: sessionId,
        user_id: user.id,
        status: parsed.data.status,
        actual_focus_seconds: parsed.data.actual_focus_seconds,
        ended_at: parsed.data.ended_at || new Date().toISOString(),
      })
      return Response.json({ session })
    } else {
      const session = await updateSessionStatus(supabase, {
        session_id: sessionId,
        user_id: user.id,
        status: parsed.data.status,
      })
      return Response.json({ session })
    }
  } catch (error) {
    console.error('[api/sessions/[id]:PATCH]', error)
    return Response.json({ error: 'Failed to update session' }, { status: 500 })
  }
}
