export interface PrdQualityCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export interface PrdAnalysis {
  score: number;
  checks: PrdQualityCheck[];
  preview: string;
}

const includesAny = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword));

export function analyzePrd(text: string): PrdAnalysis {
  const normalized = text.replace(/\s+/g, " ").trim();
  const checks: PrdQualityCheck[] = [
    {
      label: "内容体量",
      passed: normalized.length >= 500,
      detail: normalized.length >= 500 ? "文本量足以支持模块拆分" : "内容较少，生成结果可能不够完整",
    },
    {
      label: "业务流程",
      passed: includesAny(normalized, ["流程", "步骤", "用户", "操作", "进入", "提交"]),
      detail: "用于识别主流程和操作路径",
    },
    {
      label: "业务规则",
      passed: includesAny(normalized, ["规则", "必须", "限制", "条件", "校验", "支持"]),
      detail: "用于生成字段校验和约束类用例",
    },
    {
      label: "异常说明",
      passed: includesAny(normalized, ["异常", "失败", "错误", "不可", "超时", "提示"]),
      detail: "用于覆盖失败路径和错误提示",
    },
    {
      label: "角色权限",
      passed: includesAny(normalized, ["角色", "权限", "管理员", "普通用户", "成员", "登录"]),
      detail: "用于识别不同角色的数据和操作边界",
    },
  ];

  const passedCount = checks.filter((check) => check.passed).length;
  return {
    score: Math.round((passedCount / checks.length) * 100),
    checks,
    preview: normalized,
  };
}
