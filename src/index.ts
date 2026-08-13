/** Host registration for browser goal-mode preferences. */

import type { Context } from '@deepseek-ai/cordis'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import {
  COMPOSER_ENTRY_FIELD,
  DEFAULT_COMPOSER_ENTRY_VISIBLE,
  GOAL_MODE_SETTINGS_NAMESPACE,
  type GoalModeSettings,
} from './settings-contract.ts'

export {
  COMPOSER_ENTRY_FIELD,
  DEFAULT_COMPOSER_ENTRY_VISIBLE,
  GOAL_MODE_SETTINGS_NAMESPACE,
  type GoalModeSettings,
} from './settings-contract.ts'

/** Durable goal-mode schema; also the wire envelope the browser scope validates against. */
export const GoalModeSettingsSchema: z<GoalModeSettings> = z.object({
  [COMPOSER_ENTRY_FIELD]: z.boolean().default(DEFAULT_COMPOSER_ENTRY_VISIBLE),
})

/**
 * Register the durable goal-mode section when a settings provider exists.
 * @param ctx - Host context whose optional settings service owns the section.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(
      settingsNamespace(GOAL_MODE_SETTINGS_NAMESPACE),
      GoalModeSettingsSchema,
    )
  })
}
