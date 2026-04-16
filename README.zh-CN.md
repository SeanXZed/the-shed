# The Shed - 乐棚

一个专注于爵士即兴练习的环境。

**English:** [`README.md`](README.md)

## 核心目标

打造一个应用，为爵士乐手提供练习即兴所需的关键工具。它减少在录音应用、伴奏、纸质和弦谱之间来回切换的摩擦，让练习回到“只管演奏与聆听”。

## 目标用户

面向专注于即兴、吐音与乐句表达的爵士乐器演奏者。应用也特别照顾移调乐器（如降 B 管）的使用场景，降低练习时的心算负担（例如把“C 大调（C major）”快速对应成降 B 乐器所需的调性显示）。

## 技术栈

项目采用单仓库（monorepo）架构，前后端共享类型与乐理逻辑。

- **语言**：TypeScript（前后端统一）
- **前端**：React（Next.js App Router）
- **后端**：Next.js Route Handlers（API 路由，与 Web 应用同仓同部署）
- **数据获取**：TanStack Query
- **数据库与存储**：Supabase（账户、练习记录、音频存储）

## 核心功能

- **段落循环（Section Looper）**：在伴奏中截取并无限循环指定段落
- **移调引擎（Transposition Engine）**：动态转调展示和声/音符（适配不同乐器）
- **练习录音（Session Recorder）**：快速录下自己的即兴并回放复盘
- **练习记录（Practice Log）**：记录练习内容与时间，方便长期回顾

## 仓库结构

- `/apps/web`：Next.js Web 应用（UI + API Route Handlers）
- `/packages/shared`：共享 TypeScript 类型与音乐理论逻辑

## 文档

- **产品/架构路线图（游戏化、导师/学生、多租户、区域登录等）**：[`docs/DUOLINGO_FOR_JAZZ_PLAN.md`](docs/DUOLINGO_FOR_JAZZ_PLAN.md)

