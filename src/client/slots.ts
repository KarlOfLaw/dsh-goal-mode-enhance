/**
 * Injected business face of the goal-mode dock entry: the mutation verbs,
 * including goal creation and completion that the shipped GoalBar omits.
 * Live state arrives through `useProjection('goal')`, not this face.
 */

import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'

/** Settled outcome of one goal mutation, rendered inline by the strip. */
export type GoalModeActionResult = RemoteResult<unknown>

/** Injected business face of the GoalBar dock entry. */
export interface GoalModeActions {
  /** Create a new goal (arms continuation). */
  onCreate: (objective: string, maxGoalRounds?: number) => Promise<GoalModeActionResult>
  /** Replace the current goal's objective and/or round cap (CAS on the projected ref). */
  onEdit: (objective: string, maxGoalRounds?: number) => Promise<GoalModeActionResult>
  /** Pause an active goal. */
  onPause: () => Promise<GoalModeActionResult>
  /** Resume a paused goal. */
  onResume: () => Promise<GoalModeActionResult>
  /** Mark the current goal complete. */
  onComplete: () => Promise<GoalModeActionResult>
  /** Clear the current goal (tombstone). */
  onClear: () => Promise<GoalModeActionResult>
}
