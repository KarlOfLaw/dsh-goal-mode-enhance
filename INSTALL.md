# 安装指南

本仓库提供两种形态：**A 正式插件包**（推荐，稳定、可注册安装）与 **B 动态插件源码**（备选，会话内加载）。

## 形态 A：正式插件（推荐）

### 方式 A1：本地构建后安装

要求：Node.js + pnpm（插件依赖 dsh 源码做类型解析，见 `package.json` 的 `link:../dsh-src/...` devDependencies；若无本地 dsh 源码，可用 A2 或直接使用已构建产物）。

```sh
# 1. 安装依赖并构建
pnpm install
pnpm run build

# 2. 装进 web profile
dsh plugin --profile web add file:/path/to/dsh-goal-mode

# 3. 重启 dsh web（或刷新页面）
```

卸载：

```sh
dsh plugin --profile web remove dsh-goal-mode
```

### 更新本地插件

`file:` 协议的本地依赖，pnpm 用 link 处理（不校验内容变化），`pnpm add --force` 不会刷新旧 bundle。更新请任选其一：

- **版本号递增**后重新 `add`；
- 先 `remove` 再 `add`；
- 或手动把构建产物（`lib/`）同步进 profile 的 `node_modules/dsh-goal-mode/`。

## 形态 B：动态插件（备选）

在任意 DSH 会话里，把 `host.js` / `client.js` 的内容分别作为 `code.host` / `code.client`，用 `cordis_define` + `cordis_run` 加载（idPrefix `goal`，name `goal-mode`）。详情见两个文件顶部注释。

> 形态 B 是会话级：每个会话需各自加载一次，页面刷新需重新激活。

## 注意事项

- 目标是**会话级**的：bar 显示的是当前会话的目标。
- 目标数据持久化在会话日志中，插件重启不丢失。
