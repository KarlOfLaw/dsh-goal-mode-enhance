# 安装指南

本插件是 DeepSeek Harness 的**动态 Cordis 插件**：无需改代码、无需构建，由你的 agent 在会话内用 `cordis_define` + `cordis_run` 加载即可。

## 方式 A：把仓库交给 agent（推荐）

在你任意一个 DSH 会话里，把下面这段发给 agent（或直接把本仓库地址/文件贴给它）：

```
请帮我加载 goal 模式插件（dsh-goal-mode-enhance）：
1. 读取本仓库的 host.js 作为 code.host、client.js 作为 code.client；
2. 用 cordis_define 创建插件（idPrefix 用 goal，name 用 goal-mode，
   purpose 写一句功能说明）；
3. 用 cordis_run 启动（mode: run）；
4. 我会在界面上批准运行卡片的授权，批准后告诉我结果。
```

agent 会自动完成定义与启动；你在运行卡片上点「允许」（建议同时勾选"始终允许"）。

## 方式 B：手动加载

把 `host.js` / `client.js` 的内容分别作为 `code.host` / `code.client` 提交：

```
cordis_define → plugin.kind: new, idPrefix: goal, name: goal-mode
              → code.host = host.js 内容
              → code.client = client.js 内容
cordis_run    → mode: run
```

## 卸载

在会话里让 agent 执行 `cordis_stop`（临时停用，保留版本）或 `cordis_undefine`（彻底删除）。停止后原生 goal bar 自动恢复。

## 注意事项

- 插件是**会话级**的：每个会话需要各自加载一次。
- 目标是**会话级**的：bar 显示的是当前会话的目标。
- 目标数据持久化在会话日志中，插件重启不丢失；**历史记录列表**是插件运行期间内存累积的，插件重启后重新开始记录。
