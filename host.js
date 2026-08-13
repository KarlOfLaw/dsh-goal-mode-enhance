// dsh-goal-mode — code.host（Node 进程半边）
// 版本：pkg-11（五项提升：持久化历史 / 多会话总览 / 超时判定依赖 client 侧）
// 用途：包私有 RPC（goal-view/history/sessions/create/edit/pause/resume/complete/clear）、
//       目标变更历史（内存 + 会话日志持久化合并）、动态模型工具 goal_overview。
// 用法：把本文件内容作为 cordis_define 的 code.host。

return {
  apply(ctx) {
    const goals = ctx.get('goals')
    const agents = ctx.get('agents')
    const sessionQuery = ctx.get('sessionQuery')
    if (goals === undefined || agents === undefined) {
      console.log('goal-mode: goals/agents service unavailable; host half inactive')
      return
    }

    let ownedSessionId = null

    const toView = (v) => {
      if (v === undefined || v === null) return null
      const out = {}
      if (v.id !== undefined) out.id = v.id
      if (v.revision !== undefined) out.revision = v.revision
      if (v.objective !== undefined) out.objective = v.objective
      if (v.phase !== undefined) out.phase = v.phase
      if (v.roundsStarted !== undefined) out.roundsStarted = v.roundsStarted
      if (v.maxGoalRounds !== undefined) out.maxGoalRounds = v.maxGoalRounds
      if (v.activation !== undefined) out.activation = v.activation
      if (v.blockedReason !== undefined && v.blockedReason !== null) {
        out.blockedReason = { code: v.blockedReason.code, message: v.blockedReason.message }
      }
      if (v.createdAt !== undefined) out.createdAt = v.createdAt
      if (v.updatedAt !== undefined) out.updatedAt = v.updatedAt
      return out
    }

    const history = []
    const remember = (entry) => {
      if (entry === null || entry === undefined) return
      const idx = history.findIndex((h) => h.id === entry.id && h.revision === entry.revision)
      if (idx !== -1) history.splice(idx, 1)
      history.push(entry)
      if (history.length > 60) history.splice(0, history.length - 60)
    }

    const durableHistory = async (sessionId) => {
      if (sessionQuery === undefined) return []
      try {
        const snap = await sessionQuery.readSession(sessionId)
        const events = snap.events
        if (!Array.isArray(events)) return []
        const out = []
        for (const ev of events) {
          if (ev.type !== 'goal/change') continue
          const d = ev.data
          if (d === null || typeof d !== 'object') continue
          if (d.operation === 'clear') {
            if (d.cleared && typeof d.cleared.id === 'string' && typeof d.cleared.revision === 'number') {
              out.push({ id: d.cleared.id, revision: d.cleared.revision, phase: 'cleared', updatedAt: typeof d.clearedAt === 'number' ? d.clearedAt : 0 })
            }
          } else if (d.goal && typeof d.goal === 'object') {
            const g = d.goal
            out.push({
              id: g.id, revision: g.revision, objective: g.objective, phase: g.phase,
              maxGoalRounds: g.maxGoalRounds,
              roundsStarted: typeof d.roundsStarted === 'number' ? d.roundsStarted : 0,
              createdAt: d.createdAt, updatedAt: d.updatedAt
            })
          }
        }
        return out
      } catch (e) {
        console.log('goal-mode: durable history read failed', e instanceof Error ? e.message : String(e))
        return []
      }
    }

    const lastGoalOf = async (sessionId) => {
      if (sessionQuery === undefined) return null
      try {
        const snap = await sessionQuery.readSession(sessionId)
        const events = snap.events
        if (!Array.isArray(events)) return null
        let current = null
        for (const ev of events) {
          if (ev.type !== 'goal/change') continue
          const d = ev.data
          if (d === null || typeof d !== 'object') continue
          if (d.operation === 'clear') {
            current = null
          } else if (d.goal && typeof d.goal === 'object') {
            const g = d.goal
            current = {
              id: g.id, revision: g.revision, objective: g.objective, phase: g.phase,
              maxGoalRounds: g.maxGoalRounds,
              roundsStarted: typeof d.roundsStarted === 'number' ? d.roundsStarted : 0,
              createdAt: d.createdAt, updatedAt: d.updatedAt
            }
          }
        }
        return current
      } catch (e) {
        return null
      }
    }

    const buildHistory = async (agent) => {
      const durable = await durableHistory(agent.id)
      const merged = new Map()
      for (const e of durable) merged.set(String(e.id) + ':' + String(e.revision), e)
      for (const e of history) merged.set(String(e.id) + ':' + String(e.revision), e)
      return [...merged.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 60)
    }

    const fail = (message) => ({ ok: false, message: String(message) })
    const resolve = (args) => {
      const sid = args === null || args === undefined ? undefined : args.sessionId
      if (typeof sid === 'string' && sid.length > 0) ownedSessionId = sid
      if (ownedSessionId === null) return undefined
      return agents.get(ownedSessionId)
    }
    const withAgent = async (args, op) => {
      const agent = resolve(args)
      if (agent === undefined) return fail('无法解析当前会话的 agent')
      try {
        return { ok: true, ...(await op(agent, args)) }
      } catch (e) {
        return fail(e instanceof Error ? e.message : String(e))
      }
    }

    const parseCap = (raw) => {
      if (raw === undefined || raw === null) return undefined
      const n = Number(raw)
      if (!Number.isFinite(n) || n <= 0) return undefined
      return Math.floor(n)
    }

    harness.handle('goal-view', async (args) => {
      return withAgent(args, async (agent) => {
        const view = toView(goals.get(agent))
        if (view !== null && view.id !== undefined) remember(view)
        return { goal: view }
      })
    })

    harness.handle('goal-history', async (args) => {
      return withAgent(args, async (agent) => {
        const view = toView(goals.get(agent))
        if (view !== null && view.id !== undefined) remember(view)
        return { current: view, history: await buildHistory(agent) }
      })
    })

    harness.handle('goal-sessions', async (args) => {
      return withAgent(args, async (agent) => {
        if (sessionQuery === undefined) return { sessions: [] }
        try {
          const records = await sessionQuery.listSessions()
          const out = []
          const seen = new Set()
          for (const rec of records) {
            const header = rec.header
            const sid = header && header.id
            if (typeof sid !== 'string' || seen.has(sid)) continue
            seen.add(sid)
            if (out.length >= 20) break
            const title = header.title === undefined || header.title === null ? '' : String(header.title)
            const self = sid === agent.id
            const goal = self ? toView(goals.get(agent)) : await lastGoalOf(sid)
            if (self || goal !== null) {
              out.push({ sessionId: sid, title, self, goal })
            }
          }
          return { sessions: out }
        } catch (e) {
          return { sessions: [], error: e instanceof Error ? e.message : String(e) }
        }
      })
    })

    harness.handle('goal-create', async (args) => {
      return withAgent(args, async (agent, a) => {
        const request = { objective: String(a.objective === undefined || a.objective === null ? '' : a.objective) }
        const cap = parseCap(a.maxGoalRounds)
        if (cap !== undefined) request.maxGoalRounds = cap
        const view = toView(goals.create(agent, request))
        if (view !== null && view.id !== undefined) remember(view)
        return { goal: view }
      })
    })

    harness.handle('goal-edit', async (args) => {
      return withAgent(args, async (agent, a) => {
        const request = {}
        if (typeof a.objective === 'string' && a.objective.length > 0) request.objective = a.objective
        const cap = parseCap(a.maxGoalRounds)
        if (cap !== undefined) request.maxGoalRounds = cap
        const view = toView(goals.edit(agent, a.ref, request))
        if (view !== null && view.id !== undefined) remember(view)
        return { goal: view }
      })
    })

    const refOp = (name) => harness.handle('goal-' + name, async (args) => {
      return withAgent(args, async (agent, a) => {
        if (name === 'clear') {
          const ref = goals.clear(agent, a.ref)
          remember({ id: ref.id, revision: ref.revision, phase: 'cleared', updatedAt: Date.now() })
          return { ref }
        }
        const view = toView(goals[name](agent, a.ref))
        if (view !== null && view.id !== undefined) remember(view)
        return { goal: view }
      })
    })
    refOp('pause')
    refOp('resume')
    refOp('complete')
    refOp('clear')

    ctx.on('goal/changed', (payload) => {
      if (payload === undefined || payload === null) return
      const agent = payload.agent
      const change = payload.change
      if (agent === undefined || change === undefined || change === null) return
      if (ownedSessionId !== null && agent.id !== ownedSessionId) return
      if (change.goal !== undefined && change.goal !== null) {
        const view = toView(change.goal)
        if (view !== null && view.id !== undefined) remember(view)
      } else {
        const ref = change.ref
        if (ref !== undefined && ref !== null && typeof ref.id === 'string' && typeof ref.revision === 'number') {
          remember({ id: ref.id, revision: ref.revision, phase: 'cleared', updatedAt: Date.now() })
        }
      }
    })

    harness.registerTool(ctx, harness.defineTool({
      name: 'goal_overview',
      description: '返回当前会话的目标概览与最近目标记录（JSON）：当前目标的 phase/objective/轮次进度/激活状态，以及目标变更历史（含会话日志中的持久化历史）。与内置 create_goal/get_goal/update_goal 互补，用于向用户汇报目标状态或查看历史。',
      parameters: { type: 'object', properties: {}, additionalProperties: true },
      output: {
        schema: { type: 'object', additionalProperties: true },
        render: (args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }]
      },
      async execute(args, exec) {
        if (ownedSessionId === null) return { current: null, history: [], note: 'session id 尚未确定（插件刚启动或尚未打开会话视图）' }
        const agent = agents.get(ownedSessionId)
        if (agent === undefined) return { current: null, history: [], note: 'agent 不存在' }
        const view = toView(goals.get(agent))
        return { current: view, history: await buildHistory(agent) }
      }
    }))
  }
}
