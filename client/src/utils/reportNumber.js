export const formatReportNumber = value => {
  if (value == null || value === "") return "-";
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(3) : "-";
};
