/**
 * Package-owned invariant companion for `dsh-goal-mode`.
 * @module dsh-goal-mode/invariant
 */

import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = 'dsh-goal-mode'

/** Cordis companion plugin name. */
export const name = 'goal-mode-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the surface is a set of slot registrations whose
 * disposal is proven by the HMR-safety spec, plus a settings-section schema
 * registration that the settings service owns. The plugin emits no cordis
 * events and holds no cross-plugin mutable host state (viewing state and
 * preference mirrors are page-local browser stores).
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
