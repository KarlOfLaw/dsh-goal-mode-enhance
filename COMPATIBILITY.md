# 兼容性 / Compatibility

## 已验证环境（Verified environment）

| 项 | 值 |
|---|---|
| 验证日期 | 2026-08-24 |
| DSH 包版本 | `@deepseek-ai/*` **0.1.1-rc.2** |
| 宿主 | DSH Desktop 2.0.2（web profile，Windows 11） |
| 安装形态 | A（`dsh plugin --profile web add`，随宿主启动挂载） |

## 结论（Findings）

- 使用的四个浏览器槽位在当前版本全部存在且注册契约一致：
  `conversation.input.dock`（goal 条）、`conversation.input.left`（工具行入口）、
  `settings.general.item`（General 开关行）、`settings.section`（独立设置页）。
- client 依赖服务 `slots` / `sessions` / `remote` / `remote.goals` / `locale` / `settingsScope`，
  host 依赖 `settings`——均由 web 装配（`dsh-base` + `dsh-web-app`）提供。
- 与原生任务条（todo dock）、队列条（queue dock）**同槽共存正常**：`conversation.input.dock`
  是 list 槽位，运行时按 (priority, order) 排序渲染全部 occupant，且每个 occupant 有独立
  错误边界，单个 occupant 异常不会影响其他 occupant。
- 实际使用（goal 创建 / 多行编辑 / 暂停 / 恢复 / 完成 / 清除 / 多轮自动续跑 / 设置页总览）
  未发现不兼容。

## 已知形态差异（Known form difference）

`goal_overview` 动态模型工具与包私有 RPC（跨会话持久化历史合并）目前只在**形态 B**
（`host.js` / `client.js` 动态加载）中注册；**形态 A**（本 tarball 安装的正式包）的 host 半
只注册设置命名空间，数据操作走 `ctx.remote.goals`。两条形态计划统一（见 ROADMAP.md）。

## 版本策略（Version policy）

- 运行时 `@deepseek-ai/*` 依赖全部声明为 **optional peerDependencies `*`**：宿主 profile
  提供实际实现，插件不锁定 harness 版本；缺失时宿主按 optional peer 规则跳过。
- `@deepseek-ai/dsh-*` 的 0.1.1-rc.2 未发布公共 npm，因此 CI 只做**构建门禁**
  （esbuild + `@deepseek-ai/schemastery`，所有 `@deepseek-ai/dsh-*` 导入保持 external），
  类型检查在本地 dsh 源码旁侧开发时执行（`pnpm run check`）。
