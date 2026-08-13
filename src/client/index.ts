/**
 * dsh-goal-mode client plugin: the browser half of the enhanced goal
 * surface. Registers the GoalBar dock strip (conversation.input.dock,
 * replacing the shipped bar), the composer tool-row entry
 * (conversation.input.left), and the General-settings visibility row
 * (settings.general.item). The live goal arrives through the `goal` session
 * projection; mutation verbs route through the generated `remote.goals`
 * namespace (mounted by the web assembly's api-remotes), reading the CAS ref
 * from the session's current projected value at call time. The composer
 * entry's visibility is a Host-backed preference mirrored by a policy over
 * the settings scope. Viewing state (expanded/collapsed) is page-local and
 * shared through the `view` hook.
 */

import type { ClientContext, SessionId } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: the ctx.remote merge (the generated Remote namespaces).
import type {} from '@deepseek-ai/dsh-api-remotes/client'
// Type-only: the ctx.locale Context merge.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the ctx.settingsScope Context merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: the conversation SlotMap entries (input.dock / input.left) and
// the ui-settings General row entry.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Type-only: the `goal` SessionProjectionMap key merge.
import type { GoalProjection, GoalRef } from '@deepseek-ai/dsh-goal/client'
import type { GoalModeActionResult, GoalModeActions } from './slots.ts'
import { ComposerEntryRow, type ComposerEntryRowInjected } from './ComposerEntryRow.tsx'
import { GoalComposerButton, GoalDock } from './GoalBar.tsx'
import { GoalModeSettingsPolicy } from './settings-policy.ts'
import { createGoalModeViewStore, type GoalModeViewHandle } from './store.ts'
import { en, NS, zh } from './locales.ts'
import { cssText, STYLE_ID } from './styles.ts'

/** Required services for the dock, composer entry, settings row, Remote mutations, preferences, and copy. */
export const inject = ['slots', 'sessions', 'remote', 'remote.goals', 'locale', 'settingsScope']

/** The goal-mode viewing store handle: expanded/collapsed, shared by dock and composer entry. */
export function createGoalModeStore(): GoalModeViewHandle {
  return createGoalModeViewStore()
}

/** Injected viewing face: the shared store source (bound as useView) plus the toggle verbs. */
export interface GoalModeViewInjected {
  hooks: { view: ReturnType<typeof createGoalModeViewStore>['store'] }
  setExpanded: (value: boolean) => void
  toggleExpanded: () => void
  setCollapsed: (value: boolean) => void
}

/**
 * Compose the enhanced goal surface.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  // The stylesheet: one injected <style> element, idempotent across HMR.
  if (typeof document !== 'undefined' && document.getElementById(STYLE_ID) === null) {
    const tag = document.createElement('style')
    tag.id = STYLE_ID
    tag.textContent = cssText
    document.head.appendChild(tag)
  }

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-goal-mode: dictionaries')

  const sessions = ctx.sessions

  /** The session's current projected CAS ref, read at verb call time (no staleness fence: the RPC's CAS is the guard). */
  const refOf = (sessionId: SessionId): GoalRef | undefined => {
    const face = sessions.binding(sessionId)?.session.projections.faceOf('goal')
    const projection = face?.getSnapshot() as GoalProjection | null | undefined
    if (projection == null) return undefined
    return { id: projection.goal.id, revision: projection.goal.revision }
  }

  const noCurrentGoal: GoalModeActionResult = {
    ok: false,
    error: { code: 'no-current-goal', message: 'no current goal to mutate', details: {} },
  }

  // One viewing store shared by the dock strip and the composer entry, so
  // either can toggle the other (plugin-body instance; both slots are session
  // scope, so one handle serves both).
  const goalModeView = createGoalModeStore()

  // One preference policy shared by the Settings row and the composer entry,
  // mirroring the Host-backed durable section.
  const settingsPolicy = new GoalModeSettingsPolicy(
    ctx.settingsScope.bind<{ composerEntryVisible: boolean }>({ namespace: 'ui-goal-mode' }),
  )

  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'goal',
    priority: -10,
    order: 10,
    label: () => '目标',
    locale: NS,
    inject: (sessionId: SessionId): GoalModeActions & GoalModeViewInjected => ({
      hooks: { view: goalModeView.store },
      setExpanded: goalModeView.setExpanded,
      toggleExpanded: goalModeView.toggleExpanded,
      setCollapsed: goalModeView.setCollapsed,
      onCreate: async (objective, maxGoalRounds) =>
        await ctx.remote.goals.create(sessionId, { objective, ...(maxGoalRounds === undefined ? {} : { maxGoalRounds }) }),
      onEdit: async (objective, maxGoalRounds) => {
        const ref = refOf(sessionId)
        if (ref === undefined) return noCurrentGoal
        return await ctx.remote.goals.edit(sessionId, ref, { objective, ...(maxGoalRounds === undefined ? {} : { maxGoalRounds }) })
      },
      onPause: async () => {
        const ref = refOf(sessionId)
        if (ref === undefined) return noCurrentGoal
        return await ctx.remote.goals.pause(sessionId, ref)
      },
      onResume: async () => {
        const ref = refOf(sessionId)
        if (ref === undefined) return noCurrentGoal
        return await ctx.remote.goals.resume(sessionId, ref)
      },
      onComplete: async () => {
        const ref = refOf(sessionId)
        if (ref === undefined) return noCurrentGoal
        return await ctx.remote.goals.complete(sessionId, ref)
      },
      onClear: async () => {
        const ref = refOf(sessionId)
        if (ref === undefined) return noCurrentGoal
        return await ctx.remote.goals.clear(sessionId, ref)
      },
    }),
  }, GoalDock))

  // The composer tool-row entry (left end of the tool row, before the plan
  // seat): toggles the dock's expanded state, shows the phase dot, and
  // follows the Host-backed visibility preference.
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'goal-mode',
    priority: -10,
    order: 0,
    label: () => '目标',
    locale: NS,
    inject: (): Pick<GoalModeViewInjected, 'hooks'> & Pick<ComposerEntryRowInjected, 'hooks'> & { setCollapsed: (value: boolean) => void; toggleExpanded: () => void; setExpanded: (value: boolean) => void } => ({
      hooks: { view: goalModeView.store, composerEntryVisible: settingsPolicy.composerEntryVisible },
      setExpanded: goalModeView.setExpanded,
      toggleExpanded: goalModeView.toggleExpanded,
      setCollapsed: goalModeView.setCollapsed,
    }),
  }, GoalComposerButton))

  // General Settings row: the composer-entry visibility switch.
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'goal-mode',
    priority: -10,
    order: 25,
    locale: NS,
    inject: (): ComposerEntryRowInjected => ({
      hooks: { composerEntryVisible: settingsPolicy.composerEntryVisible },
      setComposerEntryVisible: (visible) => { settingsPolicy.setComposerEntryVisible(visible) },
    }),
  }, ComposerEntryRow))
}
