/**
 * Goal-mode preferences policy. It owns the live composer-entry visibility
 * preference and mirrors the durable Host section; the Settings row and the
 * composer entry share this one instance.
 */

import {
  createSnapshotStore, type SettingsScope, type SnapshotStore,
} from '@deepseek-ai/dsh-client-runtime/client'
import {
  COMPOSER_ENTRY_FIELD,
  DEFAULT_COMPOSER_ENTRY_VISIBLE,
  type GoalModeSettings,
} from '../settings-contract.ts'

/**
 * Composer-entry visibility policy used by both the Settings row and the
 * composer tool-row entry. Changes publish to the live store before the
 * durable write starts, so the entry hides immediately.
 */
export class GoalModeSettingsPolicy {
  /** Reactive visibility source for the Settings row and the composer entry. */
  readonly composerEntryVisible: SnapshotStore<boolean> = createSnapshotStore(DEFAULT_COMPOSER_ENTRY_VISIBLE)
  private readonly host: SettingsScope<GoalModeSettings> | undefined

  /**
   * @param host - durable preference scope owned by the providing plugin;
   * absent compositions stay process-local. The adoption subscription shares
   * the scope's plugin lifetime — a disposed scope never publishes again, so
   * the policy needs no release hook.
   */
  constructor(host?: SettingsScope<GoalModeSettings>) {
    this.host = host
    if (host !== undefined) {
      host.subscribe(() => { this.adopt(host) })
      this.adopt(host)
    }
  }

  /**
   * Change whether the composer tool-row entry renders; the live value
   * publishes before the durable write starts.
   * @param visible - the new visibility.
   */
  setComposerEntryVisible(visible: boolean): void {
    if (this.composerEntryVisible.getSnapshot() === visible) return
    this.composerEntryVisible.set(visible)
    void this.host?.set(COMPOSER_ENTRY_FIELD, visible)
  }

  /**
   * Adopt the scope's accepted durable value without writing it back.
   * @param host - the constructor-narrowed scope driving this adoption.
   */
  private adopt(host: SettingsScope<GoalModeSettings>): void {
    const section = host.getSnapshot().value
    if (section === undefined || this.composerEntryVisible.getSnapshot() === section.composerEntryVisible) return
    this.composerEntryVisible.set(section.composerEntryVisible)
  }
}
