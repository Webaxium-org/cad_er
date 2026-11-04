export function slopeRatioToGrade(value) {
  const match = String(value).trim().match(/^(\d+(?:\.\d+)?|\.\d+)\s*:\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))$/);
  if (!match || Number(match[1]) <= 0) return NaN;
  const grade = 100 * (Number(match[2]) / Number(match[1]));
  return Number.isFinite(grade) ? grade : NaN;
}

export function gradeToSlopeRatio(grade) {
  if (grade == null || String(grade).trim() === "" || !Number.isFinite(Number(grade))) return "";
  return Number(grade) === 0 ? "1:0" : `100:${Number(grade)}`;
}
