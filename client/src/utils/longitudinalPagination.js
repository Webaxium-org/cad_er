export const splitLongitudinalRanges = (section, pageLength, maxLabels = 35) => {
  const length = Number(pageLength);
  if (!Number.isFinite(length) || length <= 0) {
    throw new Error("Enter a PDF page length greater than zero.");
  }
  const chainages = [...new Set((section.series || [])
    .flatMap((series) => series.data || [])
    .map((point) => Number(point.x))
    .filter(Number.isFinite))].sort((a, b) => a - b);
  if (!chainages.length) throw new Error("No chainages are available to export.");

  const last = chainages[chainages.length - 1];
  const ranges = [];
  let start = chainages[0];
  if (start === last) return [{ start, end: last, range: [start, start + length] }];
  while (start < last) {
    if (ranges.length >= 200) throw new Error("This export would exceed 200 pages. Increase the PDF page length.");
    let end = Math.min(start + length, last);
    const visible = chainages.filter((value) => value >= start && value <= end);
    const dense = visible.length > maxLabels;
    if (dense) end = visible[maxLabels - 1];
    if (!(end > start)) throw new Error("The PDF page length is too small for these chainages.");
    // Leave unused space on the last sheet instead of stretching the short tail.
    ranges.push({ start, end, range: [start, dense ? end : start + length] });
    // A shared boundary keeps the profile continuous across sheets.
    start = end;
  }
  return ranges;
};
