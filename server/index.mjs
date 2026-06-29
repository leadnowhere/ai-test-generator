import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import { z } from "zod";

const app = express();
const port = Number(process.env.API_PORT || 8787);
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey, timeout: 120_000 }) : null;

const coverageTypes = [
  "正常流程",
  "异常流程",
  "边界值",
  "必填校验",
  "格式校验",
  "状态流转",
  "权限控制",
  "数据一致性",
  "兼容性",
];

const moduleSchema = z.object({
  name: z.string().min(1),
  summary: z.string().min(1),
  rules: z.array(z.string()),
  risks: z.array(z.string()),
});

const pointSchema = z.object({
  moduleName: z.string().min(1),
  title: z.string().min(1),
  coverageType: z.enum(coverageTypes),
  priority: z.enum(["P0", "P1", "P2"]),
});

const testCaseSchema = z.object({
  module: z.string().min(1),
  title: z.string().min(1),
  priority: z.enum(["P0", "P1", "P2"]),
  precondition: z.string(),
  testData: z.string(),
  steps: z.string().min(1),
  expected: z.string().min(1),
  coverageType: z.enum(coverageTypes),
  remark: z.string(),
});

const schemas = {
  modules: {
    type: "object",
    additionalProperties: false,
    required: ["modules"],
    properties: {
      modules: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "summary", "rules", "risks"],
          properties: {
            name: { type: "string" },
            summary: { type: "string" },
            rules: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  },
  points: {
    type: "object",
    additionalProperties: false,
    required: ["points"],
    properties: {
      points: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["moduleName", "title", "coverageType", "priority"],
          properties: {
            moduleName: { type: "string" },
            title: { type: "string" },
            coverageType: { type: "string", enum: coverageTypes },
            priority: { type: "string", enum: ["P0", "P1", "P2"] },
          },
        },
      },
    },
  },
  cases: {
    type: "object",
    additionalProperties: false,
    required: ["cases"],
    properties: {
      cases: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "module", "title", "priority", "precondition", "testData",
            "steps", "expected", "coverageType", "remark",
          ],
          properties: {
            module: { type: "string" },
            title: { type: "string" },
            priority: { type: "string", enum: ["P0", "P1", "P2"] },
            precondition: { type: "string" },
            testData: { type: "string" },
            steps: { type: "string" },
            expected: { type: "string" },
            coverageType: { type: "string", enum: coverageTypes },
            remark: { type: "string" },
          },
        },
      },
    },
  },
};

const prompts = {
  modules: `你是资深软件测试分析师。只根据 PRD 明确出现的内容提取可独立测试的功能模块，PRD 没有提到的模块禁止输出。模块名称只能是短名，例如“考试类型”“筛选条件”“考试统计”。不要把完整句子当标题。相近模块要合并，例如“智能客服”和“智能问答与会话”不要重复输出。不要为了补全而添加通用模块，例如“创建与编辑”“内容与文件”“审批与状态”，除非 PRD 有明确章节或明确业务描述。summary 一句话说明模块目标。rules 输出 2-4 条简明规则，每条不超过 32 个中文字符。禁止输出 Markdown 项目符号、编号前缀、mermaid、流程图代码和中文拆字空格。risks 只写遗漏、歧义或高风险行为。不要虚构 PRD 未提及的具体数值。`,
  points: `你是资深功能测试工程师。根据已确认的需求模块生成高价值测试点。title 不要重复模块名，不要复制长句，只描述要验证的规则或场景。按模块内容选择适用维度，不要机械生成全部维度。必须覆盖核心正常流程、异常处理、必填或校验、数据一致性；权限、状态、兼容性仅在模块涉及时生成。避免重复，优先级按业务影响确定。moduleName 必须使用输入中的模块名称。禁止输出 Markdown 项目符号、编号前缀、mermaid 和中文拆字空格。`,
  cases: `你是资深软件测试工程师。将测试点转换为清晰、可执行、可复现的中文测试用例。title 简短，不复制测试点长句。steps 必须每一步独立换行并带有序号，例如“1. 打开页面”。testData 必须给出具体参数，格式类似“输入：关键词=\"期末考试\"；状态=\"启用\"”，禁止写“输入合法数据/无效数据”。expected 必须可验证，不能写“符合 PRD”。remark 没有特殊说明时必须为空字符串。不要添加实际输出和执行结果字段。module 必须使用输入中的模块名称。禁止输出 Markdown 项目符号、mermaid 和中文拆字空格。`,
};

app.use(express.json({ limit: "3mb" }));

app.get("/api/ai/status", (_request, response) => {
  response.json({ configured: Boolean(client), model: client ? model : null });
});

async function generate(stage, input) {
  if (!client) {
    const error = new Error("AI service is not configured");
    error.status = 503;
    throw error;
  }

  const result = await client.responses.create({
    model,
    input: [
      { role: "system", content: prompts[stage] },
      { role: "user", content: JSON.stringify(input) },
    ],
    text: {
      format: {
        type: "json_schema",
        name: `caseforge_${stage}`,
        strict: true,
        schema: schemas[stage],
      },
    },
  });

  if (!result.output_text) throw new Error("AI returned an empty response");
  return JSON.parse(result.output_text);
}

app.post("/api/ai/modules", async (request, response, next) => {
  try {
    const text = z.string().min(30).max(500_000).parse(request.body?.text);
    const generated = await generate("modules", { prd: text });
    const modules = z.array(moduleSchema).parse(generated.modules).map((item, index) => ({
      id: `module-${index + 1}`,
      ...item,
      enabled: true,
    }));
    response.json({ modules });
  } catch (error) {
    next(error);
  }
});

app.post("/api/ai/test-points", async (request, response, next) => {
  try {
    const modules = z.array(moduleSchema.extend({ id: z.string(), enabled: z.boolean() })).parse(request.body?.modules);
    const enabledModules = modules.filter((item) => item.enabled);
    const generated = await generate("points", { modules: enabledModules });
    const points = z.array(pointSchema).parse(generated.points).map((item, index) => {
      const module = enabledModules.find((candidate) => candidate.name === item.moduleName);
      return {
        id: `point-${index + 1}`,
        moduleId: module?.id || enabledModules[0]?.id || "module-1",
        ...item,
        enabled: true,
      };
    });
    response.json({ points });
  } catch (error) {
    next(error);
  }
});

app.post("/api/ai/test-cases", async (request, response, next) => {
  try {
    const points = z.array(pointSchema.extend({ id: z.string(), moduleId: z.string(), enabled: z.boolean() })).parse(request.body?.points);
    const generated = await generate("cases", { testPoints: points.filter((item) => item.enabled) });
    const cases = z.array(testCaseSchema).parse(generated.cases).map((item, index) => ({
      id: `TC-AI-${String(index + 1).padStart(3, "0")}`,
      ...item,
    }));
    response.json({ cases });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  const status = error.status || (error instanceof z.ZodError ? 400 : 500);
  console.error(error);
  response.status(status).json({
    error: status === 503 ? "AI 服务尚未配置" : "AI 生成失败",
  });
});

app.listen(port, "127.0.0.1", () => {
  console.log(`[CaseForge API] http://127.0.0.1:${port} · ${client ? model : "local fallback"}`);
});
