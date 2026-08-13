/**
 * The goal-mode surface stylesheet, hand-written as a template string and
 * injected once by the plugin body: the web server serves exactly one file per
 * client plugin, so no separate CSS artifact may exist. Tokens come only from
 * the shared `--dsw-alias-*` / `--dsh-composer-*` design platform (no literal
 * colors except the two phase-badge ambers the shipped bar also hardcodes);
 * class names carry the `dsh_gm_` prefix to stay unique in the assembled shell.
 */

/** Stable `<style>` element id (idempotent injection across HMR re-runs). */
export const STYLE_ID = 'dsh-goal-mode-style'

/** The goal-mode surface's injected stylesheet text. */
export const cssText = `
.dsh_gm_dock {
  box-sizing: border-box;
  width: calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));
  margin: 0 auto;
}
.dsh_gm_bar {
  box-sizing: border-box;
  width: 100%;
  max-width: calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-specific-tip);
  border-radius: 12px;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  margin: 0 auto;
  padding: 4px 5px 4px 12px;
  display: flex;
  flex-wrap: wrap;
  color: var(--dsw-alias-label-tertiary);
}
.dsh_gm_label {
  flex: none;
  font-size: 13px;
  font-weight: 500;
  line-height: 24px;
  white-space: nowrap;
  color: var(--dsw-alias-label-primary);
}
.dsh_gm_objective {
  min-width: 0;
  color: var(--dsw-alias-label-primary-dimmed);
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  font-size: 13px;
  line-height: 20px;
  overflow: hidden;
}
.dsh_gm_rounds {
  flex: none;
  color: var(--dsw-alias-label-caption);
  font-size: 12px;
  line-height: 20px;
  white-space: nowrap;
}
.dsh_gm_progress {
  display: inline-flex;
  width: 48px;
  height: 4px;
  border-radius: 2px;
  background: var(--dsw-alias-border-l1);
  overflow: hidden;
  flex: none;
}
.dsh_gm_progressFill {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--dsw-alias-state-business-primary);
}
.dsh_gm_badgeCap {
  flex: none;
  font-size: 11px;
  line-height: 18px;
  border: 1px solid #d29922;
  border-radius: 999px;
  padding: 0 8px;
  color: #d29922;
  white-space: nowrap;
}
.dsh_gm_hint {
  box-sizing: border-box;
  width: 100%;
  max-width: calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));
  margin: 2px auto 0;
  color: #d29922;
  font-size: 12px;
  line-height: 18px;
  padding: 0 4px;
}
.dsh_gm_form {
  box-sizing: border-box;
  width: 100%;
  max-width: calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-specific-tip);
  border-radius: 12px;
  margin: 0 auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dsh_gm_formRow {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  justify-content: flex-end;
}
.dsh_gm_textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 76px;
  resize: vertical;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  border-radius: 6px;
  outline: none;
  padding: 8px;
  font-size: 13px;
  line-height: 20px;
  font-family: inherit;
}
.dsh_gm_textarea:focus {
  border-color: var(--dsw-alias-state-business-primary);
}
.dsh_gm_roundsInput {
  box-sizing: border-box;
  width: 120px;
  height: 26px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  border-radius: 6px;
  outline: none;
  padding: 0 8px;
  font-size: 13px;
  line-height: 20px;
  flex: none;
}
.dsh_gm_btn {
  flex: none;
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-secondary);
  border-radius: 6px;
  font-size: 12px;
  line-height: 24px;
  cursor: pointer;
  white-space: nowrap;
}
.dsh_gm_btnPrimary {
  flex: none;
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-state-business-primary);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-state-business-primary);
  border-radius: 6px;
  font-size: 12px;
  line-height: 24px;
  cursor: pointer;
  white-space: nowrap;
}
.dsh_gm_btn:disabled,
.dsh_gm_btnPrimary:disabled {
  opacity: 0.5;
  cursor: default;
}
.dsh_gm_iconBtn {
  flex: none;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--dsw-alias-label-secondary);
}
.dsh_gm_iconBtn:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dsh_gm_iconBtn:disabled {
  opacity: 0.5;
  cursor: default;
}
.dsh_gm_error {
  min-width: 0;
  color: var(--dsw-alias-state-error-primary);
  font-size: 12px;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh_gm_chip {
  box-sizing: border-box;
  width: max-content;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-specific-tip);
  border-radius: 999px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 24px;
  cursor: pointer;
  white-space: nowrap;
}
.dsh_gm_chip:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dsh_gm_chipDot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
}
.dsh_gm_chipRounds {
  flex: none;
}
.dsh_gm_dotActive {
  background: var(--dsw-alias-state-success-primary);
}
.dsh_gm_dotPaused {
  background: var(--dsw-alias-state-warn-primary);
}
.dsh_gm_dotBlocked {
  background: var(--dsw-alias-state-error-primary);
}
.dsh_gm_dotComplete {
  background: var(--dsw-alias-label-caption);
}
.dsh_gm_composerBtn {
  position: relative;
  flex: none;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--dsw-alias-label-secondary);
}
.dsh_gm_composerBtn:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dsh_gm_composerBtnActive {
  color: var(--dsw-alias-state-business-primary);
  background: var(--dsw-alias-state-business-tertiary);
}
.dsh_gm_composerDot {
  position: absolute;
  right: 5px;
  bottom: 5px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid var(--dsw-alias-bg-base);
}
.dsh_gm_settings {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-width: 0;
  height: auto;
  min-height: 0;
  padding: 4px 2px 12px;
  box-sizing: border-box;
  overflow: visible;
}
.dsh_gm_settings > * {
  flex: 0 0 auto;
}
.dsh_gm_settingsTitle {
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
  line-height: 20px;
}
.dsh_gm_settingsCard {
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 10px;
  background: var(--dsw-specific-tip);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dsh_gm_settingsPageCard {
  flex: 0 0 auto !important;
  align-self: stretch;
  width: 100%;
  height: fit-content !important;
  min-height: 0 !important;
  box-sizing: border-box;
}
.dsh_gm_settingsHelpCard {
  display: block !important;
}
.dsh_gm_settingsHelp {
  display: block !important;
  height: auto !important;
  min-height: 0 !important;
  color: var(--dsw-alias-label-primary-dimmed);
  font-size: 13px;
  line-height: 20px !important;
  white-space: normal;
  overflow-wrap: anywhere;
}
.dsh_gm_settingsRow {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dsh_gm_settingsObjective {
  color: var(--dsw-alias-label-primary-dimmed);
  font-size: 13px;
  line-height: 20px;
  overflow-wrap: anywhere;
  white-space: normal;
}
.dsh_gm_settingsDetails {
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
.dsh_gm_settingsDetails summary {
  cursor: pointer;
  width: fit-content;
  user-select: none;
}
.dsh_gm_settingsObjectiveFull {
  margin-top: 8px;
  max-height: 260px;
  overflow: auto;
  border-top: 1px solid var(--dsw-alias-border-l1);
  padding-top: 8px;
  color: var(--dsw-alias-label-primary-dimmed);
  font-size: 12px;
  line-height: 19px;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.dsh_gm_switch {
  position: relative;
  flex: none;
  width: 40px;
  height: 24px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-module-platform);
  cursor: pointer;
  padding: 0;
}
.dsh_gm_switchOn {
  border-color: var(--dsw-alias-state-business-primary);
  background: var(--dsw-alias-state-business-primary);
}
.dsh_gm_switchKnob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--dsw-alias-bg-base);
  transition: left 0.15s ease;
}
.dsh_gm_switchOn .dsh_gm_switchKnob {
  left: 18px;
}
`
