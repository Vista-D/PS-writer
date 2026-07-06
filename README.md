# PS 文书助手 - Personal Statement Writer

> 一键采集文书素材，智能生成英文 Personal Statement，支持 PDF 导出、版本历史、学校要求自动检查。

## 🎯 项目简介

**PS 文书助手** 是面向中国学生申请英国 UCAS 及香港本科的 Web 端 Personal Statement（个人陈述）生成工具。通过 30 道结构化问卷采集素材，提供两种生成方式：

- **模板引擎**：免费、无需 API Key，基于中英词典替换 + 句式润色快速生成初稿。
- **AI 生成**：调用 DeepSeek 大模型，生成更地道、结构更完整的英文文书。

生成后自动执行学校要求检查，支持版本回溯，支持 PDF / Word / TXT / JSON 导出。

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 📋 **30 题问卷** | 分 6 大板块（基本信息、目标专业、学术背景、课外经历、个人特质、未来规划）全面采集素材 |
| 🇬🇧🇭🇰 **双地区支持** | 英国 UCAS（4000 字符限制）/ 香港本科两种规范，AI 按对应结构生成 |
| 🤖 **AI 生成** | 基于 DeepSeek API 生成高质量英文 PS；优先通过 CloudBase 云函数转发，失败自动回退到直连 |
| 📝 **模板生成** | 免费、无需联网，200+ 词汇中英词典替换，适合快速出稿 |
| 🔍 **学校要求自动检查** | 生成 PS 后自动调用 AI 分析目标学校要求，指出覆盖好的方面、遗漏点和改进建议 |
| 📚 **版本历史** | 每次生成自动保存，最多 20 个版本，支持下拉切换和恢复 |
| ✍️ **自由补充** | 文本框自由补充素材，AI 建议写作方向，内容自动合并到生成 prompt |
| 🌐 **中/英切换** | 页面右上角一键切换中英文，所有 UI（含 30 道题）随切换联动 |
| 📄 **PDF 导出** | A4 排版，Times New Roman 12pt，jsPDF 直接生成，不含中文时自动回退 |
| 📥 **Word 导出** | 使用 docx 库生成真实 .docx 文件，失败时自动回退到 TXT |
| 📝 **TXT 导出** | 兼容所有设备，方便后续粘贴到 Word/微信 |
| 💾 **自动保存** | 问卷答案自动保存在浏览器本地，刷新不丢失 |
| 🌙 **明暗主题** | 支持亮/暗色切换，响应式布局，适配手机与电脑 |

## 🚀 在线体验

已部署到腾讯云 CloudBase：

👉 **https://ps-writer-d7gxnn1gne877154f-1445139323.tcloudbaseapp.com/**

## 🏗️ 项目结构

```
├── README.md                          ← 本文件
├── cloudbase.json                     ← CloudBase 部署配置
├── web/
│   └── index.html                     ← 前端单页面应用（完整应用，无需构建）
├── cloudfunctions/
│   └── generate-ps/
│       ├── index.js                   ← CloudBase 云函数（支持 generate/check 双模式）
│       └── package.json               ← 云函数依赖（axios）
└── cloudrun/                          ← 可选 CloudRun 后端示例
```

> 说明：前端为纯 HTML/CSS/JS 单文件，无需打包工具。

## 🛠️ 本地使用

1. 克隆仓库：

```bash
git clone https://github.com/Vista-D/PS-writer.git
cd PS-writer
```

2. 直接用浏览器打开 `web/index.html`，或启动本地静态服务器：

```bash
cd web
python -m http.server 8080
```

3. 打开 `http://localhost:8080` 即可使用。

## 🤖 AI 生成说明

1. 在页面顶部切换到 **🤖 AI 生成** 模式。
2. 点击「如何获取 DeepSeek API Key」展开教程，前往 [platform.deepseek.com](https://platform.deepseek.com) 注册并创建 API Key。
3. 将 API Key 粘贴到输入框并点击「AI 生成」。
4. 生成后自动进行学校要求检查、自动保存版本历史。
5. 可在自由补充区填写额外内容，AI 会自动整合。

**隐私说明**：API Key 仅用于调用 DeepSeek 生成文书。优先通过 CloudBase 云函数 `generate-ps` 转发，不会持久化存储；浏览器本地只保留在 `localStorage` 中，方便下次使用。

## ☁️ 部署到腾讯云 CloudBase

### 前提条件

1. 拥有 [腾讯云账号](https://cloud.tencent.com)
2. 开通 [CloudBase 云开发](https://console.cloud.tencent.com/tcb) 环境

### 部署步骤

#### 方式一：CloudBase CLI

```bash
# 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 登录并选择环境
tcb login

# 部署静态网站和云函数
tcb deploy
```

#### 方式二：手动上传

1. 在 CloudBase 控制台开启「静态网站托管」。
2. 将 `web/index.html` 上传到静态网站根目录。
3. 在「云函数」中创建 `generate-ps` 函数，上传 `cloudfunctions/generate-ps/` 目录代码。

### 访问地址

部署完成后访问：

```
https://${你的环境ID}.tcloudbaseapp.com/
```

当前环境 ID：`ps-writer-d7gxnn1gne877154f`

## 📦 技术栈

- **前端**：HTML5 + CSS3 + JavaScript（单文件，无需框架）
- **文档生成**：jsPDF（PDF）、docx.js（Word）
- **AI 通信**：CloudBase SDK + DeepSeek Chat API
- **云平台**：腾讯云 CloudBase（静态托管 + 云函数）
- **AI 模型**：DeepSeek Chat

## 📄 许可

MIT License © 2026

## 🙏 致谢

- 感谢提供优秀文书范本的学长学姐们
- 感谢 [CodeBuddy](https://codebuddy.cn) 提供的 AI 开发平台
