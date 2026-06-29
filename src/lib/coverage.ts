import { CoverageType, RequirementModule, TestCase, TestPoint } from "../types/testCase";

export interface CoverageReport {
  score: number;
  moduleRate: number;
  pointRate: number;
  dimensionRate: number;
  missingModules: string[];
  missingPoints: string[];
  missingTypes: CoverageType[];
}

export function analyzeCoverage(
  modules: RequirementModule[],
  points: TestPoint[],
  cases: TestCase[],
  expectedTypes: CoverageType[],
): CoverageReport {
  const enabledModules = modules.filter((item) => item.enabled);
  const enabledPoints = points.filter((item) => item.enabled);
  const caseModules = new Set(cases.map((item) => item.module));
  const caseDimensions = new Set(cases.map((item) => item.coverageType));

  const missingModules = enabledModules
    .filter((item) => !caseModules.has(item.name))
    .map((item) => item.name);
  const missingPoints = enabledPoints
    .filter((point) => !cases.some(
      (item) => item.module === point.moduleName && item.coverageType === point.coverageType,
    ))
    .map((item) => item.title);
  const missingTypes = expectedTypes.filter((item) => !caseDimensions.has(item));

  const ratio = (covered: number, total: number) => total === 0 ? 0 : Math.round((covered / total) * 100);
  const moduleRate = ratio(enabledModules.length - missingModules.length, enabledModules.length);
  const pointRate = ratio(enabledPoints.length - missingPoints.length, enabledPoints.length);
  const dimensionRate = ratio(expectedTypes.length - missingTypes.length, expectedTypes.length);

  return {
    score: Math.round(moduleRate * 0.4 + pointRate * 0.4 + dimensionRate * 0.2),
    moduleRate,
    pointRate,
    dimensionRate,
    missingModules,
    missingPoints,
    missingTypes,
  };
}
