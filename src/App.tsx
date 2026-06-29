import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Download,
  FileSearch,
  FileSpreadsheet,
  FileText,
  Filter,
  FlaskConical,
  FolderOpen,
  Gauge,
  History,
  ListChecks,
  Layers3,
  LoaderCircle,
  Plus,
  RefreshCcw,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  generateModulesWithAi,
  generateTestCasesWithAi,
  generateTestPointsWithAi,
  getAiStatus,
} from "./lib/ai";
import { analyzeCoverage } from "./lib/coverage";
import {
  clearDraft,
  createProject,
  deleteProject,
  loadActiveProjectId,
  loadDraft,
  loadProjects,
  saveActiveProjectId,
  saveDraft,
  upsertProject,
} from "./lib/draft";
import { ExportFormat, exportTestCases, testCaseColumns } from "./lib/exporters";
import {
  demoPrdText,
  generateModules,
  generateTestCases,
  generateTestPoints,
  regenerateModule,
  regenerateTestCase,
  sanitizeModule,
  sanitizeTestCase,
  sanitizeTestPoint,
} from "./lib/generator";
import { parsePdf } from "./lib/pdf";
import { analyzePrd, PrdAnalysis } from "./lib/prdQuality";
import {
  CoverageType,
  Priority,
  ProjectSnapshot,
  RequirementModule,
  TestCase,
  TestPoint,
  WorkspaceStep,
} from "./types/testCase";

const steps: Array<{
  id: WorkspaceStep;
  label: string;
  description: string;
}> = [
  { id: "upload", label: "上传 PRD", description: "PDF 文档解析" },
  { id: "modules", label: "需求模块", description: "确认模块与规则" },
  { id: "points", label: "测试点", description: "覆盖维度审阅" },
  { id: "cases", label: "测试用例", description: "编辑与导出" },
];

const coverageOptions: CoverageType[] = [
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

const priorityOptions: Priority[] = ["P0", "P1", "P2"];

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

type AiMode = "checking" | "ai" | "local" | "fallback";

function StepRail({
  activeStep,
  onSelect,
  currentProject,
  projects,
  onNewProject,
  onLoadProject,
}: {
  activeStep: WorkspaceStep;
  onSelect: (step: WorkspaceStep) => void;
  currentProject: ProjectSnapshot;
  projects: ProjectSnapshot[];
  onNewProject: () => void;
  onLoadProject: (project: ProjectSnapshot) => void;
}) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);

  return (
    <aside className="step-rail">
      <div className="brand">
        <div className="brand-mark">
          <FlaskConical size={19} strokeWidth={2.2} />
        </div>
        <div>
          <strong>CaseForge</strong>
          <span>AI 测试工作台</span>
        </div>
      </div>

      <nav className="step-nav" aria-label="生成步骤">
        <p className="rail-label">生成流程</p>
        {steps.map((step, index) => {
          const completed = index < activeIndex;
          const active = step.id === activeStep;
          const available = index <= activeIndex;
          return (
            <button
              className={`step-item ${active ? "is-active" : ""} ${completed ? "is-complete" : ""}`}
              disabled={!available}
              key={step.id}
              onClick={() => onSelect(step.id)}
              type="button"
            >
              <span className="step-index">
                {completed ? <Check size={14} /> : index + 1}
              </span>
              <span>
                <strong>{step.label}</strong>
                <small>{step.description}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="project-panel">
        <div className="project-panel-heading">
          <span>当前项目</span>
          <button className="mini-icon-button" onClick={onNewProject} title="新建项目" type="button">
            <Plus size={13} />
          </button>
        </div>
        <strong>{currentProject.name}</strong>
        <select
          onChange={(event) => {
            const target = projects.find((item) => item.id === event.target.value);
            if (target) onLoadProject(target);
          }}
          value={currentProject.id}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
      </div>

      <div className="rail-note">
        <FlaskConical size={16} />
        <div>
          <strong>CaseForge V0</strong>
          <span>功能测试用例设计</span>
        </div>
      </div>
    </aside>
  );
}

function Header({
  activeStep,
  isWorking,
  aiMode,
  draftSavedAt,
  onClearDraft,
}: {
  activeStep: WorkspaceStep;
  isWorking: boolean;
  aiMode: AiMode;
  draftSavedAt: string;
  onClearDraft: () => void;
}) {
  const current = steps.find((step) => step.id === activeStep)!;
  const statusLabel = {
    checking: "检查 AI 服务",
    ai: "AI 服务已连接",
    local: "本地生成模式",
    fallback: "AI 异常 · 本地模式",
  }[aiMode];
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">CASEFORGE WORKFLOW</p>
        <h1>{current.label}</h1>
      </div>
      <div className="topbar-actions">
        {draftSavedAt && (
          <span className="draft-status" title={`草稿保存于 ${draftSavedAt}`}>
            <Save size={14} />
            已自动保存
          </span>
        )}
        <span className={`status-chip ${isWorking ? "is-working" : ""}`}>
          {isWorking ? <LoaderCircle className="spin" size={14} /> : <span className="status-dot" />}
          {isWorking ? "正在处理" : statusLabel}
        </span>
        <button className="icon-button" title="使用帮助" type="button">
          <CircleHelp size={18} />
        </button>
        <button className="icon-button" onClick={onClearDraft} title="清空当前草稿" type="button">
          <Trash2 size={17} />
        </button>
      </div>
    </header>
  );
}

function UploadStage({
  file,
  fileSize,
  projects,
  currentProject,
  isWorking,
  parsedMeta,
  analysis,
  error,
  onFile,
  onRemove,
  onGenerate,
  onUseDemo,
  onNewProject,
  onLoadProject,
  onRenameProject,
  onDeleteProject,
}: {
  file: File | null;
  fileSize: number;
  projects: ProjectSnapshot[];
  currentProject: ProjectSnapshot;
  isWorking: boolean;
  parsedMeta: { pageCount: number; charCount: number } | null;
  analysis: PrdAnalysis | null;
  error: string;
  onFile: (file: File) => void;
  onRemove: () => void;
  onGenerate: () => void;
  onUseDemo: () => void;
  onNewProject: () => void;
  onLoadProject: (project: ProjectSnapshot) => void;
  onRenameProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  };

  return (
    <div className="upload-layout">
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h2>上传产品需求文档</h2>
            <p>当前版本支持文本型 PDF，建议文档包含清晰的模块标题和业务规则。</p>
          </div>
          <span className="version-badge">V0</span>
        </div>

        <div
          className={`dropzone ${dragging ? "is-dragging" : ""} ${file ? "has-file" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const selected = event.target.files?.[0];
              if (selected) onFile(selected);
            }}
            ref={inputRef}
            type="file"
          />

          {file ? (
            <div className="file-row">
              <div className="file-icon">
                <FileText size={24} />
              </div>
              <div className="file-details">
                <strong>{file.name}</strong>
                <span>
                  {(fileSize / 1024 / 1024).toFixed(2)} MB
                  {parsedMeta
                    ? ` · ${parsedMeta.pageCount} 页 · ${parsedMeta.charCount.toLocaleString()} 字符`
                    : isWorking ? " · 正在解析" : " · 等待解析"}
                </span>
              </div>
              <button className="icon-button subtle" onClick={onRemove} title="移除文件" type="button">
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <div className="upload-icon">
                <Upload size={28} />
              </div>
              <h3>拖拽 PDF 到这里，或选择文件</h3>
              <p>仅支持 PDF，单个文件建议不超过 20 MB</p>
              <button className="secondary-button" onClick={() => inputRef.current?.click()} type="button">
                <FileSearch size={16} />
                选择 PDF
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="alert error-alert">
            <AlertTriangle size={17} />
            <span>{error}</span>
          </div>
        )}

        {file && parsedMeta && analysis && (
          <div className="parse-result">
            <div className="parse-result-header">
              <div className="parse-success">
                <span><Check size={15} /></span>
                <div>
                  <strong>PDF 解析完成</strong>
                  <small>已提取 {parsedMeta.charCount.toLocaleString()} 个字符，可以进入模块识别</small>
                </div>
              </div>
              <div className={`quality-score ${analysis.score < 60 ? "is-low" : ""}`}>
                <Gauge size={16} />
                <span>需求完整度</span>
                <strong>{analysis.score}</strong>
              </div>
            </div>

            <div className="preview-block">
              <div className="preview-label">
                <span><FileSearch size={15} />文本提取预览</span>
                <button onClick={() => setPreviewExpanded((value) => !value)} type="button">
                  {previewExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {previewExpanded ? "收起" : "展开"}
                </button>
              </div>
              <p className={previewExpanded ? "is-expanded" : ""}>
                {analysis.preview}{analysis.preview.length < parsedMeta.charCount ? "..." : ""}
              </p>
            </div>

            <div className="quality-grid">
              {analysis.checks.map((check) => (
                <div className={`quality-item ${check.passed ? "is-passed" : "is-warning"}`} key={check.label}>
                  {check.passed ? <Check size={14} /> : <AlertTriangle size={14} />}
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="stage-actions">
          <button className="ghost-button" onClick={onUseDemo} type="button">
            <Sparkles size={16} />
            使用示例 PRD
          </button>
          <button
            className="primary-button"
            disabled={!file || !parsedMeta || isWorking}
            onClick={onGenerate}
            type="button"
          >
            {isWorking ? <LoaderCircle className="spin" size={17} /> : <ArrowRight size={17} />}
            解析需求模块
          </button>
        </div>
      </section>

      <aside className="info-panel">
        <div className="project-card">
          <div className="project-card-title">
            <FolderOpen size={16} />
            <span>项目</span>
          </div>
          <input
            aria-label="项目名称"
            onChange={(event) => onRenameProject(event.target.value)}
            value={currentProject.name}
          />
          <button className="secondary-button compact" onClick={onNewProject} type="button">
            <Plus size={15} />
            新建项目
          </button>
        </div>
        <div className="info-divider" />
        <div className="history-list">
          <h3><History size={16} />历史记录</h3>
          {projects.length ? projects.slice(0, 6).map((project) => (
            <button
              className={`history-item ${project.id === currentProject.id ? "is-active" : ""}`}
              key={project.id}
              onClick={() => onLoadProject(project)}
              type="button"
            >
              <strong>{project.name}</strong>
              <span>
                {project.fileName || "未上传 PRD"} · {project.cases.length} 条用例
              </span>
              <small>{new Date(project.updatedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</small>
            </button>
          )) : <p className="muted-copy">暂无历史项目。</p>}
          {projects.length > 1 && (
            <button
              className="danger-text history-delete"
              onClick={() => onDeleteProject(currentProject.id)}
              type="button"
            >
              <Trash2 size={14} />
              删除当前项目
            </button>
          )}
        </div>
        <div className="info-divider" />
        <h3><ListChecks size={16} />解析质量建议</h3>
        <ul className="check-list">
          <li><Check size={15} /> 使用可复制文字的 PDF</li>
          <li><Check size={15} /> 标题层级和章节清晰</li>
          <li><Check size={15} /> 包含业务规则与异常说明</li>
          <li><Check size={15} /> 标明角色、状态和字段限制</li>
        </ul>
        <div className="info-divider" />
        <p className="muted-copy">
          扫描件 OCR、Word 和在线文档将在后续版本支持。
        </p>
      </aside>
    </div>
  );
}

function ModuleStage({
  modules,
  onChange,
  onBack,
  onContinue,
  onRegenerate,
}: {
  modules: RequirementModule[];
  onChange: (modules: RequirementModule[]) => void;
  onBack: () => void;
  onContinue: () => void;
  onRegenerate: (id: string) => void;
}) {
  const cleanModules = modules.map(sanitizeModule);
  const updateModule = (id: string, patch: Partial<RequirementModule>) =>
    onChange(cleanModules.map((module) => (
      module.id === id ? sanitizeModule({ ...module, ...patch }) : module
    )));

  useEffect(() => {
    if (JSON.stringify(modules) !== JSON.stringify(cleanModules)) {
      onChange(cleanModules);
    }
  }, [modules, onChange]);

  return (
    <section className="content-section wide-section">
      <div className="section-heading">
        <div>
          <h2>确认需求模块</h2>
          <p>AI 已提取模块、核心规则和风险点。关闭不需要生成用例的模块。</p>
        </div>
        <span className="count-badge">{cleanModules.filter((item) => item.enabled).length} 个已启用</span>
      </div>

      <div className="module-list">
        {cleanModules.map((module) => (
          <article className={`module-row ${module.enabled ? "" : "is-disabled"}`} key={module.id}>
            <label className="check-control">
              <input
                checked={module.enabled}
                onChange={(event) => updateModule(module.id, { enabled: event.target.checked })}
                type="checkbox"
              />
              <span />
            </label>
            <div className="module-main">
              <input
                className="module-title-input"
                onChange={(event) => updateModule(module.id, { name: event.target.value })}
                value={module.name}
              />
              <textarea
                className="module-summary-input"
                onChange={(event) => updateModule(module.id, { summary: event.target.value })}
                rows={2}
                value={module.summary}
              />
              <label className="rules-editor">
                <span>核心规则</span>
                <textarea
                  onChange={(event) => updateModule(module.id, {
                    rules: event.target.value
                      .split("\n")
                      .map((rule) => rule.replace(/^\d+[.、]\s*/, "").trim())
                      .filter(Boolean),
                  })}
                  rows={Math.max(3, module.rules.length)}
                  value={module.rules.map((rule, index) => `${index + 1}. ${rule.replace(/^\d+[.、]\s*/, "")}`).join("\n")}
                />
              </label>
            </div>
            <div className="risk-column">
              <div className="column-heading">
                <span className="column-label">风险提示</span>
                <button className="mini-icon-button" onClick={() => onRegenerate(module.id)} title="重新生成此模块" type="button">
                  <RefreshCcw size={14} />
                </button>
              </div>
              {module.risks.map((risk) => (
                <span className="risk-line" key={risk}>
                  <AlertTriangle size={14} />
                  {risk}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="stage-actions">
        <button className="ghost-button" onClick={onBack} type="button">
          <ArrowLeft size={16} />
          返回上传
        </button>
        <button
          className="primary-button"
          disabled={!cleanModules.some((module) => module.enabled)}
          onClick={onContinue}
          type="button"
        >
          生成测试点
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}

function TestPointStage({
  points,
  onChange,
  onBack,
  onContinue,
  onRegenerateModule,
  onRegeneratePoint,
}: {
  points: TestPoint[];
  onChange: (points: TestPoint[]) => void;
  onBack: () => void;
  onContinue: () => void;
  onRegenerateModule: (moduleName: string) => void;
  onRegeneratePoint: (id: string) => void;
}) {
  const moduleNames = [...new Set(points.map((point) => point.moduleName))];

  const updatePoint = (id: string, patch: Partial<TestPoint>) =>
    onChange(points.map((point) => (point.id === id ? { ...point, ...patch } : point)));

  return (
    <section className="content-section wide-section">
      <div className="section-heading">
        <div>
          <h2>审阅模块测试点</h2>
          <p>默认覆盖正常、异常、边界、权限和数据一致性，可取消低价值测试点。</p>
        </div>
        <span className="count-badge">{points.filter((item) => item.enabled).length} 个测试点</span>
      </div>

      <div className="point-groups">
        {moduleNames.map((moduleName) => (
          <div className="point-group" key={moduleName}>
            <div className="point-group-header">
              <div>
                <Layers3 size={17} />
                <strong>{moduleName}</strong>
              </div>
              <div className="point-group-actions">
                <span>{points.filter((point) => point.moduleName === moduleName && point.enabled).length} 项</span>
                <button className="mini-icon-button" onClick={() => onRegenerateModule(moduleName)} title="重新生成此模块测试点" type="button">
                  <RefreshCcw size={13} />
                </button>
              </div>
            </div>
            {points
              .filter((point) => point.moduleName === moduleName)
              .map((point) => (
                <div className={`point-row ${point.enabled ? "" : "is-disabled"}`} key={point.id}>
                  <label className="check-control">
                    <input
                      checked={point.enabled}
                      onChange={(event) => updatePoint(point.id, { enabled: event.target.checked })}
                      type="checkbox"
                    />
                    <span />
                  </label>
                  <input
                    className="point-title-input"
                    onChange={(event) => updatePoint(point.id, { title: event.target.value })}
                    value={point.title}
                  />
                  <select
                    onChange={(event) =>
                      updatePoint(point.id, { coverageType: event.target.value as CoverageType })
                    }
                    value={point.coverageType}
                  >
                    {coverageOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                  <select
                    onChange={(event) => updatePoint(point.id, { priority: event.target.value as Priority })}
                    value={point.priority}
                  >
                    {priorityOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                  <button className="mini-icon-button" onClick={() => onRegeneratePoint(point.id)} title="重新生成此测试点" type="button">
                    <RefreshCcw size={13} />
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>

      <div className="stage-actions">
        <button className="ghost-button" onClick={onBack} type="button">
          <ArrowLeft size={16} />
          返回模块
        </button>
        <button
          className="primary-button"
          disabled={!points.some((point) => point.enabled)}
          onClick={onContinue}
          type="button"
        >
          生成测试用例
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}

function ExportDialog({
  allCases,
  visibleCases,
  selectedCases,
  onClose,
}: {
  allCases: TestCase[];
  visibleCases: TestCase[];
  selectedCases: TestCase[];
  onClose: () => void;
}) {
  const [range, setRange] = useState<"all" | "filtered" | "selected">(
    selectedCases.length ? "selected" : "all",
  );
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [filename, setFilename] = useState("CaseForge-测试用例");
  const [fields, setFields] = useState<Array<keyof TestCase>>(
    testCaseColumns.map((column) => column.key),
  );

  const exportCases = range === "selected" ? selectedCases : range === "filtered" ? visibleCases : allCases;
  const toggleField = (field: keyof TestCase) => {
    setFields((current) => current.includes(field)
      ? current.filter((item) => item !== field)
      : [...current, field]);
  };

  return (
    <div className="dialog-backdrop" role="presentation">
      <section aria-labelledby="export-title" aria-modal="true" className="export-dialog" role="dialog">
        <div className="dialog-header">
          <div>
            <h2 id="export-title">导出测试用例</h2>
            <p>选择导出范围、字段和文件格式。</p>
          </div>
          <button className="icon-button" onClick={onClose} title="关闭" type="button"><X size={17} /></button>
        </div>

        <label className="dialog-field">
          <span>文件名</span>
          <input onChange={(event) => setFilename(event.target.value)} value={filename} />
        </label>

        <div className="dialog-grid">
          <label className="dialog-field">
            <span>导出范围</span>
            <select onChange={(event) => setRange(event.target.value as typeof range)} value={range}>
              <option value="all">全部用例（{allCases.length}）</option>
              <option value="filtered">当前筛选（{visibleCases.length}）</option>
              <option disabled={!selectedCases.length} value="selected">已选择（{selectedCases.length}）</option>
            </select>
          </label>
          <label className="dialog-field">
            <span>文件格式</span>
            <select onChange={(event) => setFormat(event.target.value as ExportFormat)} value={format}>
              <option value="xlsx">Excel（XLSX）</option>
              <option value="csv">CSV</option>
              <option value="markdown">Markdown</option>
            </select>
          </label>
        </div>

        <div className="export-fields">
          <div className="export-fields-heading">
            <span>导出字段</span>
            <button onClick={() => setFields(testCaseColumns.map((column) => column.key))} type="button">全选</button>
          </div>
          <div className="export-field-grid">
            {testCaseColumns.map((column) => (
              <label key={column.key}>
                <input checked={fields.includes(column.key)} onChange={() => toggleField(column.key)} type="checkbox" />
                <span>{column.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="dialog-actions">
          <span>将导出 {exportCases.length} 条用例、{fields.length} 个字段</span>
          <div>
            <button className="ghost-button" onClick={onClose} type="button">取消</button>
            <button
              className="primary-button"
              disabled={!exportCases.length || !fields.length || !filename.trim()}
              onClick={() => {
                exportTestCases({ cases: exportCases, fields, filename, format });
                onClose();
              }}
              type="button"
            >
              <Download size={16} />导出文件
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CaseStage({
  cases,
  modules: requirementModules,
  points,
  onChange,
  onBack,
  onRegenerate,
}: {
  cases: TestCase[];
  modules: RequirementModule[];
  points: TestPoint[];
  onChange: (cases: TestCase[]) => void;
  onBack: () => void;
  onRegenerate: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("全部模块");
  const [priorityFilter, setPriorityFilter] = useState("全部优先级");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);

  const modules = [...new Set(cases.map((item) => item.module))];
  const visibleCases = useMemo(
    () => cases.filter((item) => {
      const matchesQuery = `${item.id} ${item.module}`.toLowerCase().includes(query.toLowerCase());
      const matchesModule = moduleFilter === "全部模块" || item.module === moduleFilter;
      const matchesPriority = priorityFilter === "全部优先级" || item.priority === priorityFilter;
      return matchesQuery && matchesModule && matchesPriority;
    }),
    [cases, moduleFilter, priorityFilter, query],
  );
  const selectedCases = cases.filter((item) => selectedIds.has(item.id));
  const allVisibleSelected = visibleCases.length > 0 && visibleCases.every((item) => selectedIds.has(item.id));
  const coverage = useMemo(
    () => analyzeCoverage(requirementModules, points, cases, coverageOptions),
    [cases, points, requirementModules],
  );

  const updateCase = (id: string, patch: Partial<TestCase>) => {
    onChange(cases.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    if (patch.id && patch.id !== id && selectedIds.has(id)) {
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(id);
        next.add(patch.id!);
        return next;
      });
    }
  };
  const updateSelected = (patch: Partial<TestCase>) =>
    onChange(cases.map((item) => selectedIds.has(item.id) ? { ...item, ...patch } : item));
  const toggleSelected = (id: string) => setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAllVisible = () => setSelectedIds((current) => {
    const next = new Set(current);
    visibleCases.forEach((item) => allVisibleSelected ? next.delete(item.id) : next.add(item.id));
    return next;
  });

  const addCase = () => {
    const sequence = cases.length + 1;
    onChange([...cases, {
      id: `TC-NEW-${String(sequence).padStart(3, "0")}`,
      module: modules[0] ?? "未分类",
      title: "新增测试用例",
      priority: "P1",
      precondition: "",
      testData: "",
      steps: "",
      expected: "",
      coverageType: "正常流程",
      remark: "",
    }]);
  };

  const removeCases = (ids: Set<string>) => {
    onChange(cases.filter((item) => !ids.has(item.id)));
    setSelectedIds((current) => new Set([...current].filter((id) => !ids.has(id))));
  };

  useEffect(() => {
    const existingIds = new Set(cases.map((item) => item.id));
    setSelectedIds((current) => new Set([...current].filter((id) => existingIds.has(id))));
  }, [cases]);

  const stats = {
    total: cases.length,
    p0: cases.filter((item) => item.priority === "P0").length,
    modules: modules.length,
    dimensions: new Set(cases.map((item) => item.coverageType)).size,
  };

  return (
    <section className="case-workspace">
      <div className="case-summary">
        <div><span>用例总数</span><strong>{stats.total}</strong></div>
        <div><span>P0 用例</span><strong>{stats.p0}</strong></div>
        <div><span>覆盖模块</span><strong>{stats.modules}</strong></div>
        <div><span>覆盖维度</span><strong>{stats.dimensions}</strong></div>
      </div>

      <div className="coverage-panel">
        <div className="coverage-score"><span>综合覆盖率</span><strong>{coverage.score}%</strong></div>
        <div className="coverage-metrics">
          <span>模块覆盖 <strong>{coverage.moduleRate}%</strong></span>
          <span>测试点覆盖 <strong>{coverage.pointRate}%</strong></span>
          <span>维度覆盖 <strong>{coverage.dimensionRate}%</strong></span>
        </div>
        <div className="coverage-gaps">
          {coverage.missingModules.length > 0 && <span>未覆盖模块：{coverage.missingModules.join("、")}</span>}
          {coverage.missingTypes.length > 0 && <span>缺失维度：{coverage.missingTypes.join("、")}</span>}
          {coverage.missingPoints.length > 0 && <span>未覆盖测试点：{coverage.missingPoints.length} 项</span>}
          {!coverage.missingModules.length && !coverage.missingTypes.length && !coverage.missingPoints.length && (
            <span className="is-complete"><Check size={14} />当前启用需求均已有用例覆盖</span>
          )}
        </div>
      </div>

      <div className="case-toolbar">
        <div className="search-field"><Search size={16} /><input onChange={(event) => setQuery(event.target.value)} placeholder="搜索用例 ID 或模块" value={query} /></div>
        <div className="filter-field"><Filter size={15} /><select onChange={(event) => setModuleFilter(event.target.value)} value={moduleFilter}><option>全部模块</option>{modules.map((module) => <option key={module}>{module}</option>)}</select><ChevronDown size={14} /></div>
        <div className="filter-field"><select onChange={(event) => setPriorityFilter(event.target.value)} value={priorityFilter}><option>全部优先级</option>{priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}</select><ChevronDown size={14} /></div>
        <button className="secondary-button compact" onClick={addCase} type="button"><Plus size={16} />新增用例</button>
        <button className="primary-button compact export-trigger" onClick={() => setExportOpen(true)} type="button"><Download size={16} />导出</button>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-toolbar">
          <span><CheckSquare size={15} />已选择 {selectedIds.size} 条</span>
          <button onClick={() => onRegenerate([...selectedIds])} type="button"><RefreshCcw size={14} />重新生成</button>
          <label>优先级<select defaultValue="" onChange={(event) => { if (event.target.value) updateSelected({ priority: event.target.value as Priority }); event.target.value = ""; }}><option value="">批量修改</option>{priorityOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>覆盖类型<select defaultValue="" onChange={(event) => { if (event.target.value) updateSelected({ coverageType: event.target.value as CoverageType }); event.target.value = ""; }}><option value="">批量修改</option>{coverageOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <button className="danger-text" onClick={() => removeCases(selectedIds)} type="button"><Trash2 size={14} />删除</button>
          <button className="bulk-clear" onClick={() => setSelectedIds(new Set())} type="button">取消选择</button>
        </div>
      )}

      <div className="table-shell">
        <table className="case-table expanded-table">
          <thead><tr>
            <th className="selection-column"><button className="select-button" onClick={toggleAllVisible} title="选择当前筛选用例" type="button">{allVisibleSelected ? <CheckSquare size={16} /> : <span />}</button></th>
            <th>用例 ID</th><th>功能模块</th><th>优先级</th><th>覆盖类型</th><th>前置条件</th><th>测试数据</th><th>操作步骤</th><th>预期输出</th><th>备注</th><th aria-label="操作" />
          </tr></thead>
          <tbody>
            {visibleCases.map((item) => (
              <tr className={selectedIds.has(item.id) ? "is-selected" : ""} key={item.id}>
                <td className="selection-column"><button className="select-button" onClick={() => toggleSelected(item.id)} type="button">{selectedIds.has(item.id) ? <CheckSquare size={16} /> : <span />}</button></td>
                <td><input className="cell-input id-input" onChange={(event) => updateCase(item.id, { id: event.target.value })} value={item.id} /></td>
                <td><input className="cell-input module-input" onChange={(event) => updateCase(item.id, { module: event.target.value })} value={item.module} /></td>
                <td><select className={`priority-select ${item.priority.toLowerCase()}`} onChange={(event) => updateCase(item.id, { priority: event.target.value as Priority })} value={item.priority}>{priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}</select></td>
                <td><select className="cell-select" onChange={(event) => updateCase(item.id, { coverageType: event.target.value as CoverageType })} value={item.coverageType}>{coverageOptions.map((option) => <option key={option}>{option}</option>)}</select></td>
                <td><textarea className="cell-textarea" onChange={(event) => updateCase(item.id, { precondition: event.target.value })} rows={5} value={item.precondition} /></td>
                <td><textarea className="cell-textarea" onChange={(event) => updateCase(item.id, { testData: event.target.value })} rows={5} value={item.testData} /></td>
                <td><textarea className="cell-textarea" onChange={(event) => updateCase(item.id, { steps: event.target.value })} rows={5} value={item.steps} /></td>
                <td><textarea className="cell-textarea" onChange={(event) => updateCase(item.id, { expected: event.target.value })} rows={5} value={item.expected} /></td>
                <td><textarea className="cell-textarea" onChange={(event) => updateCase(item.id, { remark: event.target.value })} rows={5} value={item.remark} /></td>
                <td><div className="row-actions"><button className="row-action" onClick={() => onRegenerate([item.id])} title="重新生成用例" type="button"><RefreshCcw size={15} /></button><button className="row-action danger" onClick={() => removeCases(new Set([item.id]))} title="删除用例" type="button"><Trash2 size={15} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleCases.length === 0 && <div className="empty-state"><Search size={24} /><strong>没有匹配的测试用例</strong><span>调整搜索词或筛选条件后重试。</span></div>}
      </div>

      <div className="case-footer"><button className="ghost-button" onClick={onBack} type="button"><ArrowLeft size={16} />返回测试点</button><span>当前显示 {visibleCases.length} / {cases.length} 条，可直接编辑单元格。</span></div>
      {exportOpen && <ExportDialog allCases={cases} onClose={() => setExportOpen(false)} selectedCases={selectedCases} visibleCases={visibleCases} />}
    </section>
  );
}

export default function App() {
  const restoredDraft = useRef(loadDraft()).current;
  const initialProjectsRef = useRef<ProjectSnapshot[] | null>(null);
  if (!initialProjectsRef.current) {
    const existing = loadProjects();
    if (existing.length) {
      initialProjectsRef.current = existing;
    } else {
      const created = createProject("默认项目");
      upsertProject(created);
      initialProjectsRef.current = [created];
    }
  }
  const initialProjects = initialProjectsRef.current;
  const initialProject = initialProjects.find((item) => item.id === loadActiveProjectId()) ?? initialProjects[0];
  const restoredProject = restoredDraft ? null : initialProject;
  const [projects, setProjects] = useState<ProjectSnapshot[]>(initialProjects);
  const [currentProject, setCurrentProject] = useState<ProjectSnapshot>(initialProject);
  const [activeStep, setActiveStep] = useState<WorkspaceStep>(restoredDraft?.activeStep ?? "upload");
  const [highestStepIndex, setHighestStepIndex] = useState(restoredDraft?.highestStepIndex ?? 0);
  const [file, setFile] = useState<File | null>(() => restoredDraft?.fileName
    ? new File([restoredDraft.prdText], restoredDraft.fileName, { type: "application/pdf" })
    : restoredProject?.fileName
      ? new File([restoredProject.prdText], restoredProject.fileName, { type: "application/pdf" })
    : null);
  const [fileSize, setFileSize] = useState(restoredDraft?.fileSize ?? restoredProject?.fileSize ?? 0);
  const [prdText, setPrdText] = useState(restoredDraft?.prdText ?? restoredProject?.prdText ?? "");
  const [parsedMeta, setParsedMeta] = useState<{ pageCount: number; charCount: number } | null>(restoredDraft?.parsedMeta ?? restoredProject?.parsedMeta ?? null);
  const [analysis, setAnalysis] = useState<PrdAnalysis | null>(restoredDraft?.analysis ?? null);
  const [modules, setModules] = useState<RequirementModule[]>((restoredDraft?.modules ?? restoredProject?.modules ?? []).map(sanitizeModule));
  const [points, setPoints] = useState<TestPoint[]>((restoredDraft?.points ?? restoredProject?.points ?? []).map(sanitizeTestPoint));
  const [cases, setCases] = useState<TestCase[]>((restoredDraft?.cases ?? restoredProject?.cases ?? []).map(sanitizeTestCase));
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState("");
  const [aiMode, setAiMode] = useState<AiMode>("checking");
  const [draftSavedAt, setDraftSavedAt] = useState(restoredDraft?.savedAt
    ? new Date(restoredDraft.savedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    : "");

  useEffect(() => {
    getAiStatus()
      .then((status) => setAiMode(status.configured ? "ai" : "local"))
      .catch(() => setAiMode("local"));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!file && !prdText && modules.length === 0 && points.length === 0 && cases.length === 0) {
        clearDraft();
        setDraftSavedAt("");
        return;
      }
      const savedAt = new Date().toISOString();
      saveDraft({
        savedAt,
        activeStep,
        highestStepIndex,
        fileName: file?.name ?? null,
        fileSize,
        prdText,
        parsedMeta,
        analysis,
        modules,
        points,
        cases,
      });
      const nextProject: ProjectSnapshot = {
        ...currentProject,
        updatedAt: savedAt,
        fileName: file?.name ?? currentProject.fileName,
        fileSize,
        prdText,
        parsedMeta,
        modules,
        points,
        cases,
      };
      upsertProject(nextProject);
      saveActiveProjectId(nextProject.id);
      setCurrentProject(nextProject);
      setProjects(loadProjects());
      setDraftSavedAt(new Date(savedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [activeStep, analysis, cases, currentProject.id, currentProject.name, file, fileSize, highestStepIndex, modules, parsedMeta, points, prdText]);

  const goTo = (step: WorkspaceStep) => {
    const index = steps.findIndex((item) => item.id === step);
    if (index <= highestStepIndex) setActiveStep(step);
  };

  const advance = (step: WorkspaceStep) => {
    const index = steps.findIndex((item) => item.id === step);
    setHighestStepIndex((current) => Math.max(current, index));
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadProjectIntoWorkspace = (project: ProjectSnapshot) => {
    saveActiveProjectId(project.id);
    setCurrentProject(project);
    setFile(project.fileName
      ? new File([project.prdText], project.fileName, { type: "application/pdf" })
      : null);
    setFileSize(project.fileSize);
    setPrdText(project.prdText);
    setParsedMeta(project.parsedMeta);
    setAnalysis(project.prdText ? analyzePrd(project.prdText) : null);
    setModules(project.modules.map(sanitizeModule));
    setPoints(project.points.map(sanitizeTestPoint));
    setCases(project.cases.map(sanitizeTestCase));
    const step: WorkspaceStep = project.cases.length ? "cases" : project.points.length ? "points" : project.modules.length ? "modules" : "upload";
    const stepIndex = steps.findIndex((item) => item.id === step);
    setHighestStepIndex(stepIndex);
    setActiveStep(step);
    setError("");
  };

  const handleNewProject = () => {
    const project = createProject(`项目 ${projects.length + 1}`);
    upsertProject(project);
    setProjects(loadProjects());
    loadProjectIntoWorkspace(project);
  };

  const handleRenameProject = (name: string) => {
    const next = { ...currentProject, name: name.trim() || "未命名项目" };
    setCurrentProject(next);
    upsertProject(next);
    setProjects(loadProjects());
  };

  const handleDeleteProject = (id: string) => {
    if (!window.confirm("确定删除当前项目历史吗？")) return;
    deleteProject(id);
    const nextProjects = loadProjects();
    if (nextProjects.length) {
      setProjects(nextProjects);
      loadProjectIntoWorkspace(nextProjects[0]);
      return;
    }
    const project = createProject("默认项目");
    upsertProject(project);
    setProjects([project]);
    loadProjectIntoWorkspace(project);
  };

  const handleFile = async (selected: File) => {
    setError("");
    if (!selected.name.toLowerCase().endsWith(".pdf") && selected.type !== "application/pdf") {
      setError("请上传 PDF 格式的产品需求文档。");
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      setError("文件超过 20 MB，请压缩后重新上传。");
      return;
    }

    setFile(selected);
    setFileSize(selected.size);
    setParsedMeta(null);
    setAnalysis(null);
    setPrdText("");
    setIsWorking(true);
    try {
      const parsed = await parsePdf(selected);
      if (parsed.text.trim().length < 30) {
        setError("PDF 中没有提取到足够的文字，可能是扫描件。V0 暂不支持 OCR。");
        return;
      }
      setPrdText(parsed.text);
      setParsedMeta({ pageCount: parsed.pageCount, charCount: parsed.text.length });
      setAnalysis(analyzePrd(parsed.text));
    } catch {
      setError("PDF 解析失败，请确认文件未加密且包含可复制文字。");
    } finally {
      setIsWorking(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setFileSize(0);
    setPrdText("");
    setParsedMeta(null);
    setAnalysis(null);
    setModules([]);
    setPoints([]);
    setCases([]);
    setActiveStep("upload");
    setHighestStepIndex(0);
    setError("");
  };

  const handleClearDraft = () => {
    if (!window.confirm("确定清空当前草稿吗？此操作不可撤销。")) return;
    clearDraft();
    setFile(null);
    setFileSize(0);
    setPrdText("");
    setParsedMeta(null);
    setAnalysis(null);
    setModules([]);
    setPoints([]);
    setCases([]);
    setActiveStep("upload");
    setHighestStepIndex(0);
    setDraftSavedAt("");
    setError("");
  };

  const handleGenerateModules = async () => {
    if (!prdText) {
      setError("PDF 尚未解析完成，请重新选择文件。");
      return;
    }
    setIsWorking(true);
    try {
      const generated = aiMode === "ai"
        ? await generateModulesWithAi(prdText)
        : generateModules(prdText);
      setModules(generated);
      setPoints([]);
      setCases([]);
    } catch {
      setModules(generateModules(prdText));
      setPoints([]);
      setCases([]);
      setAiMode("fallback");
    } finally {
      setIsWorking(false);
    }
    advance("modules");
  };

  const handleDemo = async () => {
    setIsWorking(true);
    setError("");
    const demoFile = new File([demoPrdText], "AI测试用例生成平台_PRD示例.pdf", {
      type: "application/pdf",
    });
    setFile(demoFile);
    setFileSize(demoFile.size);
    setPrdText(demoPrdText);
    setParsedMeta({ pageCount: 6, charCount: demoPrdText.length });
    setAnalysis(analyzePrd(demoPrdText));
    await wait(450);
    setIsWorking(false);
  };

  const handleGeneratePoints = async () => {
    setIsWorking(true);
    try {
      const generated = aiMode === "ai"
        ? await generateTestPointsWithAi(modules)
        : generateTestPoints(modules);
      setPoints(generated);
      setCases([]);
    } catch {
      setPoints(generateTestPoints(modules));
      setCases([]);
      setAiMode("fallback");
    } finally {
      setIsWorking(false);
    }
    advance("points");
  };

  const handleGenerateCases = async () => {
    setIsWorking(true);
    try {
      const generated = aiMode === "ai"
        ? await generateTestCasesWithAi(points)
        : generateTestCases(points);
      setCases(generated);
    } catch {
      setCases(generateTestCases(points));
      setAiMode("fallback");
    } finally {
      setIsWorking(false);
    }
    advance("cases");
  };

  const handleRegenerateModule = (id: string) => {
    const current = modules.find((item) => item.id === id);
    if (!current) return;
    const next = regenerateModule(current, prdText);
    setModules(modules.map((item) => item.id === id ? next : item));
    setPoints(points.filter((item) => item.moduleId !== id));
    setCases(cases.filter((item) => item.module !== current.name));
  };

  const handleRegenerateModulePoints = (moduleName: string) => {
    const module = modules.find((item) => item.name === moduleName);
    if (!module) return;
    const regenerated = generateTestPoints([module]);
    setPoints([...points.filter((item) => item.moduleId !== module.id), ...regenerated]);
    setCases(cases.filter((item) => item.module !== moduleName));
  };

  const handleRegeneratePoint = (id: string) => {
    const current = points.find((item) => item.id === id);
    const module = modules.find((item) => item.id === current?.moduleId);
    if (!current || !module) return;
    const replacement = generateTestPoints([module]).find(
      (item) => item.coverageType === current.coverageType,
    ) ?? current;
    setPoints(points.map((item) => item.id === id
      ? { ...replacement, id, enabled: current.enabled }
      : item));
    setCases(cases.filter(
      (item) => !(item.module === current.moduleName && item.coverageType === current.coverageType),
    ));
  };

  const handleRegenerateCases = (ids: string[]) => {
    const targets = new Set(ids);
    setCases(cases.map((item) => targets.has(item.id) ? regenerateTestCase(item) : item));
  };

  return (
    <div className="app-shell">
      <StepRail
        activeStep={activeStep}
        currentProject={currentProject}
        onLoadProject={loadProjectIntoWorkspace}
        onNewProject={handleNewProject}
        onSelect={goTo}
        projects={projects}
      />
      <div className="workspace">
        <Header
          activeStep={activeStep}
          aiMode={aiMode}
          draftSavedAt={draftSavedAt}
          isWorking={isWorking}
          onClearDraft={handleClearDraft}
        />
        <main className="main-content">
          {activeStep === "upload" && (
            <UploadStage
              currentProject={currentProject}
              error={error}
              file={file}
              fileSize={fileSize}
              isWorking={isWorking}
              analysis={analysis}
              onDeleteProject={handleDeleteProject}
              onFile={handleFile}
              onGenerate={handleGenerateModules}
              onLoadProject={loadProjectIntoWorkspace}
              onNewProject={handleNewProject}
              onRenameProject={handleRenameProject}
              onRemove={resetUpload}
              onUseDemo={handleDemo}
              parsedMeta={parsedMeta}
              projects={projects}
            />
          )}
          {activeStep === "modules" && (
            <ModuleStage
              modules={modules}
              onBack={() => goTo("upload")}
              onChange={setModules}
              onContinue={handleGeneratePoints}
              onRegenerate={handleRegenerateModule}
            />
          )}
          {activeStep === "points" && (
            <TestPointStage
              onBack={() => goTo("modules")}
              onChange={setPoints}
              onContinue={handleGenerateCases}
              onRegenerateModule={handleRegenerateModulePoints}
              onRegeneratePoint={handleRegeneratePoint}
              points={points}
            />
          )}
          {activeStep === "cases" && (
            <CaseStage
              cases={cases}
              modules={modules}
              onBack={() => goTo("points")}
              onChange={setCases}
              onRegenerate={handleRegenerateCases}
              points={points}
            />
          )}
        </main>
      </div>
    </div>
  );
}
