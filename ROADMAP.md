# 路线图：把 dsh-goal-mode 装进 DeepSeek Harness 本体

> 终极目标：不再需要"会话内 cordis_define + 审批"，而是 DSH 启动即自带、所有会话可用。
> 当前形态：正式插件包（`dsh plugin add` 安装，页面刷新/重启不丢）+ 动态插件源码（保留备选）。

## 现状 vs 目标

| 维度 | 动态插件（备选） | 正式插件包（当前） | 官方内置（目标） |
|---|---|---|---|
| 作用域 | 单会话 | 全局（profile 级） | 全局 |
| 加载 | 会话内 cordis_define + cordis_run + 审批 | `dsh plugin add`，启动自动挂载 | 随 DSH 版本发布 |
| 页面刷新 | 需重新激活 | 无感 | 无感 |
| 维护 | 每会话一次 | 独立包，升级可管理 | 随 DSH 版本 |

## 分阶段实施

### 阶段一：源码仓库化（✅ 已完成）
`dsh-goal-mode-enhance` 仓库：`host.js` / `client.js`、`README.md`、`INSTALL.md`、`LICENSE`。

### 阶段二：移植为正式插件包（✅ 已完成）
本仓库新增独立插件包结构（`src/` + `build.mjs` + `dsh.plugin.json` + `cordis.patch.yml`）：

1. **Host 半**（`src/index.ts`）：注册 `ui-goal-mode` 设置命名空间（`composerEntryVisible`）。
2. **Client 半**（`src/client/`）：注册 `conversation.input.dock`（goal 单元，priority -10 覆盖内置条）、`conversation.input.left`（composer 入口）、`settings.general.item`（可见性开关）；用 `ctx.remote.goals` 走正式 Remote 通道，复用 `useProjection('goal')`。
3. **构建**：esbuild 单文件构建（host ESM + client CJS bundle），client bundle 禁止混入宿主模块（`dsh-settings`/`cordis`）。
4. **兼容修复**：浏览器安全常量拆到 `settings-contract.ts`；三个替换型插槽 `priority: -10` 覆盖 DSH 内置 Goal 插槽。

### 阶段三：本地构建与验证（✅ 已完成）
- `pnpm run check`（typecheck + build）通过。
- `dsh plugin --profile web add file:...` 安装成功，真实浏览器验证：目标模式按钮可见、点击展开创建表单。

### 阶段四：分发（进行中）
- **路线 A（当前）**：独立插件包随本仓库分发，`dsh plugin add file:` 安装——无需上游合并即可让同版本部署者安装。
- **路线 B（远期）**：向 deepseek-ai/deepseek-harness 提交 PR。官方当前不接受外部 PR（见仓库说明），社区插件是官方鼓励的方向。

### 阶段五：维护
- i18n（已接入 `locale` 服务，中英双语）
- 主题（已用 `--dsw-*` design tokens）
- 测试（组件测试 + host 服务单测）
- 版本化发布 / CHANGELOG

## 建议节奏

1. 本仓库已推 GitHub，正式插件包可用；
2. 稳定后保持独立插件分发（路线 A）；官方开放 PR 后再走路线 B；
3. 期间动态插件源码（形态 B）保留作备选。
