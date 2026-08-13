# dsh-goal-mode-enhance

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 提供**可视化 goal 模式**的动态 Cordis 插件。

把原本只能靠对话命令（`/goal`）和模型工具（`create_goal` / `get_goal` / `update_goal`）操作的目标系统，变成**看得见、点得动**的界面。

## 功能

- **Goal 栏**（composer 上方，替换原生 bar）：
  - 无目标时：`◎` + "设定目标"入口（＋）
  - 有目标时：状态徽标 + 目标文本 + **轮次进度条与 n/上限** + **自动续跑中**徽标
  - 图标按钮：⏸ 暂停 / ▶ 恢复 / ✎ 编辑 / ✓ 完成 / 🗑 清除（确认态变红色 △ 警示）/ 🕘 目标记录 / ＋ 新建
  - 已完成：完成横幅 + "开始新目标"
  - 已达轮次上限：琥珀色徽标提示
- **多行编辑/创建**：目标内容用多行文本框（自动换行、可拖高、`Ctrl+Enter` 提交），可同框设置轮次上限
- **目标记录**：bar 上 🕘 内联展开最近目标变更历史
- **会话头部入口**：🎯 靶心按钮 + 状态圆点（绿=进行中 / 黄=暂停 / 红=阻塞 / 灰=无目标）
- **设置页「目标」**：当前目标卡片（阶段/轮次/阻塞原因/创建时间）+ 本会话目标变更记录
- **模型工具**：动态注册 `goal_overview`——agent 可直接调用返回当前目标 + 历史 JSON

## 原理

| 部分 | 实现 |
|---|---|
| 数据展示 | `useProjection('goal')` 实时投影，零轮询 |
| 操作通道 | 包私有 RPC：`host.call → harness.handle → ctx.goals`（带 CAS revision 乐观并发） |
| 历史记录 | Host 监听 `goal/changed` 事件（按真实结构 `change.goal` / `change.ref` 解包）内存累积 |
| UI 落点 | `conversation.input.dock`（goal 单元替换原生 bar）、`conversation.session.header.actions`、`settings.section` |
| 图标 | 内联 SVG 线条图标（Feather 风格，`currentColor` 随主题） |

数据本身存储在会话日志（`goal/change` 事件），持久化由引擎保证，插件只负责展示与操作。

## 要求

- DeepSeek Harness（Web GUI）
- 目标系统内置（`goals` 服务 + `goal/changed` 事件）

## 使用

见 [INSTALL.md](./INSTALL.md)。

## 仓库结构

```
dsh-goal-mode-enhance/
├── host.js      # code.host 半体（Node 进程：RPC + 历史 + goal_overview 工具）
├── client.js    # code.client 半体（浏览器：Goal 栏 / 头部 / 设置页）
├── INSTALL.md   # 安装与加载指南
└── README.md
```

## License

MIT
