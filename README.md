# Claude Code CLI 历史记录管理器

基于 Tauri 2.x + React + TypeScript 的桌面应用，用于管理 Claude Code CLI 的历史会话记录。

## 功能特性

- 📁 从 JSONL 文件导入 Claude Code CLI 历史记录
- 📊 按项目路径分组展示会话
- 🔍 支持归档、搜索和统计分析
- 📈 可视化统计图表（ECharts）
- 💾 本地 SQLite 数据库存储

## 技术栈

- **前端**: React 18 + TypeScript + Vite + TailwindCSS + Zustand
- **后端**: Rust + Tauri 2.x + sqlx
- **数据库**: SQLite
- **可视化**: ECharts

## 开发环境

### 前置要求

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/)
- [Tauri 2.x 依赖](https://tauri.app/start/prerequisites/)

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri dev
```

### 构建

```bash
npm run tauri build
```

## 数据导入格式

支持导入 Claude Code CLI 导出的 JSONL 格式文件，每行包含：

```json
{
  "sessionId": "uuid-string",
  "project": "/path/to/project",
  "display": "用户输入的提示",
  "timestamp": "2026-03-11T10:30:00.000Z",
  "pastedContents": []
}
```

## 项目结构

```
claude-conversation-manager/
├── src/                    # 前端代码
│   ├── components/         # React 组件
│   ├── stores/            # Zustand 状态管理
│   ├── types/             # TypeScript 类型定义
│   └── lib/               # 工具函数
├── src-tauri/             # Tauri 后端
│   ├── src/
│   │   ├── commands/      # 命令处理
│   │   └── db/            # 数据库操作
│   └── Cargo.toml
└── package.json
```

## License

MIT
