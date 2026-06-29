export type Priority = "P0" | "P1" | "P2";

export type CoverageType =
  | "正常流程"
  | "异常流程"
  | "边界值"
  | "必填校验"
  | "格式校验"
  | "状态流转"
  | "权限控制"
  | "数据一致性"
  | "兼容性";

export interface RequirementModule {
  id: string;
  name: string;
  summary: string;
  rules: string[];
  risks: string[];
  enabled: boolean;
}

export interface TestPoint {
  id: string;
  moduleId: string;
  moduleName: string;
  title: string;
  coverageType: CoverageType;
  priority: Priority;
  enabled: boolean;
}

export interface TestCase {
  id: string;
  module: string;
  title: string;
  priority: Priority;
  precondition: string;
  testData: string;
  steps: string;
  expected: string;
  coverageType: CoverageType;
  remark: string;
}

export type WorkspaceStep = "upload" | "modules" | "points" | "cases";

export interface ProjectSnapshot {
  id: string;
  name: string;
  updatedAt: string;
  fileName: string | null;
  fileSize: number;
  prdText: string;
  parsedMeta: { pageCount: number; charCount: number } | null;
  modules: RequirementModule[];
  points: TestPoint[];
  cases: TestCase[];
}
