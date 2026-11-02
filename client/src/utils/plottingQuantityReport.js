import { calculateAreaReport } from "./areaReport.js";
import { calculateVolumeReport } from "./volumeReport.js";

// Keep plotting tables, the abstract and PDF on the same rules as the standalone reports.
export const calculatePlottingQuantityReport = (survey, initialEntry, secondaryEntry, deductions = []) => ({
  ...calculateVolumeReport(survey, initialEntry, secondaryEntry, deductions),
  areaReport: calculateAreaReport(survey, initialEntry, secondaryEntry),
});
