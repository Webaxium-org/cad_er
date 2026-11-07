export function slopeRatioToGrade(value) {
  const match = String(value).trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*:\s*(\d+(?:\.\d+)?|\.\d+)$/);
  if (!match || Number(match[2]) <= 0) return NaN;
  const grade = 100 * (Number(match[1]) / Number(match[2]));
  return Number.isFinite(grade) ? grade : NaN;
}

export function gradeToSlopeRatio(grade) {
  if (grade == null || String(grade).trim() === "" || !Number.isFinite(Number(grade))) return "";
  return Number(grade) === 0 ? "0:1" : `${Number(grade)}:100`;
}

// Existing CS/API ratios remain H:V. Reverse at the UI boundary so saved
// designs keep their geometry while users read and enter V:H.
export function reverseSlopeRatio(value) {
  const parts = String(value ?? "").split(/([:/∶])/);
  return parts.length === 3 ? `${parts[2]}${parts[1]}${parts[0]}` : String(value ?? "");
}
