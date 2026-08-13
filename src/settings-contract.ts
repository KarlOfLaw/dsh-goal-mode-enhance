/** Browser-safe goal-mode settings contract shared by the Host and client halves. */

/** Settings namespace owned by the goal-mode plugin. */
export const GOAL_MODE_SETTINGS_NAMESPACE = 'ui-goal-mode'

/** Field carrying whether the composer tool-row goal entry renders. */
export const COMPOSER_ENTRY_FIELD = 'composerEntryVisible'

/** Default keeps the composer tool-row entry visible. */
export const DEFAULT_COMPOSER_ENTRY_VISIBLE = true

/** Durable goal-mode section shared by the Host schema and browser scope. */
export interface GoalModeSettings {
  /** Whether the composer tool-row goal entry renders. */
  composerEntryVisible: boolean
}
