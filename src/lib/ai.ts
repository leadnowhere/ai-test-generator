import { RequirementModule, TestCase, TestPoint } from "../types/testCase";
import { sanitizeModule, sanitizeTestCase, sanitizeTestPoint } from "./generator";

export interface AiStatus {
  configured: boolean;
  model: string | null;
}

async function request<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || `请求失败（${response.status}）`);
  }

  return response.json() as Promise<T>;
}

export const getAiStatus = () => request<AiStatus>("/api/ai/status");

export const generateModulesWithAi = async (text: string) => {
  const result = await request<{ modules: RequirementModule[] }>("/api/ai/modules", { text });
  return result.modules.map(sanitizeModule);
};

export const generateTestPointsWithAi = async (modules: RequirementModule[]) => {
  const result = await request<{ points: TestPoint[] }>("/api/ai/test-points", { modules });
  return result.points.map(sanitizeTestPoint);
};

export const generateTestCasesWithAi = async (points: TestPoint[]) => {
  const result = await request<{ cases: TestCase[] }>("/api/ai/test-cases", { points });
  return result.cases.map(sanitizeTestCase);
};
