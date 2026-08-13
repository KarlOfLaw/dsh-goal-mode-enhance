// dsh-goal-mode — code.client（浏览器半边）
// 版本：pkg-15（权威轮次轮询 / 双击复用 / 滚动修复 / 五项提升 / SVG 图标 / 多行编辑）
// 用途：Goal 栏（conversation.input.dock，替换原生 goal 单元）、
//       会话头部入口（conversation.session.header.actions）、
//       设置页「目标」（settings.section）。
// 用法：把本文件内容作为 cordis_define 的 code.client。

const PHASE_LABELS = { active: '进行中目标', paused: '已暂停目标', blocked: '已阻塞目标', complete: '已完成目标' }
const PHASE_DOT = { active: '#3fb950', paused: '#d29922', blocked: '#f85149', complete: '#8b949e' }
const STALE_MS = 10 * 60 * 1000

let pluginCtx = null

const ui = (() => {
  let expanded = false
  let pendingPrefill = null
  const listeners = new Set()
  return {
    isExpanded: () => expanded,
    toggle: () => { expanded = !expanded; listeners.forEach((fn) => fn()) },
    setExpanded: (v) => { if (expanded !== v) { expanded = v; listeners.forEach((fn) => fn()) } },
    subscribe: (fn) => { listeners.add(fn); return () => { listeners.delete(fn) } },
    prefill: (p) => { pendingPrefill = p; expanded = true; listeners.forEach((fn) => fn()) },
    takePrefill: () => { const p = pendingPrefill; pendingPrefill = null; return p }
  }
})()

function useExpanded() {
  const [value, setValue] = React.useState(ui.isExpanded())
  React.useEffect(() => ui.subscribe(() => setValue(ui.isExpanded())), [])
  return value
}

const cleanError = (e) => {
  const raw = e instanceof Error ? e.message : String(e)
  const m = raw.match(/failed inside the host handler:\s*([\s\S]*)$/)
  return m ? m[1].trim() : raw
}

const roundsText = (g) => {
  const started = g.roundsStarted === undefined || g.roundsStarted === null ? 0 : g.roundsStarted
  if (g.maxGoalRounds === undefined || g.maxGoalRounds === null) return '已进行 ' + started + ' 轮'
  return started + ' / ' + g.maxGoalRounds + ' 轮'
}

const capPct = (g) => {
  if (g.maxGoalRounds === undefined || g.maxGoalRounds === null || g.maxGoalRounds <= 0) return null
  const started = g.roundsStarted === undefined || g.roundsStarted === null ? 0 : g.roundsStarted
  return Math.min(100, Math.round((started / g.maxGoalRounds) * 100))
}

const svg = (paths, size) => React.createElement('svg', {
  width: size, height: size, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true
}, ...paths)

const Icons = {
  pause: (s) => svg([
    React.createElement('line', { key: 'a', x1: '6', y1: '4', x2: '6', y2: '20' }),
    React.createElement('line', { key: 'b', x1: '18', y1: '4', x2: '18', y2: '20' })
  ], s || 14),
  play: (s) => svg([React.createElement('polygon', { key: 'a', points: '5 3 19 12 5 21 5 3' })], s || 14),
  edit: (s) => svg([React.createElement('path', { key: 'a', d: 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z' })], s || 14),
  check: (s) => svg([React.createElement('polyline', { key: 'a', points: '20 6 9 17 4 12' })], s || 14),
  trash: (s) => svg([
    React.createElement('polyline', { key: 'a', points: '3 6 5 6 21 6' }),
    React.createElement('path', { key: 'b', d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }),
    React.createElement('line', { key: 'c', x1: '10', y1: '11', x2: '10', y2: '17' }),
    React.createElement('line', { key: 'd', x1: '14', y1: '11', x2: '14', y2: '17' })
  ], s || 14),
  clock: (s) => svg([
    React.createElement('circle', { key: 'a', cx: '12', cy: '12', r: '10' }),
    React.createElement('polyline', { key: 'b', points: '12 6 12 12 16 14' })
  ], s || 14),
  plus: (s) => svg([
    React.createElement('line', { key: 'a', x1: '12', y1: '5', x2: '12', y2: '19' }),
    React.createElement('line', { key: 'b', x1: '5', y1: '12', x2: '19', y2: '12' })
  ], s || 14),
  alert: (s) => svg([
    React.createElement('path', { key: 'a', d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }),
    React.createElement('line', { key: 'b', x1: '12', y1: '9', x2: '12', y2: '13' }),
    React.createElement('line', { key: 'c', x1: '12', y1: '17', x2: '12.01', y2: '17' })
  ], s || 14),
  target: (s) => svg([
    React.createElement('circle', { key: 'a', cx: '12', cy: '12', r: '10' }),
    React.createElement('circle', { key: 'b', cx: '12', cy: '12', r: '6' }),
    React.createElement('circle', { key: 'c', cx: '12', cy: '12', r: '2' })
  ], s || 14),
  checkCircle: (s) => svg([
    React.createElement('path', { key: 'a', d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
    React.createElement('polyline', { key: 'b', points: '22 4 12 14.01 9 11.01' })
  ], s || 14)
}

const CSS = '.gmb-dock{box-sizing:border-box;width:calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));margin:0 auto}' +
  '.gmb-row{box-sizing:border-box;width:100%;max-width:calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-specific-tip);border-radius:12px;align-items:center;gap:6px;min-height:36px;margin:0 auto;padding:4px 5px 4px 12px;display:flex;flex-wrap:wrap}' +
  '.gmb-form{box-sizing:border-box;width:100%;max-width:calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-specific-tip);border-radius:12px;align-items:center;gap:8px;margin:0 auto;padding:8px;display:flex;flex-wrap:wrap}' +
  '.gmb-form-col{flex-direction:column;align-items:stretch}' +
  '.gmb-form-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;width:100%;justify-content:flex-end}' +
  '.gmb-glyph{color:var(--dsw-alias-label-tertiary);flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px}' +
  '.gmb-muted{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:24px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
  '.gmb-label{flex:none;font-size:13px;font-weight:500;line-height:24px;white-space:nowrap}' +
  '.gmb-objective{min-width:0;color:var(--dsw-alias-label-primary-dimmed);text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:13px;line-height:20px;overflow:hidden}' +
  '.gmb-rounds{flex:none;display:inline-flex;align-items:center;gap:6px;color:var(--dsw-alias-label-caption);font-size:12px;line-height:20px;white-space:nowrap}' +
  '.gmb-rounds-input{width:120px;flex:none}' +
  '.gmb-bar{display:inline-flex;width:48px;height:4px;border-radius:2px;background:var(--dsw-alias-border-l1);overflow:hidden}' +
  '.gmb-bar-fill{display:block;height:100%;border-radius:2px;background:var(--dsw-alias-state-business-primary)}' +
  '.gmb-badge{flex:none;font-size:11px;line-height:18px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:0 8px;color:var(--dsw-alias-label-secondary);white-space:nowrap}' +
  '.gmb-badge-cap{color:#d29922;border-color:#d29922}' +
  '.gmb-badge-stale{color:#d29922;border-color:#d29922}' +
  '.gmb-cap-hint{box-sizing:border-box;width:100%;max-width:calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));margin:2px auto 0;color:#d29922;font-size:12px;line-height:18px;padding:0 4px}' +
  '.gmb-scroll{max-height:300px;overflow-y:auto;padding-right:2px;display:flex;flex-direction:column}' +
  '.gmb-ibtn{flex:none;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;background:transparent;border-radius:6px;cursor:pointer;color:var(--dsw-alias-label-secondary)}' +
  '.gmb-ibtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}' +
  '.gmb-ibtn:disabled{opacity:.5;cursor:default}' +
  '.gmb-ibtn-danger{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}' +
  '.gmb-ibtn-primary{color:var(--dsw-alias-state-business-primary)}' +
  '.gmb-btn{flex:none;height:26px;padding:0 10px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);border-radius:6px;font-size:12px;line-height:24px;cursor:pointer;white-space:nowrap}' +
  '.gmb-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}' +
  '.gmb-btn:disabled{opacity:.5;cursor:default}' +
  '.gmb-primary{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}' +
  '.gmb-danger{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}' +
  '.gmb-input{box-sizing:border-box;height:26px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:6px;outline:none;padding:0 8px;font-size:13px;line-height:20px;min-width:0}' +
  '.gmb-input:focus{border-color:var(--dsw-alias-state-business-primary)}' +
  '.gmb-textarea{width:100%;min-height:76px;height:auto;resize:vertical;padding:8px;font-family:inherit;line-height:20px}' +
  '.gmb-obj{flex:1}' +
  '.gmb-error{box-sizing:border-box;width:100%;max-width:calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));margin:4px auto 0;color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px;padding:0 4px}' +
  '.gmb-blocked{box-sizing:border-box;width:100%;max-width:calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));margin:0 auto;color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px;padding:2px 4px 4px;opacity:.9}' +
  '.gmb-hist{box-sizing:border-box;width:100%;max-width:calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));margin:4px auto 0;padding:8px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-specific-tip);display:flex;flex-direction:column;gap:4px}' +
  '.gmb-clickable{cursor:pointer}' +
  '.gmb-clickable:hover{background:var(--dsw-alias-interactive-bg-hover)}' +
  '.gmb-header-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border:none;background:transparent;border-radius:8px;cursor:pointer;color:var(--dsw-alias-label-secondary)}' +
  '.gmb-header-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}' +
  '.gmb-header-active{background:var(--dsw-alias-interactive-bg-hover)}' +
  '.gmb-header-glyph{display:inline-flex;align-items:center;justify-content:center}' +
  '.gmb-header-dot{position:absolute;right:3px;bottom:3px;width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-border-l1);border:1.5px solid var(--dsw-alias-bg-base)}' +
  '.gmb-set{display:flex;flex-direction:column;gap:10px;padding:4px 2px;max-height:calc(100vh - 140px);overflow-y:auto}' +
  '.gmb-set-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);line-height:20px}' +
  '.gmb-set-none{font-size:13px;color:var(--dsw-alias-label-tertiary);line-height:20px}' +
  '.gmb-set-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-specific-tip);padding:10px 12px;display:flex;flex-direction:column;gap:6px}' +
  '.gmb-set-row{display:flex;align-items:center;gap:8px}' +
  '.gmb-set-dot{width:8px;height:8px;border-radius:50%;flex:none}' +
  '.gmb-set-phase{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary)}' +
  '.gmb-set-rounds{font-size:12px;color:var(--dsw-alias-label-caption);margin-left:auto}' +
  '.gmb-set-objective{font-size:13px;color:var(--dsw-alias-label-primary-dimmed);line-height:20px;word-break:break-word}' +
  '.gmb-set-blocked{font-size:12px;color:var(--dsw-alias-state-error-primary);line-height:18px}' +
  '.gmb-set-meta{font-size:12px;color:var(--dsw-alias-label-caption);line-height:18px}' +
  '.gmb-set-item{display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-bottom:1px solid var(--dsw-alias-border-l1);border-radius:6px}' +
  '.gmb-set-item:last-child{border-bottom:none}' +
  '.gmb-set-item-main{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}' +
  '.gmb-set-item-obj{font-size:13px;color:var(--dsw-alias-label-primary);line-height:18px;word-break:break-word}' +
  '.gmb-set-item-meta{font-size:12px;color:var(--dsw-alias-label-caption);line-height:16px}' +
  '.gmb-set-actions{display:flex;gap:8px}'

function GoalDock(props) {
  const projection = props.useProjection('goal')
  const loading = projection === undefined
  const goal = projection === undefined || projection === null ? null : projection.goal
  const expanded = useExpanded()
  const [draftObjective, setDraftObjective] = React.useState('')
  const [draftRounds, setDraftRounds] = React.useState('')
  const [error, setError] = React.useState(null)
  const [busy, setBusy] = React.useState(false)
  const [confirm, setConfirm] = React.useState(null)
  const [showHistory, setShowHistory] = React.useState(false)
  const [historyData, setHistoryData] = React.useState(null)
  const [liveGoal, setLiveGoal] = React.useState(null)
  const lastRoundsRef = React.useRef(null)
  const lastProgressRef = React.useRef(Date.now())

  const goalId = goal === null || goal === undefined ? null : goal.id
  const goalRev = goal === null || goal === undefined ? null : goal.revision

  const pollGoal = (sid) => {
    if (typeof sid !== 'string' || sid.length === 0) return
    host.call('goal-view', { sessionId: sid }).then((res) => {
      if (res !== null && res !== undefined && res.ok === true) {
        const g = res.goal
        setLiveGoal(g)
        if (g !== null && typeof g.roundsStarted === 'number') {
          if (lastRoundsRef.current === null || g.roundsStarted > lastRoundsRef.current) {
            lastRoundsRef.current = g.roundsStarted
            lastProgressRef.current = Date.now()
          }
        }
      }
    }).catch(() => {})
  }

  React.useEffect(() => {
    if (pluginCtx === null) return undefined
    pollGoal(props.sessionId)
    return pluginCtx.interval(() => pollGoal(props.sessionId), 20000)
  }, [props.sessionId])

  React.useEffect(() => {
    setError(null)
    setConfirm(null)
    const canCreateNow = goal === null || (goal !== null && goal.phase === 'complete')
    const prefill = canCreateNow ? ui.takePrefill() : null
    if (prefill !== null && prefill !== undefined) {
      setDraftObjective(prefill.objective === undefined ? '' : prefill.objective)
      setDraftRounds(prefill.maxGoalRounds === undefined || prefill.maxGoalRounds === null ? '' : String(prefill.maxGoalRounds))
      return
    }
    if (expanded && goal !== null && goal !== undefined && goal.phase !== 'complete') {
      setDraftObjective(goal.objective === undefined ? '' : goal.objective)
      setDraftRounds(goal.maxGoalRounds === undefined || goal.maxGoalRounds === null ? '' : String(goal.maxGoalRounds))
    } else {
      setDraftObjective('')
      setDraftRounds('')
    }
  }, [expanded, goalId, goalRev])

  if (loading) return null

  const needSession = () => {
    if (typeof props.sessionId === 'string' && props.sessionId.length > 0) return true
    setError('会话信息缺失，请刷新页面后重试')
    return false
  }

  const run = async (method, payload, done) => {
    setBusy(true)
    setError(null)
    try {
      const res = await host.call(method, payload)
      if (res === null || res === undefined || res.ok !== true) {
        setError(res !== null && res !== undefined && typeof res.message === 'string' ? res.message : '操作失败')
      } else if (done) {
        done(res)
      }
    } catch (e) {
      setError(cleanError(e))
    } finally {
      setBusy(false)
    }
  }

  const toggleHistory = () => {
    if (showHistory) { setShowHistory(false); return }
    setShowHistory(true)
    setError(null)
    if (!needSession()) return
    host.call('goal-history', { sessionId: props.sessionId }).then((res) => {
      if (res !== null && res !== undefined && res.ok === true) setHistoryData(res)
      else setError(res !== null && res !== undefined && typeof res.message === 'string' ? res.message : '记录加载失败')
    }).catch((e) => setError(cleanError(e)))
  }

  const reuse = (h) => {
    if (h.phase === 'cleared') return
    ui.prefill({ objective: h.objective, maxGoalRounds: h.maxGoalRounds })
    setShowHistory(false)
  }

  const roundsValue = () => {
    if (draftRounds === '') return undefined
    const n = Number(draftRounds)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined
  }

  const submitCreate = () => {
    setConfirm(null)
    if (!needSession()) return
    const payload = { sessionId: props.sessionId, objective: draftObjective.trim() }
    const rv = roundsValue()
    if (rv !== undefined) payload.maxGoalRounds = rv
    run('goal-create', payload, () => ui.setExpanded(false))
  }
  const submitEdit = () => {
    setConfirm(null)
    if (!needSession()) return
    const payload = { sessionId: props.sessionId, ref: { id: goal.id, revision: goal.revision }, objective: draftObjective.trim() }
    const rv = roundsValue()
    if (rv !== undefined) payload.maxGoalRounds = rv
    run('goal-edit', payload, () => ui.setExpanded(false))
  }
  const mutate = (op) => {
    setConfirm(null)
    if (!needSession()) return
    run('goal-' + op, { sessionId: props.sessionId, ref: { id: goal.id, revision: goal.revision } })
  }
  const askConfirm = (op) => {
    if (confirm === op) { mutate(op); return }
    setConfirm(op)
  }

  const iconBtn = (icon, onClick, extra) => React.createElement('button', {
    className: 'gmb-ibtn' + (extra && extra.danger ? ' gmb-ibtn-danger' : '') + (extra && extra.primary ? ' gmb-ibtn-primary' : ''),
    title: extra && extra.title ? extra.title : undefined,
    'aria-label': extra && extra.title ? extra.title : undefined,
    disabled: busy || (extra && extra.disabled),
    onClick
  }, icon)
  const confirmIcon = (op, baseIcon, title) => {
    const confirming = confirm === op
    return iconBtn(confirming ? Icons.alert() : baseIcon, () => askConfirm(op), { title: title, danger: confirming })
  }
  const btn = (label, onClick, extra) => React.createElement('button', {
    className: 'gmb-btn' + (extra && extra.primary ? ' gmb-primary' : '') + (extra && extra.danger ? ' gmb-danger' : ''),
    disabled: busy || (extra && extra.disabled),
    onClick
  }, label)

  const objTextarea = (placeholder, submit) => React.createElement('textarea', {
    className: 'gmb-input gmb-textarea',
    placeholder: placeholder,
    rows: 4,
    value: draftObjective,
    onChange: (e) => setDraftObjective(e.target.value),
    onKeyDown: (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && draftObjective.trim() !== '') submit() }
  })

  const createForm = (placeholder) => React.createElement('div', { className: 'gmb-form gmb-form-col' },
    objTextarea(placeholder, submitCreate),
    React.createElement('div', { className: 'gmb-form-row' },
      React.createElement('input', { className: 'gmb-input gmb-rounds-input', placeholder: '轮次上限(可选)', type: 'number', min: 1, value: draftRounds, onChange: (e) => setDraftRounds(e.target.value) }),
      btn(busy ? '创建中…' : '创建目标', submitCreate, { primary: true, disabled: draftObjective.trim() === '' }),
      btn('取消', () => ui.setExpanded(false))
    )
  )

  const editForm = () => React.createElement('div', { className: 'gmb-form gmb-form-col' },
    objTextarea('目标内容', submitEdit),
    React.createElement('div', { className: 'gmb-form-row' },
      React.createElement('input', { className: 'gmb-input gmb-rounds-input', placeholder: '轮次上限', type: 'number', min: 1, value: draftRounds, onChange: (e) => setDraftRounds(e.target.value) }),
      btn(busy ? '保存中…' : '保存', submitEdit, { primary: true, disabled: draftObjective.trim() === '' }),
      btn('取消', () => ui.setExpanded(false))
    )
  )

  const progress = (g) => {
    const p = capPct(g)
    if (p === null) return null
    return React.createElement('span', { className: 'gmb-bar' },
      React.createElement('span', { className: 'gmb-bar-fill', style: { width: p + '%' } })
    )
  }

  const dg = goal === null || goal === undefined ? null : {
    ...goal,
    roundsStarted: liveGoal !== null && liveGoal !== undefined && typeof liveGoal.roundsStarted === 'number' ? liveGoal.roundsStarted : (goal.roundsStarted || 0),
    activation: liveGoal !== null && liveGoal !== undefined && typeof liveGoal.activation === 'string' ? liveGoal.activation : goal.activation
  }
  const capHit = dg !== null && dg.phase === 'active' && dg.maxGoalRounds !== undefined && dg.maxGoalRounds !== null && (dg.roundsStarted || 0) >= dg.maxGoalRounds
  const stale = dg !== null && dg.phase === 'active' && Date.now() - lastProgressRef.current > STALE_MS

  let inner
  if (goal !== null && goal.phase === 'complete') {
    inner = expanded ? createForm('设定下一个目标…') : React.createElement('div', { className: 'gmb-row' },
      React.createElement('span', { className: 'gmb-glyph' }, Icons.checkCircle()),
      React.createElement('span', { className: 'gmb-label', style: { color: PHASE_DOT.complete } }, PHASE_LABELS.complete),
      React.createElement('span', { className: 'gmb-objective', title: String(dg.objective) }, dg.objective),
      React.createElement('span', { className: 'gmb-rounds' }, progress(dg), roundsText(dg)),
      iconBtn(Icons.plus(), () => ui.setExpanded(true), { primary: true, title: '开始新目标' }),
      iconBtn(Icons.clock(), toggleHistory, { title: '目标记录' }),
      confirmIcon('clear', Icons.trash(), '清除')
    )
  } else if (goal === null) {
    inner = expanded ? createForm('设定目标…') : React.createElement('div', { className: 'gmb-row' },
      React.createElement('span', { className: 'gmb-glyph' }, Icons.target()),
      React.createElement('span', { className: 'gmb-muted' }, '还没有目标，设定后 agent 将持续自动推进'),
      iconBtn(Icons.plus(), () => ui.setExpanded(true), { primary: true, title: '设定目标' }),
      iconBtn(Icons.clock(), toggleHistory, { title: '目标记录' })
    )
  } else if (expanded) {
    inner = editForm()
  } else {
    const actions = []
    if (dg.phase === 'active') actions.push(iconBtn(Icons.pause(), () => mutate('pause'), { title: '暂停' }))
    else if (dg.phase === 'paused' || dg.phase === 'blocked') actions.push(iconBtn(Icons.play(), () => mutate('resume'), { title: '恢复' }))
    actions.push(iconBtn(Icons.edit(), () => ui.setExpanded(true), { title: '编辑' }))
    actions.push(iconBtn(Icons.clock(), toggleHistory, { title: '目标记录' }))
    actions.push(confirmIcon('complete', Icons.check(), '完成'))
    actions.push(confirmIcon('clear', Icons.trash(), '清除'))
    inner = React.createElement('div', { className: 'gmb-row' },
      React.createElement('span', { className: 'gmb-glyph' }, Icons.target()),
      React.createElement('span', { className: 'gmb-label', style: { color: PHASE_DOT[dg.phase] } }, PHASE_LABELS[dg.phase]),
      React.createElement('span', { className: 'gmb-objective', title: dg.objective === undefined ? '' : String(dg.objective) }, dg.objective),
      React.createElement('span', { className: 'gmb-rounds' }, progress(dg), roundsText(dg)),
      dg.phase === 'active' && dg.activation === 'armed' ? React.createElement('span', { className: 'gmb-badge' }, '自动续跑中') : null,
      stale ? React.createElement('span', { className: 'gmb-badge gmb-badge-stale' }, '长时间未推进') : null,
      capHit ? React.createElement('span', { className: 'gmb-badge gmb-badge-cap' }, '已达轮次上限') : null,
      ...actions
    )
  }

  const capHint = capHit ? React.createElement('div', { className: 'gmb-cap-hint' }, '已达轮次上限 — 可点 ✎ 修改上限，或 ✓ 完成、🗑 清除') : null

  const histBlock = (() => {
    if (!showHistory || historyData === null) return null
    const items = []
    items.push(React.createElement('div', { key: 't', className: 'gmb-set-title' }, '目标记录（双击条目可复用为目标）'))
    const list = historyData.history === undefined || historyData.history === null ? [] : historyData.history
    if (list.length === 0) {
      items.push(React.createElement('div', { key: 'e', className: 'gmb-set-none' }, '暂无记录。目标创建、编辑、暂停、恢复、完成、清除都会记录在这里。'))
    } else {
      const listItems = []
      for (const h of list.slice(0, 40)) {
        const dot = PHASE_DOT[h.phase] === undefined ? '#8b949e' : PHASE_DOT[h.phase]
        listItems.push(React.createElement('div', { key: String(h.id) + '-' + String(h.revision), className: 'gmb-set-item gmb-clickable', title: h.phase === 'cleared' ? '已清除的目标' : '双击复用为目标', onDoubleClick: () => reuse(h) },
          React.createElement('span', { className: 'gmb-set-dot', style: { background: dot } }),
          React.createElement('span', { className: 'gmb-set-item-main' },
            React.createElement('div', { className: 'gmb-set-item-obj' }, h.phase === 'cleared' ? '(已清除)' : h.objective),
            React.createElement('div', { className: 'gmb-set-item-meta' }, h.phase + ' · ' + roundsText(h))
          )
        ))
      }
      items.push(React.createElement('div', { key: 'list', className: 'gmb-scroll' }, ...listItems))
    }
    return React.createElement('div', { className: 'gmb-hist' }, ...items)
  })()

  return React.createElement('div', { className: 'gmb-dock' },
    inner,
    capHint,
    histBlock,
    error === null ? null : React.createElement('div', { className: 'gmb-error' }, error),
    dg !== null && dg.blockedReason !== null && dg.blockedReason !== undefined ? React.createElement('div', { className: 'gmb-blocked' }, '阻塞原因：' + dg.blockedReason.message) : null
  )
}

function GoalHeader(props) {
  const projection = props.useProjection('goal')
  const goal = projection === undefined || projection === null ? null : projection.goal
  const expanded = useExpanded()
  const phase = goal === null || goal === undefined ? null : goal.phase
  return React.createElement('button', {
    className: 'gmb-header-btn' + (expanded ? ' gmb-header-active' : ''),
    'aria-label': '目标模式',
    title: '目标模式',
    onClick: () => ui.toggle()
  },
    React.createElement('span', { className: 'gmb-header-glyph' }, Icons.target(16)),
    React.createElement('span', {
      className: 'gmb-header-dot',
      style: phase === null ? undefined : { background: PHASE_DOT[phase] }
    })
  )
}

function GoalSettings(props) {
  const [data, setData] = React.useState(null)
  const [sessions, setSessions] = React.useState(null)
  const [error, setError] = React.useState(null)

  const load = () => {
    host.call('goal-history', {}).then((res) => {
      if (res !== null && res !== undefined && res.ok === true) setData(res)
      else setError(res !== null && res !== undefined && typeof res.message === 'string' ? res.message : '加载失败')
    }).catch((e) => setError(cleanError(e)))
    host.call('goal-sessions', {}).then((res) => {
      if (res !== null && res !== undefined && res.ok === true) setSessions(res.sessions)
      else setError(res !== null && res !== undefined && typeof res.message === 'string' ? res.message : '加载失败')
    }).catch((e) => setError(cleanError(e)))
  }

  React.useEffect(() => { load() }, [])

  const fmt = (ts) => {
    if (typeof ts !== 'number' || !Number.isFinite(ts)) return ''
    const d = new Date(ts)
    const p = (n) => String(n).padStart(2, '0')
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
  }

  const reuse = (h) => {
    if (h.phase === 'cleared') return
    ui.prefill({ objective: h.objective, maxGoalRounds: h.maxGoalRounds })
  }

  const current = data === null ? null : data.current
  const history = data === null || data.history === undefined ? [] : data.history

  const children = []
  children.push(React.createElement('div', { key: 'h1', className: 'gmb-set-title' }, '当前目标'))
  if (current === null) {
    children.push(React.createElement('div', { key: 'c0', className: 'gmb-set-none' }, '当前没有目标。可以在会话输入框上方的目标栏创建，或直接对 agent 说「设定目标：…」。'))
  } else {
    children.push(React.createElement('div', { key: 'c1', className: 'gmb-set-card' },
      React.createElement('div', { className: 'gmb-set-row' },
        React.createElement('span', { className: 'gmb-set-dot', style: { background: PHASE_DOT[current.phase] } }),
        React.createElement('span', { className: 'gmb-set-phase' }, PHASE_LABELS[current.phase]),
        React.createElement('span', { className: 'gmb-set-rounds' }, roundsText(current))
      ),
      React.createElement('div', { className: 'gmb-set-objective' }, current.objective),
      current.blockedReason !== null && current.blockedReason !== undefined ? React.createElement('div', { className: 'gmb-set-blocked' }, '阻塞：' + current.blockedReason.message) : null,
      React.createElement('div', { className: 'gmb-set-meta' }, (current.activation === 'armed' ? '自动续跑中' : '已停止自动续跑') + ' · 创建于 ' + fmt(current.createdAt))
    ))
  }
  children.push(React.createElement('div', { key: 'h2', className: 'gmb-set-title' }, '目标记录（本会话，双击条目可复用）'))
  if (history.length === 0) {
    children.push(React.createElement('div', { key: 'e0', className: 'gmb-set-none' }, '暂无记录。目标创建、编辑、暂停、恢复、完成、清除都会记录在这里。'))
  } else {
    const histItems = []
    for (const h of history.slice(0, 40)) {
      const dot = PHASE_DOT[h.phase] === undefined ? '#8b949e' : PHASE_DOT[h.phase]
      histItems.push(React.createElement('div', { key: String(h.id) + '-' + String(h.revision), className: 'gmb-set-item gmb-clickable', title: h.phase === 'cleared' ? '已清除的目标' : '双击复用为目标', onDoubleClick: () => reuse(h) },
        React.createElement('span', { className: 'gmb-set-dot', style: { background: dot } }),
        React.createElement('span', { className: 'gmb-set-item-main' },
          React.createElement('div', { className: 'gmb-set-item-obj' }, h.phase === 'cleared' ? '(已清除)' : h.objective),
          React.createElement('div', { className: 'gmb-set-item-meta' }, h.phase + ' · ' + roundsText(h) + ' · ' + fmt(h.updatedAt))
        )
      ))
    }
    children.push(React.createElement('div', { key: 'histlist', className: 'gmb-scroll' }, ...histItems))
  }
  children.push(React.createElement('div', { key: 'h3', className: 'gmb-set-title' }, '其他会话的目标（只读）'))
  if (sessions === null) {
    children.push(React.createElement('div', { key: 's0', className: 'gmb-set-none' }, '加载中…'))
  } else {
    const others = sessions.filter((s) => !s.self)
    if (others.length === 0) {
      children.push(React.createElement('div', { key: 's1', className: 'gmb-set-none' }, '暂无其他会话目标。'))
    } else {
      const sessItems = []
      for (const s of others.slice(0, 30)) {
        const dot = s.goal === null || PHASE_DOT[s.goal.phase] === undefined ? '#8b949e' : PHASE_DOT[s.goal.phase]
        sessItems.push(React.createElement('div', { key: String(s.sessionId), className: 'gmb-set-item' },
          React.createElement('span', { className: 'gmb-set-dot', style: { background: dot } }),
          React.createElement('span', { className: 'gmb-set-item-main' },
            React.createElement('div', { className: 'gmb-set-item-obj' }, s.goal === null ? '（无当前目标）' : s.goal.objective),
            React.createElement('div', { className: 'gmb-set-item-meta' }, (s.title === '' ? '未命名会话' : s.title) + (s.goal === null ? '' : ' · ' + (s.goal.phase || '') + ' · ' + roundsText(s.goal)))
          )
        ))
      }
      children.push(React.createElement('div', { key: 'sesslist', className: 'gmb-scroll' }, ...sessItems))
    }
  }
  children.push(React.createElement('div', { key: 'refresh', className: 'gmb-set-actions' },
    React.createElement('button', { className: 'gmb-btn', onClick: load }, '刷新')
  ))
  if (error !== null) children.push(React.createElement('div', { key: 'err', className: 'gmb-error' }, error))

  return React.createElement('div', { className: 'gmb-set' }, ...children)
}

return {
  inject: ['timer'],
  apply(ctx) {
    pluginCtx = ctx
    const slots = ctx.get('slots')
    if (slots === undefined) return
    styles.insert(CSS)
    slots.inject('conversation.input.dock', () => slots.register(
      { name: 'conversation.input.dock', id: 'goal', order: 10, label: '目标' },
      (props) => React.createElement(GoalDock, props)
    ))
    slots.inject('conversation.session.header.actions', () => slots.register(
      { name: 'conversation.session.header.actions', id: 'goal-mode', order: 30, label: '目标' },
      (props) => React.createElement(GoalHeader, props)
    ))
    slots.inject('settings.section', () => slots.register(
      { name: 'settings.section', id: 'goal-mode', order: 25, label: '目标' },
      (props) => React.createElement(GoalSettings, props)
    ))
  }
}
