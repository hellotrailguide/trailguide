import { createClient } from '@supabase/supabase-js'

/**
 * Seed script: inserts realistic demo analytics events into Supabase.
 *
 * Usage:
 *   pnpm --filter editor seed:analytics
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
 * apps/editor/.env.local (or environment).
 */

// Load .env.local from the editor app
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
    'Make sure apps/editor/.env.local is configured.'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// --- Configuration ---

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000' // deterministic demo UUID
const TRAIL_ID = 'demo-onboarding'
const STEPS = [
  { id: 'welcome', index: 0 },
  { id: 'new-project', index: 1 },
  { id: 'invite-team', index: 2 },
  { id: 'view-reports', index: 3 },
  { id: 'settings', index: 4 },
]

// Drop-off probability at each step (cumulative users who quit before completing)
const STEP_DROP_OFF = [0.05, 0.12, 0.18, 0.10, 0.08]
const DISMISS_RATE = 0.06 // chance a user dismisses at any step

const DAYS = 30
const SESSIONS_PER_DAY_RANGE = [15, 40] // min/max sessions per day

type EventType =
  | 'trail_started'
  | 'step_viewed'
  | 'step_completed'
  | 'trail_completed'
  | 'trail_skipped'

interface SeedEvent {
  trail_id: string
  user_id: string
  event_type: EventType
  step_id: string | null
  step_index: number | null
  session_id: string
  created_at: string
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateEvents(): SeedEvent[] {
  const events: SeedEvent[] = []
  const now = new Date()

  for (let d = DAYS; d >= 0; d--) {
    const day = new Date(now)
    day.setDate(day.getDate() - d)

    // Weekdays get more traffic
    const dayOfWeek = day.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const multiplier = isWeekend ? 0.5 : 1

    const sessionsToday = Math.round(
      randomInt(SESSIONS_PER_DAY_RANGE[0], SESSIONS_PER_DAY_RANGE[1]) * multiplier
    )

    for (let s = 0; s < sessionsToday; s++) {
      const sessionId = `seed-${d}-${s}-${Math.random().toString(36).slice(2, 9)}`

      // Random time within the day (business hours weighted)
      const hour = randomInt(7, 22)
      const minute = randomInt(0, 59)
      const second = randomInt(0, 59)
      const ts = new Date(day)
      ts.setHours(hour, minute, second, randomInt(0, 999))

      // trail_started
      events.push({
        trail_id: TRAIL_ID,
        user_id: DEMO_USER_ID,
        event_type: 'trail_started',
        step_id: STEPS[0].id,
        step_index: 0,
        session_id: sessionId,
        created_at: ts.toISOString(),
      })

      let completed = true
      for (let i = 0; i < STEPS.length; i++) {
        const step = STEPS[i]
        const stepTs = new Date(ts.getTime() + (i + 1) * randomInt(3000, 15000))

        // step_viewed
        events.push({
          trail_id: TRAIL_ID,
          user_id: DEMO_USER_ID,
          event_type: 'step_viewed',
          step_id: step.id,
          step_index: step.index,
          session_id: sessionId,
          created_at: stepTs.toISOString(),
        })

        // Check for dismiss
        if (Math.random() < DISMISS_RATE) {
          events.push({
            trail_id: TRAIL_ID,
            user_id: DEMO_USER_ID,
            event_type: 'trail_skipped',
            step_id: step.id,
            step_index: step.index,
            session_id: sessionId,
            created_at: new Date(stepTs.getTime() + randomInt(1000, 5000)).toISOString(),
          })
          completed = false
          break
        }

        // Check for drop-off
        if (Math.random() < STEP_DROP_OFF[i]) {
          // User just leaves without completing this step — no more events
          completed = false
          break
        }

        // step_completed
        events.push({
          trail_id: TRAIL_ID,
          user_id: DEMO_USER_ID,
          event_type: 'step_completed',
          step_id: step.id,
          step_index: step.index,
          session_id: sessionId,
          created_at: new Date(stepTs.getTime() + randomInt(2000, 8000)).toISOString(),
        })
      }

      if (completed) {
        const finishTs = new Date(
          ts.getTime() + (STEPS.length + 1) * randomInt(3000, 15000)
        )
        events.push({
          trail_id: TRAIL_ID,
          user_id: DEMO_USER_ID,
          event_type: 'trail_completed',
          step_id: STEPS[STEPS.length - 1].id,
          step_index: STEPS.length - 1,
          session_id: sessionId,
          created_at: finishTs.toISOString(),
        })
      }
    }
  }

  return events
}

async function main() {
  console.log('Generating demo analytics events...')
  const events = generateEvents()
  console.log(`Generated ${events.length} events over ${DAYS} days.`)

  // Delete any existing demo events first
  console.log('Clearing previous demo events...')
  const { error: deleteError } = await supabase
    .from('analytics_events')
    .delete()
    .eq('user_id', DEMO_USER_ID)
    .eq('trail_id', TRAIL_ID)

  if (deleteError) {
    console.error('Failed to clear old events:', deleteError.message)
    process.exit(1)
  }

  // Insert in batches of 500
  const BATCH_SIZE = 500
  let inserted = 0

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('analytics_events').insert(batch)

    if (error) {
      console.error(`Failed to insert batch at offset ${i}:`, error.message)
      process.exit(1)
    }

    inserted += batch.length
    console.log(`  Inserted ${inserted}/${events.length}`)
  }

  console.log('Done! Seeded analytics for trail:', TRAIL_ID)
}

main()
