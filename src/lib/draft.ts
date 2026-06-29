import { PrdAnalysis } from "./prdQuality";
import {
  ProjectSnapshot,
  RequirementModule,
  TestCase,
  TestPoint,
  WorkspaceStep,
} from "../types/testCase";

const DRAFT_KEY = "caseforge.workspace.v1";
const PROJECTS_KEY = "caseforge.projects.v1";
const ACTIVE_PROJECT_KEY = "caseforge.activeProject.v1";

export interface WorkspaceDraft {
  savedAt: string;
  activeStep: WorkspaceStep;
  highestStepIndex: number;
  fileName: string | null;
  fileSize: number;
  prdText: string;
  parsedMeta: { pageCount: number; charCount: number } | null;
  analysis: PrdAnalysis | null;
  modules: RequirementModule[];
  points: TestPoint[];
  cases: TestCase[];
}

export function loadDraft(): WorkspaceDraft | null {
  try {
    const value = window.localStorage.getItem(DRAFT_KEY);
    return value ? JSON.parse(value) as WorkspaceDraft : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: WorkspaceDraft) {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft() {
  window.localStorage.removeItem(DRAFT_KEY);
}

export function loadProjects(): ProjectSnapshot[] {
  try {
    const value = window.localStorage.getItem(PROJECTS_KEY);
    const projects = value ? JSON.parse(value) as ProjectSnapshot[] : [];
    return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export function saveProjects(projects: ProjectSnapshot[]) {
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function loadActiveProjectId() {
  return window.localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function saveActiveProjectId(id: string) {
  window.localStorage.setItem(ACTIVE_PROJECT_KEY, id);
}

export function createProject(name = "未命名项目"): ProjectSnapshot {
  return {
    id: `project-${Date.now()}`,
    name,
    updatedAt: new Date().toISOString(),
    fileName: null,
    fileSize: 0,
    prdText: "",
    parsedMeta: null,
    modules: [],
    points: [],
    cases: [],
  };
}

export function upsertProject(project: ProjectSnapshot) {
  const projects = loadProjects();
  const next = [
    { ...project, updatedAt: new Date().toISOString() },
    ...projects.filter((item) => item.id !== project.id),
  ];
  saveProjects(next.slice(0, 30));
}

export function deleteProject(id: string) {
  saveProjects(loadProjects().filter((item) => item.id !== id));
  if (loadActiveProjectId() === id) window.localStorage.removeItem(ACTIVE_PROJECT_KEY);
}
