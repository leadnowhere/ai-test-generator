import * as XLSX from "xlsx";
import { TestCase } from "../types/testCase";

export const testCaseColumns: Array<{ key: keyof TestCase; label: string }> = [
  { key: "id", label: "用例ID" },
  { key: "module", label: "功能模块" },
  { key: "priority", label: "优先级" },
  { key: "precondition", label: "前置条件" },
  { key: "testData", label: "测试数据" },
  { key: "steps", label: "操作步骤" },
  { key: "expected", label: "预期输出" },
  { key: "coverageType", label: "覆盖类型" },
  { key: "remark", label: "备注" },
];

export type ExportFormat = "csv" | "xlsx" | "markdown";

export interface ExportOptions {
  cases: TestCase[];
  fields: Array<keyof TestCase>;
  filename: string;
  format: ExportFormat;
}

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const selectedColumns = (fields: Array<keyof TestCase>) =>
  testCaseColumns.filter((column) => fields.includes(column.key));

const safeFilename = (filename: string) =>
  filename.trim().replace(/[\\/:*?"<>|]/g, "-") || "测试用例";

export function exportTestCases({ cases, fields, filename, format }: ExportOptions) {
  const columns = selectedColumns(fields);
  const baseName = safeFilename(filename);
  const escapeCsv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

  if (format === "csv") {
    const header = columns.map((column) => escapeCsv(column.label)).join(",");
    const body = cases.map((item) => columns.map((column) => escapeCsv(item[column.key])).join(",")).join("\n");
    downloadBlob(`\uFEFF${header}\n${body}`, `${baseName}.csv`, "text/csv;charset=utf-8");
    return;
  }

  if (format === "xlsx") {
    const rows = cases.map((item) =>
      Object.fromEntries(columns.map((column) => [column.label, item[column.key]])),
    );
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = columns.map((column) => ({
      wch: ["precondition", "testData", "steps", "expected", "remark"].includes(column.key) ? 36 : 18,
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "测试用例");
    XLSX.writeFile(workbook, `${baseName}.xlsx`);
    return;
  }

  const clean = (value: unknown) => String(value ?? "").replaceAll("|", "\\|").replace(/\n/g, "<br>");
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = cases.map((item) => `| ${columns.map((column) => clean(item[column.key])).join(" | ")} |`);
  downloadBlob(
    `# 测试用例\n\n${[header, divider, ...body].join("\n")}\n`,
    `${baseName}.md`,
    "text/markdown;charset=utf-8",
  );
}
