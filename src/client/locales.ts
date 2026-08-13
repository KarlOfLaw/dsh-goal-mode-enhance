/** Locale dictionaries for the enhanced goal surface. Copy keys are Chinese product copy with English twins. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'phase.active': '进行中目标',
  'phase.paused': '已暂停目标',
  'phase.blocked': '已阻塞目标',
  'phase.complete': '已完成目标',
  'empty.create': '设定目标',
  'create.placeholder': '设定目标…（可多行）',
  'create.submit': '创建目标',
  'create.cancel': '取消',
  'edit.placeholder': '目标内容',
  'edit.save': '保存',
  'edit.cancel': '取消',
  'edit.rounds': '轮次上限(可选)',
  'rounds.text': '已进行 {rounds} 轮',
  'rounds.cap': '{rounds} / {cap} 轮',
  'badge.cap': '已达轮次上限',
  'cap.hint': '已达轮次上限 — 可修改上限，或完成、清除',
  'action.pause': '暂停',
  'action.resume': '恢复',
  'action.edit': '编辑',
  'action.complete': '完成',
  'action.clear': '清除',
  'objective.aria': '目标内容',
  'composer.aria': '目标模式',
  'collapse': '收起目标栏',
  'expand': '展开目标栏',
  'settings.composerEntry.title': '在输入框工具行显示目标入口',
  'settings.composerEntry.description': '关闭后输入框上方的目标工具入口不再显示，目标条仍可通过其他方式使用',
} satisfies Record<string, string>

/** The goal-mode namespace key union. */
export type GoalModeKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'phase.active': 'Ongoing Goal',
  'phase.paused': 'Paused Goal',
  'phase.blocked': 'Blocked Goal',
  'phase.complete': 'Completed Goal',
  'empty.create': 'Set a goal',
  'create.placeholder': 'Set a goal… (multiline)',
  'create.submit': 'Create goal',
  'create.cancel': 'Cancel',
  'edit.placeholder': 'Goal objective',
  'edit.save': 'Save',
  'edit.cancel': 'Cancel',
  'edit.rounds': 'Round cap (optional)',
  'rounds.text': '{rounds} round(s) done',
  'rounds.cap': '{rounds} / {cap} rounds',
  'badge.cap': 'Round cap reached',
  'cap.hint': 'Round cap reached — edit the cap, complete, or clear',
  'action.pause': 'Pause goal',
  'action.resume': 'Resume goal',
  'action.edit': 'Edit goal',
  'action.complete': 'Complete goal',
  'action.clear': 'Clear goal',
  'objective.aria': 'Goal objective',
  'composer.aria': 'Goal mode',
  'collapse': 'Collapse goal bar',
  'expand': 'Expand goal bar',
  'settings.composerEntry.title': 'Show the goal entry in the composer tool row',
  'settings.composerEntry.description': 'When off, the goal tool-row entry above the input hides; the goal bar stays usable',
} satisfies Record<GoalModeKey, string>

/** The goal-mode locale namespace. */
export const NS = 'goalMode'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The enhanced goal surface copy. */
    [NS]: GoalModeKey
  }
}
