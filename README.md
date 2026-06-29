# CaseForge AI 测试用例生成平台

CaseForge 是一个面向 QA / AI 测试工作的 PRD 自动解析与测试用例生成平台。上传 PDF 格式 PRD 后，平台会按「需求模块 -> 测试点 -> 测试用例」的流程生成可编辑、可筛选、可导出的功能测试用例。

## 在线展示

本项目可部署到 GitHub Pages。若使用仓库自带的 GitHub Actions，推送到 `main` 后会自动构建并发布。

## 核心能力

- 上传 PDF PRD 并解析文本内容
- 识别 PRD 中明确出现的需求模块
- 合并相近模块，过滤 PRD 未提到的无关模块
- 生成测试点并按模块内容选择适用覆盖维度
- 生成可编辑测试用例
- 操作步骤自动编号
- 备注默认留空
- 测试数据尽量生成具体参数
- 覆盖率统计：模块、测试点、覆盖维度、综合覆盖率
- 支持搜索、筛选、新增、删除、批量编辑和重新生成
- 支持导出 `.xlsx`、`.csv`、Markdown
- 支持项目历史和本地草稿自动保存
- 未配置 AI 服务时可使用本地规则生成

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- pdfjs-dist
- xlsx
- Express API
- OpenAI Responses API，可选

## 本地启动

```bash
npm install
npm run dev
```

访问：

```text
http://127.0.0.1:5173/
```

API 默认运行在：

```text
http://127.0.0.1:8787/
```

## 本地模式

不配置 OpenAI API Key 时，平台会自动使用本地生成模式。前端仍可完成 PRD 解析、模块识别、测试点生成、测试用例生成和导出。

## 可选 AI 配置

复制环境变量文件：

```bash
cp .env.example .env
```

填写：

```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4.1-mini
API_PORT=8787
```

重新启动：

```bash
npm run dev
```

## 构建

```bash
npm run build
```

静态产物会输出到：

```text
dist/
```

## GitHub Pages 部署

仓库内置 `.github/workflows/deploy.yml`。推送到 `main` 后，GitHub Actions 会：

1. 安装依赖
2. 构建 Vite 静态站点
3. 上传 `dist/`
4. 部署到 GitHub Pages

在 GitHub 仓库中打开：

```text
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

## 说明

GitHub Pages 只部署前端静态页面，因此线上展示默认使用本地规则生成模式。需要真实 AI 服务时，建议部署 API 到 Vercel / Render / Railway 等服务，并把前端请求代理到对应 API。
