# TG 伴读 (TGSH) — 无压力的碎片化阅读 📚

**TG 伴读** 是一个专为“抗焦虑、防走神”打造的 Telegram Mini App 读书器。它支持将长篇电子书切分为易读的微小片段，并在每次重返阅读时，由 AI 自动生成前情提要，记忆阅读进度，帮助读者在碎片时间轻松回归心流。

项目的初衷非常简单：与其每次重新打开书都要艰难回忆“我读到哪了？之前讲了什么？”，不如让程序自动记录进度，并在你开卷前提供一段温和贴心的上下文回顾。

---

## ✨ 核心特性

* 📖 **碎片化微阅读**：将大篇幅文本拆分为短小段落，阅读无负担；
* 📚 **丰富格式支持**：支持 `TXT`、`EPUB`、`FB2` 及 `.fb2.zip`；
* 🤖 **AI 前情提要 (Welcome Bonus)**：离开后再回来，AI 自动回顾已读语境；
* 💾 **阅读进度自动保存**：阅读位置云端持久化，随时中断，随时继续；
* ⏱ **专注时段统计**：记录每次阅读时长，鼓励微小进步；
* 🔥 **连续阅读打卡 (Streaks)**：建立温和习惯，小步慢走；
* 🎯 **沉浸专注模式 (Focus Mode)**：极简排版，屏蔽视觉干扰；
* 📱 **原生小程序体验**：无缝运行在 Telegram Mini Apps 中；
* 🔐 **安全签名鉴权**：通过 Telegram `initData` 加密校验用户身份；
* ⚡ **AI 响应智能缓存**：相同进度与模型命中数据库缓存，秒开不消耗 API 配额。

---

## 🤖 AI 前情提要 (Welcome Bonus)

这是本项目的核心特色之一。

当你在暂停阅读一段时间后重新打开书籍，应用会自动提炼你**已经读过的内容**并生成一段温和的上下文回顾。

### 支持 4 种回顾模式：
* **速览 (Quick)**：3～5 句话的简要概括；
* **情节 (Fiction)**：近期关键事件、当前局势、出场人物与故事氛围；
* **要点 (Non-fiction)**：核心论点、论据与关键概念；
* **人物 (Characters)**：梳理近期登场人物的身份与关系脉络。

> [!IMPORTANT]
> **绝对无剧透保证**：AI 只会接收你当前阅读进度**之前**的文本片段，**未来的内容绝不传入模型**，保证回顾绝不剧透！

### 缓存机制
生成的提要会自动存储在数据库中。缓存键包含：用户、书籍、当前段落、提要类型、AI 模型及提示词版本。相同位置再次打开无需重复请求 AI。若 AI 服务暂时不可用，会自动降级为本地纯文本摘录，确保永远不影响正常阅读。

---

## 🏗 系统架构

```text
Telegram 客户端
   │
   ├── aiogram bot (提供快捷入口与指令)
   │
   ▼
Telegram Mini App (前端单页应用)
   │
   ▼
FastAPI (核心后端服务)
   │
   ├── 用户鉴权 (Telegram initData / Dev Auth)
   ├── 书籍解析与分块 (EPUB/TXT/FB2 Parser)
   ├── 阅读进度与专注时段管理
   └── AI 前情提要引擎
          │
          ▼
      AI 驱动层 (Gemini 等模型)

FastAPI 后端
   │
   ▼
数据库 (SQLite / PostgreSQL)
```

后端业务逻辑与具体 AI 模型完全解耦，未来可轻松扩展切换不同大模型。

---

## 🛠 技术栈

### 后端
* Python 3.10+
* FastAPI
* SQLAlchemy 2.0 (ORM)
* Pydantic
* SQLite（本地极简） / PostgreSQL（生产环境）

### Telegram 生态
* aiogram 3.x
* Telegram Bot API
* Telegram Mini Apps API
* `initData` HMAC-SHA256 签名校验

### AI 接入
* Google Gemini API (如 `gemini-2.5-flash` / `gemini-3.6-flash`)
* 提示词版本化控制与响应缓存

### 前端
* HTML5 / CSS3 / 原生 JavaScript
* 响应式无框架设计，极致轻量，秒开加载

---

## 📂 目录结构

```text
TG-Shevchenko/
│
├── app/
│   ├── models/       # SQLAlchemy 数据库模型
│   ├── routers/      # FastAPI 路由端点 (books, users, sessions, admin)
│   ├── schemas/      # Pydantic 请求与响应结构
│   ├── services/     # 业务逻辑、AI 提示词、鉴权、电子书解析
│   ├── static/       # Mini App 前端静态页面 (index.html, app.js, admin)
│   └── main.py       # FastAPI 主应用入口
│
├── tests/            # 自动化单元测试
├── bot.py            # aiogram 机器人服务
├── requirements.txt  # Python 依赖清单
├── railway.toml      # 云端一键部署配置
└── .env.example      # 环境变量配置模板
```

---

## 📚 电子书支持

支持导入以下格式：
* `.txt`
* `.epub`
* `.fb2`
* `.fb2.zip`

导入后系统会自动清洗文本、智能识别章节标题（支持中文“第X章”等格式），并拆分为指定字数的微读片段。

---

## 🔐 鉴权说明

* **生产环境**：使用 `Telegram.WebApp.initData`，后端使用 `TELEGRAM_BOT_TOKEN` 验证 HMAC 签名，杜绝假冒请求。
* **本地开发模式 (免 TG 调试)**：可在浏览器中直接打开调试，只需在 `.env` 中开启：
  ```env
  ALLOW_DEV_AUTH=true
  ENVIRONMENT=local
  ```
  此时用 Chrome 等普通浏览器访问 `http://127.0.0.1:8000` 即可直接免登录进入阅读器。

---

## 🌐 核心 API 概览

```text
POST /books/upload               # 上传电子书
GET  /books                      # 获取书库列表
GET  /books/{book_id}            # 书籍详情与进度
GET  /books/{book_id}/read       # 获取段落文本阅读
POST /books/{book_id}/progress   # 保存更新阅读进度

GET  /books/{book_id}/welcome-bonus # 获取 AI 前情提要

POST /sessions/start             # 开启专注阅读时段
POST /sessions/end               # 结算专注阅读时段

GET  /health                     # 健康检查
```

本地启动后可访问 Swagger API 交互文档：
`http://127.0.0.1:8000/docs`

---

## 🚀 本地快速启动

### 1. 克隆仓库
```bash
git clone https://github.com/mkafw/TG-Shevchenko.git
cd TG-Shevchenko
```

### 2. 创建并激活虚拟环境
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. 安装依赖
```bash
pip install -r requirements.txt
```

### 4. 配置环境变量
```bash
cp .env.example .env
```
在 `.env` 中按需配置：
```ini
TELEGRAM_BOT_TOKEN="你的TelegramBotToken"
TELEGRAM_WEBAPP_URL="https://你的公网域名"

# 本地开箱即用 SQLite，无需安装 PostgreSQL
DATABASE_URL="sqlite:///./tg_shevchenko.db"

AI_PROVIDER="gemini"
AI_MODEL="gemini-2.5-flash"
GEMINI_API_KEY="你的GeminiAPIKey"

# 本地浏览器免 TG 调试开关
ALLOW_DEV_AUTH=true
```

### 5. 启动 Web 后端
```bash
uvicorn app.main:app --reload
```
打开浏览器访问：`http://127.0.0.1:8000/`

### 6. 启动 Telegram 机器人
另开一个终端：
```bash
source .venv/bin/activate
python bot.py
```

---

## 📱 Telegram 小程序调试

Telegram Mini Apps 强制要求公网 HTTPS。本地测试可使用穿透工具（如 ngrok）：
```bash
ngrok http 8000
```
将分配的 HTTPS 域名填入 `.env` 中的 `TELEGRAM_WEBAPP_URL` 并重启服务即可。

---

## 💡 开发理念

长篇书籍浩瀚的字数、以及每次放下几天后再拿起来时的“前文失忆”，常常成为人们重拾阅读的阻碍。

**TG 伴读** 的探索正是为了打破这一门槛：拆解大部头、记住足迹、温和提要。

> **本项目的目标不是用 AI 摘要替代整本书，恰恰相反——是为了帮助你轻松重返阅读本身。**
