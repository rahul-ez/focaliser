import { z } from 'zod'
import {
  MIN_SESSION_DURATION_SECONDS,
  MAX_SESSION_DURATION_SECONDS,
  SESSION_LABEL_MAX_LENGTH,
} from '@/lib/constants'

export const createSessionSchema = z.object({
  label: z
    .string()
    .max(SESSION_LABEL_MAX_LENGTH)
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  planned_duration_seconds: z
    .number()
    .int()
    .min(MIN_SESSION_DURATION_SECONDS)
    .max(MAX_SESSION_DURATION_SECONDS),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
