export const autoSplitLongitudinalRanges = (section, { plotWidth = 600, labelSpacing = 16, maxLabels = 35 } = {}) => {
  if (!(plotWidth > 0) || !(labelSpacing > 0) || !Number.isInteger(maxLabels) || maxLabels < 2) {
    throw new Error("Invalid longitudinal page dimensions.");
  }
  const chainages = [...new Set((section.series || []).flatMap((series) => series.data || [])
    .filter((point) => point.x !== null && point.x !== undefined && point.x !== "")
    .map((point) => Number(point.x)).filter(Number.isFinite))].sort((a, b) => a - b);
  if (!chainages.length) return [];
  if (chainages.length === 1) return [{ start: chainages[0], end: chainages[0], range: [chainages[0], chainages[0] + 1] }];
  const ranges = [];
  let startIndex = 0;
  while (startIndex < chainages.length - 1) {
    let endIndex = startIndex + 1;
    let closestGap = chainages[endIndex] - chainages[startIndex];
    for (let index = endIndex + 1; index < chainages.length; index++) {
      const gap = Math.min(closestGap, chainages[index] - chainages[index - 1]);
      const span = chainages[index] - chainages[startIndex];
      // Count alone misses clusters such as 260, 262, 273 on a long profile.
      if (index - startIndex + 1 > maxLabels || gap / span * plotWidth < labelSpacing) break;
      closestGap = gap;
      endIndex = index;
    }
    const start = chainages[startIndex];
    const end = chainages[endIndex];
    ranges.push({ start, end, range: [start, end] });
    startIndex = endIndex;
  }
  return ranges;
};

export const splitLongitudinalSections = (section, options) => autoSplitLongitudinalRanges(section, options).map((page) => {
  const series = section.series.map((entry) => ({
    ...entry,
    data: (entry.data || []).filter((point) => point.x !== null && point.x !== undefined && point.x !== "" && Number(point.x) >= page.start && Number(point.x) <= page.end),
  }));
  return { ...page, section: { ...section, series,
    chainages: section.chainages?.filter((value) => value >= page.start && value <= page.end),
    allRl: series.flatMap((entry) => entry.data.map((point) => point.y).filter((value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))).map(Number)),
  } };
});

export const splitLongitudinalRanges = (section, pageLength = "auto", maxLabels = 35) => {
  if (pageLength === "auto") return autoSplitLongitudinalRanges(section, { maxLabels });
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
