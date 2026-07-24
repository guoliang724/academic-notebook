# 项目重构：从单文件 HTML 迁移到 Next.js + SQLite

## 背景

当前项目是一个**纯前端单文件** HTML 应用（4200+ 行的 `index.html`），所有数据（5 篇语料 + 4 个模板）嵌入在 `<script>` 标签中，通过 GitHub API 实现同步。重构目标是将其迁移为 **Next.js (App Router) + SQLite** 的全栈应用，实现数据持久化和更好的可维护性。

## User Review Required

> [!IMPORTANT]
> **重构范围**：本次重构将完全替换现有的单文件架构。旧的 `index.html` 将被保留不删除，但不再作为主要入口。

> [!WARNING]
> **GitHub 同步功能**：原有的"通过 GitHub API 同步 HTML 文件"的功能在 Next.js 架构下将被**替换为 SQLite 持久化存储**。如果仍需要 GitHub 同步功能，请告知，我会在新架构中适配。

> [!IMPORTANT]
> **部署方式变化**：Next.js + SQLite 不能部署到 GitHub Pages（静态托管），需要 Node.js 运行环境（如 Vercel、Railway、自托管等）。

## Open Questions

> [!IMPORTANT]
> 1. **是否保留 GitHub 同步功能？** 还是用 SQLite 完全替代数据存储？
> 2. **是否需要用户认证系统？** 当前是单用户无认证的。
> 3. **部署目标**：打算部署在哪里？（Vercel / 自托管 / 本地使用）

---

## 技术选型

| 技术 | 选型 | 理由 |
|------|------|------|
| 框架 | Next.js 15 (App Router) | 全栈 React 框架，SSR/API Routes |
| CSS | Tailwind CSS v4 | 原项目使用 Tailwind，保持一致 |
| 数据库 | SQLite (better-sqlite3) | 轻量级嵌入式数据库，零配置 |
| ORM | Drizzle ORM | 轻量级 TypeScript ORM，完美配合 SQLite |
| 字体 | Inter + JetBrains Mono | 沿用原设计 |
| MathJax | MathJax 3 CDN | 沿用原功能 |

---

## Proposed Changes

### 1. 项目初始化

#### [NEW] Next.js 项目脚手架

在当前项目目录下初始化 Next.js 项目，使用 `npx create-next-app@latest`，选择 TypeScript + Tailwind CSS + App Router。

---

### 2. 数据库层

#### [NEW] `src/db/schema.ts` - 数据库 Schema

定义三张核心表：

```
articles 表:
  - id (TEXT PK)          ← 原 database 的 key (如 "a_1784306052346")
  - title (TEXT NOT NULL)
  - genre (TEXT)
  - body (TEXT NOT NULL)
  - translation (TEXT)
  - insights (TEXT)       ← JSON 数组序列化
  - grammar (TEXT)        ← JSON 数组序列化
  - vocab (TEXT)          ← JSON 数组序列化
  - specialHTML (TEXT)
  - createdAt (INTEGER)
  - updatedAt (INTEGER)

templates 表:
  - id (TEXT PK)
  - name (TEXT NOT NULL)
  - category (TEXT)
  - content (TEXT NOT NULL)
  - createdAt (INTEGER)
  - updatedAt (INTEGER)
```

#### [NEW] `src/db/index.ts` - 数据库连接

使用 `better-sqlite3` 创建 SQLite 连接，数据库文件存放在项目根目录 `data/notebook.db`。

#### [NEW] `src/db/seed.ts` - 初始数据导入

将原 `index.html` 中嵌入的 5 篇语料和 4 个模板作为种子数据导入。

---

### 3. API 路由 (Next.js Route Handlers)

#### [NEW] `src/app/api/articles/route.ts`
- `GET` — 获取所有语料列表
- `POST` — 导入新语料（支持单条和批量 JSON）

#### [NEW] `src/app/api/articles/[id]/route.ts`
- `GET` — 获取单篇语料详情
- `PUT` — 更新语料（编辑译文、心法、语法、词汇）
- `DELETE` — 删除语料

#### [NEW] `src/app/api/templates/route.ts`
- `GET` — 获取所有模板
- `POST` — 新增模板

#### [NEW] `src/app/api/templates/[id]/route.ts`
- `PUT` — 更新模板
- `DELETE` — 删除模板

---

### 4. 前端页面 & 组件

#### [NEW] `src/app/layout.tsx` - 根布局
- 引入 Inter + JetBrains Mono 字体
- 引入 MathJax
- 全局暖纸学术主题

#### [NEW] `src/app/page.tsx` - 主页面
- 服务端获取初始数据
- 渲染主布局

#### [NEW] `src/components/Sidebar.tsx` - 左侧侧边栏
- 语料列表导航
- 导入按钮
- 删除按钮（hover 显示）
- 当前选中高亮

#### [NEW] `src/components/SourceCard.tsx` - 顶部原文卡
- 英文原文展示（斜体大字）
- 体裁标签

#### [NEW] `src/components/TabBar.tsx` - Tab 切换栏
- 译文对比 & 技巧 / 语法句式剖析 / 重点词汇
- 滑动指示器动画

#### [NEW] `src/components/TranslationTab.tsx` - 译文 Tab
- 精雕学术译文卡片（View/Edit）
- 翻译心法拆解卡片（View/Edit）

#### [NEW] `src/components/GrammarTab.tsx` - 语法 Tab
- 语法句式剖析卡片列表（View/Edit）

#### [NEW] `src/components/VocabTab.tsx` - 词汇 Tab
- 词汇表格（View/Edit）
- 特殊 HTML 展示区

#### [NEW] `src/components/ImportModal.tsx` - 导入弹窗
- JSON 输入框
- 字段说明折叠区
- 字段别名兼容

#### [NEW] `src/components/TemplateModal.tsx` - 模板库弹窗
- 搜索 & 筛选
- 模板卡片列表
- 新增/编辑表单

#### [NEW] `src/app/globals.css` - 全局样式
- 暖纸学术主题色彩系统
- 自定义组件样式（source-card, article-item, tab-indicator 等）
- 滚动条、动画

---

### 5. 状态管理 & 数据流

使用 React 的 `useState` + `useCallback` + SWR (或直接 fetch) 管理客户端状态：
- 当前选中语料 ID
- 当前活跃 Tab
- 编辑模式状态
- 弹窗开关状态

数据突变（CRUD）通过 API 路由完成，突变后刷新客户端数据。

---

## 文件结构预览

```
academic-notebook/
├── index.html              ← 保留旧文件（不删除）
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── data/
│   └── notebook.db         ← SQLite 数据库文件
├── src/
│   ├── db/
│   │   ├── index.ts        ← 数据库连接
│   │   ├── schema.ts       ← 表结构定义
│   │   └── seed.ts         ← 种子数据
│   ├── app/
│   │   ├── layout.tsx      ← 根布局
│   │   ├── page.tsx        ← 主页面
│   │   ├── globals.css     ← 全局样式
│   │   └── api/
│   │       ├── articles/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       └── templates/
│   │           ├── route.ts
│   │           └── [id]/route.ts
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── SourceCard.tsx
│   │   ├── TabBar.tsx
│   │   ├── TranslationTab.tsx
│   │   ├── GrammarTab.tsx
│   │   ├── VocabTab.tsx
│   │   ├── ImportModal.tsx
│   │   └── TemplateModal.tsx
│   └── lib/
│       ├── types.ts        ← TypeScript 类型定义
│       └── normalize.ts    ← JSON 字段别名兼容逻辑
└── README.md               ← 更新后的文档
```

---

## Verification Plan

### Automated Tests
```bash
npm run build    # 验证 TypeScript 编译无错误
npm run dev      # 本地启动验证全部功能
```

### Manual Verification
- 侧边栏语料列表显示、切换、高亮
- Tab 切换 + 滑动指示器动画
- 各板块行内编辑 → 保存 → 持久化到 SQLite
- JSON 导入（单条 / 批量 / 字段别名兼容）
- 删除语料
- 模板库（搜索、筛选、新增、编辑、复制、删除）
- 暖纸学术主题视觉还原
- MathJax 数学公式渲染
