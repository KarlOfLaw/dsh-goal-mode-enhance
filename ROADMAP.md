# 路线图：把 dsh-goal-mode-enhance 装进 DeepSeek Harness 本体

> 终极目标：不再需要"会话内 cordis_define + 审批"，而是 DSH 启动即自带、所有会话可用。
> 当前形态：动态 Cordis 插件（会话级、页面刷新需重载、激活需审批）。

## 现状 vs 目标

| 维度 | 现在（动态插件） | 目标（静态插件） |
|---|---|---|
| 作用域 | 单会话 | 全局（所有会话） |
| 加载 | 会话内 cordis_define + cordis_run + 审批 | DSH 启动自动挂载 |
| 页面刷新 | 需重新激活 | 无感（随 web bundle 加载） |
| 维护 | 每会话一次 | 随 DSH 版本发布 |

## 分阶段实施

### 阶段一：源码仓库化（✅ 已完成）
`dsh-goal-mode-enhance/` 仓库：`host.js` / `client.js`（= pkg-13 代码）、`README.md`、`INSTALL.md`、`LICENSE`。
交付物：任何人可复制代码在任意会话加载。

### 阶段二：移植为 DSH 官方插件结构（主体工作）
克隆 https://github.com/deepseek-ai/deepseek-harness（本地已有 npm 缓存副本），在 monorepo 内建两个包：

1. **Host 插件**：`packages/host/goal-mode/`
   - 把 `host.js` 的 RPC/历史逻辑改写成正式 cordis host 服务（直接 `ctx.goals` / `ctx.sessionQuery`，不再走 harness sandbox）
   - 用 DSH 的类型系统（`@deepseek-ai/dsh-*` 包）声明 `GoalModeService`，可被其他插件注入
2. **Client 插件**：`packages/client/ui-goal-mode/`
   - 把 `client.js` 拆成真实 React 组件 + CSS Modules（参考 `packages/client/ui-goal/` 现有 GoalBar 的组织方式）
   - 注册 `conversation.input.dock`（goal 单元）、`conversation.session.header.actions`、`settings.section`
   - 用正式 `ctx.remote.goals`（静态插件可用，动态插件被 Guard 禁止）替代 `host.call` RPC
   - 复用 `useProjection('goal')`

### 阶段三：本地构建与验证
- `pnpm install`（monorepo 根）
- `pnpm run dev:web`（重建 web bundle；本机 GUI 的 `clientModules` 插件表会扫描 `dsh.client` 清单）
- 在本地 GUI 验证：Goal 栏/头部/设置页/多会话总览全链路

### 阶段四：分发
- **路线 A（推荐起步）**：先以独立 npm 包发布（`@your-name/dsh-goal-mode-enhance`），README 说明如何把它加入部署的 web 插件表（`dsh.client` 扫描）——无需上游合并即可让同版本部署者安装。
- **路线 B（正式）**：向 deepseek-ai/deepseek-harness 提交 PR。需要：过 lint/typecheck/test、附截图与用法说明、遵循贡献指南。合并后随 DSH 版本自带。

### 阶段五：维护
- i18n（接入 `locale` 服务，现文案为硬编码中文）
- 主题（改用 theme tokens 而不是硬编码色值）
- 测试（组件测试 + host 服务单测）
- 版本化发布 / CHANGELOG

## 关键依赖与学习材料（都在本地 npm 缓存里）

- `@deepseek-ai/dsh-client-ui-goal` —— 原生 GoalBar 实现（参考组件结构）
- `@deepseek-ai/dsh-goal` —— goal 领域服务与事件定义（参考 host 服务写法）
- `@deepseek-ai/dsh-cordis-host-runner` / `dsh-cordis-client-runner` —— 动态插件运行时（理解 Guard 与边界）
- `apps/web`（monorepo 内）—— web shell 与插件表入口

## 建议节奏

1. 先把 `dsh-goal-mode-enhance` 仓库推到 GitHub（README 已备好）；
2. 我（或你）按阶段二移植出第一个静态版本，跑通本地构建；
3. 稳定后走路线 B 提交 PR；期间路线 A 让其他部署先用上。

工作量提示：阶段二是核心，涉及前端组件拆分与 monorepo 构建约定，通常需要数轮迭代——这正是"一步一步来"的路径。
