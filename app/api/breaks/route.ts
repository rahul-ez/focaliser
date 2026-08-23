import { createClient } from '@/lib/supabase/server'
import { createBreak } from '@/lib/db/breaks'
import { updateSessionStatus } from '@/lib/db/sessions'
import { z } from 'zod'

const createBreakSchema = z.object({
  session_id: z.string().uuid(),
})

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
    const parsed = createBreakSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      )
    }

    // Insert break record
    const breakRecord = await createBreak(supabase, {
      session_id: parsed.data.session_id,
      user_id: user.id,
    })

    // Update session status to 'on_break'
    await updateSessionStatus(supabase, {
      session_id: parsed.data.session_id,
      user_id: user.id,
      status: 'on_break',
    })

    return Response.json({ break: breakRecord }, { status: 201 })
  } catch (error) {
    console.error('[api/breaks:POST]', error)
    return Response.json({ error: 'Failed to create break' }, { status: 500 })
  }
}
