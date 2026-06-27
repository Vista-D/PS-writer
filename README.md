# PS文书助手 - Personal Statement Writer

> 📝 一键采集文书素材，AI 生成高质量 Personal Statement，智能导出 Word 文档

## 🎯 项目简介

**PS文书助手** 是一个帮助中国学生撰写英国 UCAS 和香港大学申请 Personal Statement（个人陈述/文书）的智能化工具。

### 核心功能

| 功能 | 说明 |
|------|------|
| 📋 **智能问卷** | 30道结构化问题，分6大板块全面采集文书素材 |
| 🇬🇧🇭🇰 **双模式支持** | 英国 UCAS / 香港大学，两套不同的写作规范 |
| 🤖 **AI 生成** | 根据问卷答案自动生成高质量的英文 Personal Statement |
| 📄 **Word 导出** | 一键导出格式精美的 .docx 文档，支持自定义保存路径 |
| 🎨 **美观界面** | 支持亮色/暗色主题，进度追踪，响应式设计 |

## 🚀 快速使用

### 方式一：作为 CodeBuddy Skill 使用（推荐）

1. 确保 `personal-statement-writer` skill 已安装在 `~/.codebuddy/skills/` 下
2. 在 CodeBuddy 中告诉 AI："帮我写一份 Personal Statement"
3. AI 会自动打开问卷页面，引导你填写并生成文书

### 方式二：直接打开 Web 页面

访问在线版本：`[部署后的URL]/`（见下方部署说明）

### 方式三：本地使用

双击打开 `web/index.html` 即可填写问卷，导出 JSON 后发给任意 AI 助手生成文书。

## 🏗️ 项目结构

```
├── README.md                          ← 本文件
├── web/                               ← Web 前端应用
│   ├── index.html                     ← 入口页面（问卷）
│   ├── css/                           ← 样式文件
│   └── js/                            ← 脚本文件
├── skill/                             ← CodeBuddy Skill
│   ├── SKILL.md                       ← 技能定义
│   ├── assets/                        ← 资源文件
│   ├── references/                    ← 参考文档
│   └── scripts/                       ← 脚本文件
├── cloudbase.json                     ← CloudBase 部署配置
└── .github/workflows/                 ← GitHub Actions 自动部署
```

## ☁️ 部署到腾讯云 CloudBase

### 前提条件

1. 拥有 [腾讯云账号](https://cloud.tencent.com)
2. 开通 [CloudBase 云开发](https://console.cloud.tencent.com/tcb) 环境

### 部署步骤

#### 方式一：一键部署（通过 CloudBase CLI）

```bash
# 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 登录腾讯云
tcb login

# 部署到 CloudBase
tcb deploy
```

#### 方式二：GitHub Actions 自动部署

项目已配置 GitHub Actions 工作流，push 到主分支后自动部署。

1. Fork/Clone 本项目到你的 GitHub
2. 在 GitHub 仓库 Settings → Secrets 中添加：
   - `TCB_ENV_ID`：你的 CloudBase 环境 ID
   - `TCB_SECRET_ID`：腾讯云 API 密钥 ID
   - `TCB_SECRET_KEY`：腾讯云 API 密钥 Key
3. Push 代码到 main 分支，自动触发部署

### 访问地址

部署完成后访问：
```
https://${你的环境ID}.tcloudbase.com/ps-writer/
```

## 🌐 部署到 EdgeOne Pages

更简单的静态站点部署方式（无需云开发环境）：

1. 登录 [EdgeOne Pages 控制台](https://edgeone.ai/pages)
2. 选择"创建项目"→"链接 Git"
3. 关联你的 GitHub 仓库
4. 构建设置：框架 = `无`，输出目录 = `web/`
5. 部署完成自动生成访问 URL

## 📦 本地开发

```bash
# 克隆项目
git clone https://github.com/你的用户名/ps-writer.git

# 打开 web 目录
cd ps-writer/web

# 直接用浏览器打开 index.html
# 或使用任意静态文件服务器
python -m http.server 8080
```

## 📜 技术栈

- **前端**: 纯 HTML5 + CSS3 + JavaScript（无需框架）
- **文档生成**: Python (python-docx)
- **云平台**: 腾讯云 CloudBase / EdgeOne Pages
- **AI**: CodeBuddy AI / 任意大语言模型

## 📄 许可

MIT License © 2026

## 🙏 致谢

- 感谢提供优秀文书范本的学长学姐们
- 感谢 [CodeBuddy](https://codebuddy.cn) 提供的 AI 开发平台
