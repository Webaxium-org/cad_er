// Resolve only from the survey fetched for this report. Never accept raw ranges
// from route state or unscoped local storage as another survey's deductions.
export const reportDeductions = (survey, deductionId) => deductionId
  ? survey?.deductions?.find((entry) => String(entry._id) === String(deductionId))?.rows || []
  : [];
