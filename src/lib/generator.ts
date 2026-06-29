import type {
  CoverageType,
  Priority,
  RequirementModule,
  TestCase,
  TestPoint,
} from "../types/testCase";

const moduleCatalog = [
  {
    name: "智能问答与会话",
    keywords: ["智能客服", "ai客服", "机器人客服", "问答", "对话", "会话", "咨询", "自动回复"],
    summary: "处理用户咨询、上下文对话、答案生成和会话状态。",
    rules: ["根据用户问题生成相关回答", "多轮会话需保持上下文", "无法回答时提供明确兜底"],
    risks: ["回答与知识内容不一致", "上下文丢失导致答非所问", "敏感或违规内容输出"],
  },
  {
    name: "知识库管理",
    keywords: ["知识库", "知识文档", "faq", "语料", "知识条目", "文档解析", "知识更新"],
    summary: "管理客服知识内容的上传、解析、检索、更新和生效。",
    rules: ["知识内容更新后应按规则生效", "检索结果应关联正确知识来源", "异常文档不得污染知识库"],
    risks: ["知识更新延迟", "召回错误或无关知识", "历史知识未正确下线"],
  },
  {
    name: "转人工与坐席协同",
    keywords: ["转人工", "人工客服", "坐席", "客服人员", "接待", "排队", "分配", "技能组"],
    summary: "处理机器人转人工、排队分配、坐席接待和人机协同。",
    rules: ["满足转人工条件时进入人工队列", "会话上下文需同步给坐席", "坐席状态决定是否可分配"],
    risks: ["重复转接或会话丢失", "排队顺序错误", "坐席不可用时缺少兜底"],
  },
  {
    name: "意图识别与会话路由",
    keywords: ["意图", "识别", "路由", "分流", "场景", "分类", "命中"],
    summary: "识别用户诉求并将会话路由到正确机器人、知识或人工服务。",
    rules: ["相同意图应稳定路由到对应服务", "低置信度结果需使用兜底策略", "路由结果应可追踪"],
    risks: ["相近意图误判", "低置信度仍直接回答", "路由循环"],
  },
  {
    name: "工单与问题跟进",
    keywords: ["工单", "问题跟进", "待办", "升级", "处理记录", "闭环"],
    summary: "将未解决咨询转为工单并跟踪处理状态和结果。",
    rules: ["工单需关联原始会话", "状态按合法流程流转", "处理结果需通知相关用户"],
    risks: ["重复创建工单", "会话与工单信息不一致", "工单完成后未通知"],
  },
  {
    name: "客服评价与质检",
    keywords: ["满意度", "评价", "质检", "评分", "服务质量", "抽检"],
    summary: "采集服务评价并对机器人和人工客服会话进行质量检查。",
    rules: ["评价应关联唯一会话", "质检规则对目标会话正确执行", "评分结果需可查询"],
    risks: ["重复评价", "质检漏检或误判", "评分统计与明细不一致"],
  },
  {
    name: "渠道接入与消息",
    keywords: ["渠道", "网页", "web", "app", "微信", "小程序", "消息", "富文本"],
    summary: "处理不同客服渠道的接入、消息收发和内容展示。",
    rules: ["各渠道消息需完整送达", "消息顺序应保持一致", "不支持的消息类型需降级展示"],
    risks: ["跨渠道消息丢失或重复", "消息乱序", "富文本内容展示异常"],
  },
  {
    name: "账号与登录",
    keywords: ["登录", "账号", "密码", "验证码", "注册", "认证"],
    summary: "处理用户身份验证、登录状态和账号异常场景。",
    rules: ["账号与密码必填", "登录成功后进入业务首页", "认证失败时展示明确提示"],
    risks: ["暴力破解和账号锁定策略不明确", "登录态过期处理可能遗漏"],
  },
  {
    name: "用户与权限",
    keywords: ["用户", "角色", "权限", "管理员", "成员", "组织"],
    summary: "管理用户、角色、组织关系以及功能访问权限。",
    rules: ["不同角色只能访问授权功能", "权限变更应及时生效", "敏感操作需要鉴权"],
    risks: ["越权访问", "角色切换后的缓存权限未刷新"],
  },
  {
    name: "内容与文件",
    keywords: ["上传", "文件", "文档", "图片", "内容", "附件", "下载"],
    summary: "处理文件上传、内容解析、预览和下载。",
    rules: ["校验文件格式和大小", "上传过程需反馈状态", "失败后允许重试"],
    risks: ["大文件导致超时", "异常文件解析失败", "文件名和内容安全"],
  },
  {
    name: "查询与列表",
    keywords: ["搜索", "查询", "列表", "筛选", "排序", "分页"],
    summary: "提供数据列表、搜索、筛选、排序和分页能力。",
    rules: ["查询条件可组合", "无数据时展示空状态", "分页与筛选状态保持一致"],
    risks: ["组合筛选结果不准确", "翻页后筛选条件丢失"],
  },
  {
    name: "创建与编辑",
    keywords: ["新增", "创建", "编辑", "修改", "保存", "删除", "提交"],
    summary: "处理业务数据创建、修改、保存和删除流程。",
    rules: ["必填字段需校验", "提交成功后数据可见", "重复提交需被控制"],
    risks: ["并发编辑覆盖数据", "重复提交产生脏数据"],
  },
  {
    name: "审批与状态",
    keywords: ["审批", "审核", "状态", "流程", "驳回", "通过", "撤回"],
    summary: "处理业务状态流转、审批动作和操作记录。",
    rules: ["状态只能按合法路径流转", "审批结果需可追踪", "非法状态禁止操作"],
    risks: ["越级状态流转", "并发审批导致状态冲突"],
  },
  {
    name: "通知与消息",
    keywords: ["通知", "消息", "提醒", "邮件", "短信"],
    summary: "负责站内消息及外部通知的触发与展示。",
    rules: ["业务事件触发正确通知", "通知内容与接收人准确", "重复事件不应重复发送"],
    risks: ["通知遗漏或重复", "敏感信息泄露"],
  },
  {
    name: "报表与导出",
    keywords: ["导出", "报表", "统计", "数据", "excel", "csv"],
    summary: "生成统计结果并支持表格文件导出。",
    rules: ["导出数据与当前筛选一致", "字段顺序符合模板", "大数据量导出有进度反馈"],
    risks: ["导出内容与页面不一致", "特殊字符导致文件损坏"],
  },
] as const;

function hasKeyword(text: string, keywords: readonly string[]) {
  return keywords.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
}

function keywordScore(text: string, keywords: readonly string[]) {
  const lower = text.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword.toLowerCase())).length;
}

function hasStrongCatalogEvidence(name: string, text: string) {
  const lower = text.toLowerCase();
  switch (name) {
    case "智能问答与会话":
      return /智能客服|机器人客服|自动回复|问答|多轮对话|用户咨询/.test(text);
    case "知识库管理":
      return /知识库|知识文档|知识条目|FAQ|faq|语料/.test(text);
    case "转人工与坐席协同":
      return /转人工|人工客服|坐席|排队|技能组/.test(text);
    case "意图识别与会话路由":
      return /意图|路由|分流|低置信度|澄清/.test(text);
    case "工单与问题跟进":
      return /工单|问题跟进|处理记录|闭环/.test(text);
    case "客服评价与质检":
      return /满意度|服务评价|质检|评分/.test(text);
    case "渠道接入与消息":
      return /渠道|微信|小程序|网页客服|web客服|app客服|富文本消息/.test(lower);
    case "账号与登录":
      return /登录|注册|密码|验证码|认证/.test(text);
    case "用户与权限":
      return /权限|角色|授权|越权|管理员/.test(text);
    case "内容与文件":
      return /上传|附件|文件|文档解析|文件预览|下载/.test(text);
    case "查询与列表":
      return /搜索|查询|筛选|排序|分页|列表/.test(text);
    case "创建与编辑":
      return /新增|创建|编辑|修改|删除|保存|提交/.test(text)
        && /表单|字段|数据|记录|条目|任务|工单/.test(text);
    case "审批与状态":
      return /审批|审核|驳回|撤回|状态流转|状态变更/.test(text);
    case "通知与消息":
      return /通知|提醒|邮件|短信|站内信/.test(text);
    case "报表与导出":
      return /报表|统计|导出|excel|csv/.test(lower);
    default:
      return hasKeyword(text, moduleCatalog.find((item) => item.name === name)?.keywords ?? []);
  }
}

const headingPattern = /^(?:第?[一二三四五六七八九十百]+[章节、.]|\(?\d+(?:\.\d+){0,2}\)?[、.．\s]|[（(][一二三四五六七八九十]+[）)])\s*/;
const genericHeadings = new Set(["产品概述", "需求背景", "项目背景", "目标", "术语", "目录", "附录", "版本记录"]);
const ruleMarkers = ["必须", "需要", "支持", "允许", "禁止", "不能", "不得", "默认", "当", "如果", "限制", "应", "可"];
const errorMarkers = ["异常", "失败", "错误", "超时", "无效", "兜底", "重试", "不可用"];
const permissionMarkers = ["角色", "权限", "管理员", "坐席", "用户", "可见", "授权"];
const moduleNouns = /(?:功能|模块|管理|配置|设置|接入|问答|会话|知识库|工单|客服|机器人|坐席|质检|评价|意图|路由|筛选条件|查询条件|考试类型|考试|任务|列表|详情|入口|授权|统计|报表)$/;
const actionMarkers = ["支持", "可以", "用户", "管理员", "系统", "默认", "允许", "需要", "必须", "展示", "提供"];
const sentenceVerbs = ["支持", "可以", "需要", "必须", "只能", "选择", "展开", "点击", "如果", "当", "校验", "展示", "完成", "允许", "默认", "查看", "录入", "提交", "发起", "关闭", "刷新", "创建", "作为", "想要", "以便"];
const nonRequirementMarkers = ["mermaid", "流程图", "业务流程图", "sequenceDiagram", "graph ", "flowchart"];
const maxModules = 10;

export function normalizeDisplayText(value: string, maxLength = 72): string {
  const userStoryAction = value.match(/作为.+?[，,]\s*(?:我)?想要\s*(.+?)(?:[，,]\s*以便.+)?$/)?.[1];
  const clean = value
    .replace(/^.*?作为.+?[，,]\s*(?:我)?想要\s*(.+?)(?:[，,]\s*以便.+)?$/, "$1")
    .replace(/\r/g, "\n")
    .replace(/[`*_#]/g, "")
    .replace(/[\u2022·●○▪▫◆◇■□]+/g, "")
    .replace(/^[\s\-—–]+/gm, "")
    .replace(/^\s*\d+[.、]\s*/gm, "")
    .replace(/\s+/g, " ")
    .replace(/(?<=[\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])/g, "")
    .replace(/(?<=[\u4e00-\u9fa5])\s+(?=[A-Za-z0-9])/g, "")
    .replace(/(?<=[A-Za-z0-9])\s+(?=[\u4e00-\u9fa5])/g, "")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+([，。；：！？、])/g, "$1")
    .replace(/([，。；：！？、])\s+(?=[\u4e00-\u9fa5A-Za-z0-9])/g, "$1")
    .replace(/([（【《“])\s+/g, "$1")
    .replace(/\s+([）】》”])/g, "$1")
    .replace(/^(?:核心目标|目标|核心规则|规则)[：:]?/, "")
    .replace(/^\d+(?=[\u4e00-\u9fa5])/, "")
    .replace(/^在(?=.+(?:客服|模块|管理|配置|设置|列表|统计|报表|页面|功能)$)/, "")
    .replace(/^[，,。；;：:\s]+|[，,。；;：:\s]+$/g, "")
    .trim();
  const normalized: string = userStoryAction ? normalizeDisplayText(userStoryAction, maxLength) : clean;
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}…` : normalized;
}

function conciseText(value: string, maxLength = 64) {
  return normalizeDisplayText(value.replace(headingPattern, ""), maxLength);
}

function cleanHeading(value: string): string {
  let clean = normalizeDisplayText(value, 80)
    .replace(headingPattern, "")
    .replace(/[：:]$/, "");
  const nestedHeadings = clean.match(/(?:\d+\.)+\d*\s*([^。；：:]+)/g) ?? [];
  const nestedHeading = nestedHeadings[nestedHeadings.length - 1];
  if (nestedHeading) clean = nestedHeading.replace(/^(?:\d+\.)+\d*\s*/, "").trim();
  const clauses = clean.split(/[。；;！？!?]/).map((item: string) => item.trim()).filter(Boolean);
  if (clauses.length > 1) clean = clauses[clauses.length - 1];
  clean = clean
    .replace(/(?:页面支持|支持以下|系统支持|用户可以|主要包括|具体说明|用于).*/, "")
    .replace(/[，,。；;：:]$/, "")
    .trim();
  const tokens = clean.split(/\s+/).filter(Boolean);
  const meaningfulToken = [...tokens].reverse().find((token) => moduleNouns.test(token));
  if (meaningfulToken) clean = meaningfulToken;
  return normalizeDisplayText(clean, 12);
}

function isLikelyHeading(line: string) {
  if (nonRequirementMarkers.some((marker) => line.toLowerCase().includes(marker.toLowerCase()))) return false;
  if (/作为.+?(我想要|以便|为了)/.test(line)) return false;
  const clean = cleanHeading(line);
  if (clean.length < 2 || clean.length > 12 || genericHeadings.has(clean)) return false;
  if (/[，,。；;！？!?]/.test(clean)) return false;
  const hasSentenceVerb = sentenceVerbs.some((marker) => line.includes(marker));
  const hasExplicitHeading = headingPattern.test(line);
  if (hasSentenceVerb && !hasExplicitHeading) return false;
  if ((clean.length > 8 || /^[后若则如当]/.test(clean)) && hasSentenceVerb) return false;
  if (moduleNouns.test(clean)) return !hasSentenceVerb || hasExplicitHeading;
  return headingPattern.test(line)
    && clean.length <= 8
    && !hasSentenceVerb;
}

function compactRule(value: string): string {
  let rule = normalizeDisplayText(value, 80)
    .replace(/(?:例如|比如|示例)[：:]?.*$/, "")
    .replace(/^选择[“"]?([^”"]+)[”"]?时[，,]?/, "$1：")
    .replace(/^当(.+?)时[，,]?/, "$1：")
    .replace(/用户需要/g, "需")
    .replace(/用户可以/g, "可")
    .replace(/系统可以/g, "系统可")
    .replace(/不需要/g, "无需")
    .replace(/\s+/g, " ")
    .trim();
  const clauses = rule.split(/[，,]/).map((item: string) => item.trim()).filter(Boolean);
  rule = clauses.slice(0, 2).join("；");
  return normalizeDisplayText(rule, 36);
}

function normalizeRules(rules: string[]) {
  const seen = new Set<string>();
  return rules
    .map((rule) => compactRule(rule).replace(/^\d+[.、]\s*/, "").replace(/^[•·\-—–]\s*/, ""))
    .filter((rule) => {
      if (!rule || seen.has(rule)) return false;
      seen.add(rule);
      return true;
    })
    .slice(0, 4);
}

function canonicalModuleName(name: string) {
  const clean = normalizeDisplayText(name.replace(/模块$/, ""), 12);
  if (/智能客服|智能问答|机器人客服|问答|会话/.test(clean)) return "智能问答与会话";
  if (/知识库|知识文档|知识管理|FAQ/i.test(clean)) return "知识库管理";
  if (/转人工|人工客服|坐席/.test(clean)) return "转人工与坐席协同";
  if (/意图|路由|澄清/.test(clean)) return "意图识别与会话路由";
  if (/工单|跟进|闭环/.test(clean)) return "工单与问题跟进";
  if (/评价|满意度|质检/.test(clean)) return "客服评价与质检";
  if (/渠道|消息|微信|小程序|网页/.test(clean)) return "渠道接入与消息";
  if (/权限|角色|管理员|授权/.test(clean)) return "用户与权限";
  if (/查询|搜索|筛选|列表|分页/.test(clean)) return "查询与列表";
  return clean;
}

function mergeModules(modules: RequirementModule[]) {
  const merged = new Map<string, RequirementModule>();
  modules.forEach((module) => {
    const key = canonicalModuleName(module.name);
    if (!key) return;
    const current = merged.get(key);
    if (!current) {
      merged.set(key, sanitizeModule({ ...module, name: key }));
      return;
    }
    merged.set(key, sanitizeModule({
      ...current,
      summary: current.summary.length >= module.summary.length ? current.summary : module.summary,
      rules: normalizeRules([...current.rules, ...module.rules]),
      risks: [...current.risks, ...module.risks].slice(0, 4),
      enabled: current.enabled || module.enabled,
    }));
  });
  return [...merged.values()].map((module, index) => ({
    ...module,
    id: `MOD-${String(index + 1).padStart(2, "0")}`,
  }));
}

function sentences(value: string) {
  return value
    .replace(/(\d+(?:\.\d+)+)\s*/g, "\n$1 ")
    .split(/[。；;！？!?\n]/)
    .map((item) => normalizeDisplayText(item, 72))
    .filter((item) => item.length >= 8 && !isLikelyHeading(item) && !nonRequirementMarkers.some((marker) => item.toLowerCase().includes(marker.toLowerCase())));
}

function extractSections(text: string) {
  const lines = text
    .split(/\n+/)
    .map((item) => normalizeDisplayText(item, 120))
    .filter(Boolean);
  const sections: Array<{ name: string; body: string[] }> = [];
  let currentSection: { name: string; body: string[] } | null = null;

  for (const line of lines) {
    if (isLikelyHeading(line)) {
      const name = cleanHeading(line);
      currentSection = sections.find((item) => item.name === name) ?? { name, body: [] };
      if (!sections.includes(currentSection)) sections.push(currentSection);
      continue;
    }
    currentSection?.body.push(line);
  }

  return sections
    .filter((item) => item.body.join("").length >= 12)
    .slice(0, 8);
}

function sectionToModule(section: { name: string; body: string[] }, index: number): RequirementModule {
  const bodySentences = sentences(section.body.join("。"));
  const rankedSentences = [...bodySentences].sort((a, b) => {
    const score = (item: string) => actionMarkers.filter((marker) => item.includes(marker)).length * 10 + Math.min(item.length, 50);
    return score(b) - score(a);
  });
  const rules = rankedSentences
    .filter((item) => ruleMarkers.some((marker) => item.includes(marker)))
    .map(compactRule)
    .filter(Boolean)
    .slice(0, 3);
  const fallbackRules = section.body
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length >= 6)
    .slice(0, 3);
  const hasErrors = bodySentences.some((item) => errorMarkers.some((marker) => item.includes(marker)));
  const hasPermissions = bodySentences.some((item) => permissionMarkers.some((marker) => item.includes(marker)));
  return {
    id: `MOD-${String(index + 1).padStart(2, "0")}`,
    name: section.name,
    summary: normalizeDisplayText(rankedSentences[0] ?? `验证${section.name}的业务流程和规则。`, 72),
    rules: normalizeRules(rules.length
      ? rules
      : (bodySentences.slice(0, 3).length ? bodySentences.slice(0, 3) : fallbackRules)),
    risks: [
      ...(!hasErrors ? ["PRD 未明确该模块的异常和失败处理"] : []),
      ...(!hasPermissions ? ["PRD 未明确该模块的角色与权限边界"] : []),
    ].slice(0, 3),
    enabled: true,
  };
}

function hasSectionEvidence(section: { name: string; body: string[] }) {
  const text = `${section.name}${section.body.join("")}`;
  if (moduleCatalog.some((item) => hasStrongCatalogEvidence(item.name, text))) return true;
  return actionMarkers.some((marker) => text.includes(marker))
    || ruleMarkers.some((marker) => text.includes(marker))
    || /输入|输出|页面|按钮|字段|列表|状态|流程|权限|校验|提交|保存|上传|查询|生成|导出/.test(text);
}

export function generateModules(text: string): RequirementModule[] {
  const structuredSections = extractSections(text);
  const normalized = text.replace(/\s+/g, " ").trim();
  const keywordSupplementBlocked = new Set(["内容与文件", "创建与编辑", "审批与状态"]);
  const matches = moduleCatalog
    .map((item) => ({ item, score: keywordScore(normalized, item.keywords) }))
    .filter(({ item, score }) =>
      score > 0
      && hasStrongCatalogEvidence(item.name, normalized)
      && !keywordSupplementBlocked.has(item.name),
    )
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
  const structuredModules = structuredSections
    .filter(hasSectionEvidence)
    .map(sectionToModule)
    .map(sanitizeModule);
  const keywordModules = matches.map((item, index) => sanitizeModule({
    id: `CAT-${String(index + 1).padStart(2, "0")}`,
    name: normalizeDisplayText(item.name, 12),
    summary: normalizeDisplayText(item.summary, 72),
    rules: normalizeRules([...item.rules]),
    risks: [...item.risks],
    enabled: true,
  }));
  return mergeModules([...structuredModules, ...keywordModules]).slice(0, maxModules);
}

const pointTemplates: Array<{
  coverageType: CoverageType;
  priority: Priority;
  title: (moduleName: string) => string;
}> = [
  { coverageType: "正常流程", priority: "P0", title: () => "核心流程正常完成" },
  { coverageType: "必填校验", priority: "P0", title: () => "必填信息缺失校验" },
  { coverageType: "异常流程", priority: "P1", title: () => "异常输入和服务失败处理" },
  { coverageType: "边界值", priority: "P1", title: () => "字段长度及数量边界校验" },
  { coverageType: "权限控制", priority: "P1", title: () => "角色权限边界校验" },
  { coverageType: "数据一致性", priority: "P1", title: () => "操作前后数据一致" },
  { coverageType: "格式校验", priority: "P1", title: () => "字段格式和特殊字符校验" },
  { coverageType: "状态流转", priority: "P1", title: () => "合法与非法状态流转" },
  { coverageType: "兼容性", priority: "P2", title: () => "常用浏览器兼容性" },
];

const coverageTitleSuffix: Record<CoverageType, string> = {
  正常流程: "正常",
  异常流程: "异常",
  边界值: "边界",
  必填校验: "必填",
  格式校验: "格式",
  状态流转: "状态",
  权限控制: "权限",
  数据一致性: "一致性",
  兼容性: "兼容",
};

export function generateTestPoints(modules: RequirementModule[]): TestPoint[] {
  return modules
    .filter((module) => module.enabled)
    .flatMap((module) => {
      const moduleText = `${module.name}${module.summary}${module.rules.join("")}${module.risks.join("")}`;
      const applicable = pointTemplates.filter((template) => {
        if (["正常流程", "必填校验", "异常流程", "数据一致性"].includes(template.coverageType)) return true;
        if (template.coverageType === "权限控制") return /权限|角色|管理员|用户|授权|可见/.test(moduleText);
        if (template.coverageType === "状态流转") return /状态|流程|通过|驳回|关闭|完成|排队|转接/.test(moduleText);
        if (template.coverageType === "格式校验") return /输入|字段|格式|文本|文件|号码|邮箱|名称/.test(moduleText);
        if (template.coverageType === "边界值") return /数量|长度|大小|次数|阈值|限制|分页|超时/.test(moduleText);
        if (template.coverageType === "兼容性") return /渠道|网页|浏览器|移动端|小程序|APP|app/.test(moduleText);
        return true;
      }).slice(0, 7);
      return applicable.map((template, index) => {
        const relatedRule = module.rules[index % Math.max(module.rules.length, 1)];
        const title = relatedRule && relatedRule.length <= 20
          ? `${relatedRule}-${coverageTitleSuffix[template.coverageType]}`
          : template.title(module.name);
        return sanitizeTestPoint({
          id: `${module.id}-PT-${String(index + 1).padStart(2, "0")}`,
          moduleId: module.id,
          moduleName: normalizeDisplayText(module.name, 12),
          title: normalizeDisplayText(title, 48),
          coverageType: template.coverageType,
          priority: template.priority,
          enabled: true,
        });
      });
    });
}

export function sanitizeModule(module: RequirementModule): RequirementModule {
  return {
    ...module,
    name: normalizeDisplayText(module.name, 12) || "未命名模块",
    summary: normalizeDisplayText(module.summary, 72) || "验证该模块的业务流程和规则。",
    rules: normalizeRules(module.rules),
    risks: module.risks.map((risk) => normalizeDisplayText(risk, 48)).filter(Boolean).slice(0, 3),
  };
}

export function sanitizeTestPoint(point: TestPoint): TestPoint {
  const title = normalizeDisplayText(
    point.title
      .replace(point.moduleName, "")
      .replace(/[（）()]/g, " ")
      .replace(point.coverageType, "")
      .trim(),
    32,
  );
  return {
    ...point,
    moduleName: normalizeDisplayText(point.moduleName, 12),
    title: title || normalizeDisplayText(point.title, 32),
  };
}

function numberSteps(steps: string) {
  return steps
    .replace(/\s+(?=\d+[.、]\s*)/g, "\n")
    .split(/\n+/)
    .map((line) => normalizeDisplayText(line.replace(/^\d+[.、]\s*/, ""), 96))
    .filter(Boolean)
    .map((line, index) => `${index + 1}. ${line}`)
    .join("\n");
}

export function sanitizeTestCase(item: TestCase): TestCase {
  return {
    ...item,
    module: normalizeDisplayText(item.module, 12),
    title: normalizeDisplayText(item.title, 48),
    precondition: normalizeDisplayText(item.precondition, 96),
    testData: normalizeDisplayText(item.testData, 120),
    steps: numberSteps(item.steps),
    expected: normalizeDisplayText(item.expected, 120),
    remark: normalizeDisplayText(item.remark, 80)
      .replace("由需求解析结果生成，执行前请结合真实业务数据复核。", ""),
  };
}

function buildCase(point: TestPoint, sequence: number): TestCase {
  const idPrefix = point.moduleId.replace("MOD-", "");
  const common = {
    id: `TC-${idPrefix}-${String(sequence).padStart(3, "0")}`,
    module: point.moduleName,
    title: point.title,
    priority: point.priority,
    coverageType: point.coverageType,
    remark: "",
  };
  const concreteData = getConcreteTestData(point);
  const action = getModuleAction(point);

  switch (point.coverageType) {
    case "正常流程":
      return {
        ...common,
        precondition: `用户具备${point.moduleName}操作权限，相关服务和依赖数据正常。`,
        testData: concreteData,
        steps: `打开${point.moduleName}\n${action}\n提交操作\n查看页面结果和关联数据`,
        expected: `${point.moduleName}操作成功，页面展示成功提示，新增或更新的数据可查询。`,
      };
    case "必填校验":
      return {
        ...common,
        precondition: "已进入对应功能页面。",
        testData: concreteData,
        steps: `进入${point.moduleName}功能\n将关键必填信息留空\n填写其他有效信息\n提交操作`,
        expected: "系统阻止提交，并在对应字段附近展示清晰的必填提示。",
      };
    case "边界值":
      return {
        ...common,
        precondition: "已确认字段长度或数量限制。",
        testData: concreteData,
        steps: "依次输入最小值、临界值和超限值\n分别提交每组数据\n记录每组数据的校验结果",
        expected: "合法边界值可正常提交；越界值被阻止并展示准确提示。",
      };
    case "权限控制":
      return {
        ...common,
        precondition: "准备有权限和无权限的两类测试账号。",
        testData: concreteData,
        steps: `使用授权账号访问${point.moduleName}并完成操作\n退出登录\n使用未授权账号访问相同入口或地址\n尝试执行同一操作`,
        expected: "授权账号可正常操作；未授权账号看不到入口或被拒绝访问，且无敏感数据泄露。",
      };
    case "数据一致性":
      return {
        ...common,
        precondition: "可查询操作前后的页面数据或后台数据。",
        testData: concreteData,
        steps: `记录${point.moduleName}操作前数据\n执行“${point.title}”对应操作\n刷新并重新查询\n核对关联页面或下游数据`,
        expected: "页面、关联模块和持久化数据状态一致，不出现重复或脏数据。",
      };
    case "格式校验":
      return {
        ...common,
        precondition: "已进入对应功能页面。",
        testData: concreteData,
        steps: `进入${point.moduleName}功能\n输入格式错误或包含特殊字符的数据\n提交操作\n查看字段提示和数据保存结果`,
        expected: "系统阻止保存非法格式数据，提示内容指向具体字段，原数据不被污染。",
      };
    case "状态流转":
      return {
        ...common,
        precondition: "已准备满足状态流转条件的数据。",
        testData: concreteData,
        steps: `打开${point.moduleName}详情\n执行合法状态变更\n刷新页面查看最新状态\n尝试执行非法状态变更`,
        expected: "合法状态变更成功并留痕；非法状态变更被拒绝，状态保持不变。",
      };
    case "兼容性":
      return {
        ...common,
        precondition: "已准备不同浏览器或渠道环境。",
        testData: concreteData,
        steps: `在指定浏览器或渠道打开${point.moduleName}\n完成核心操作流程\n检查页面布局、输入和结果展示\n切换到下一环境重复验证`,
        expected: "各环境核心流程可完成，布局不遮挡，输入和结果展示一致。",
      };
    default:
      return {
        ...common,
        precondition: "已进入对应功能，测试环境可用。",
        testData: concreteData,
        steps: `打开${point.moduleName}\n输入测试数据\n提交操作\n查看提示和数据变化`,
        expected: "系统正确拦截或处理，数据无异常。",
      };
  }
}

function getModuleAction(point: TestPoint) {
  const context = `${point.moduleName}${point.title}`;
  if (/知识库|知识文档/.test(context)) return "上传或选择知识文档并填写知识标题";
  if (/转人工|坐席/.test(context)) return "输入转人工诉求并触发转人工";
  if (/工单/.test(context)) return "创建工单并填写问题描述";
  if (/评价|满意度/.test(context)) return "提交服务评分和评价内容";
  if (/意图|路由|澄清/.test(context)) return "输入用户咨询内容并触发意图识别";
  if (/查询|搜索|筛选|列表/.test(context)) return "输入查询条件并执行搜索";
  if (/权限|用户|角色/.test(context)) return "选择角色并配置功能权限";
  return "输入测试数据";
}

function getConcreteTestData(point: TestPoint) {
  const context = `${point.moduleName}${point.title}`.toLowerCase();
  switch (point.coverageType) {
    case "必填校验":
      return '输入：必填字段=""';
    case "边界值":
      return "输入：长度=0、1、255、256";
    case "格式校验":
      return '输入：文本="test@@"、"<script>alert(1)</script>"';
    case "权限控制":
      return '账号：authorized_user、unauthorized_user';
    case "状态流转":
      return '当前状态="待处理"；目标状态="已完成"';
    case "数据一致性":
      return '记录ID="CF-TEST-001"';
    case "兼容性":
      return "浏览器：Chrome 126、Safari 17、Edge 126";
    case "异常流程":
      return '输入：内容=""；模拟接口HTTP 500';
    default:
      if (/知识库|知识文档|文档解析/.test(context)) return '文件="knowledge-test.pdf"（1MB）；标题="退款规则"';
      if (/转人工|坐席|人工客服/.test(context)) return '输入：问题="转人工"；连续未解决次数=2';
      if (/工单/.test(context)) return '会话ID="CHAT-001"；问题="退款未到账"';
      if (/评价|满意度|质检/.test(context)) return '会话ID="CHAT-001"；满意度=5';
      if (/问答|会话|客服|机器人/.test(context)) return '输入：用户问题="订单一直未发货怎么办？"';
      if (/筛选|查询|搜索/.test(context)) return '输入：关键词="期末考试"；状态="启用"';
      return '输入：名称="测试数据001"；状态="启用"';
  }
}

export function generateTestCases(points: TestPoint[]): TestCase[] {
  return points
    .filter((point) => point.enabled)
    .map((point, index) => sanitizeTestCase(buildCase(point, index + 1)));
}

export function regenerateModule(module: RequirementModule, text: string): RequirementModule {
  const candidates = generateModules(text);
  const replacement = candidates.find((item) => item.name === module.name) ?? candidates[0];
  return replacement
    ? sanitizeModule({ ...replacement, id: module.id, name: module.name, enabled: module.enabled })
    : { ...module };
}

export function regenerateTestCase(item: TestCase): TestCase {
  const point: TestPoint = {
    id: `${item.id}-POINT`,
    moduleId: item.module.replace(/\s+/g, "-") || "CUSTOM",
    moduleName: item.module,
    title: item.title,
    coverageType: item.coverageType,
    priority: item.priority,
    enabled: true,
  };
  return sanitizeTestCase({ ...buildCase(point, 1), id: item.id });
}

export const demoPrdText = `
产品名称：AI 测试用例生成平台
用户上传 PDF 格式 PRD，系统解析文档并识别功能模块、业务规则和风险点。
系统按模块生成正常、异常、边界、权限和数据一致性测试点，再生成结构化测试用例。
用户可以搜索、筛选、编辑和删除测试用例，并导出 CSV、Excel 和 Markdown 文件。
上传文件需要校验格式和大小，解析失败时允许重新上传。
`;
