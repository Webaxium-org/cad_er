// All dimensions are millimetres. PDF and SVG use the same drawing commands.
const valid = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
const fmt = (value) => Number(value).toFixed(3);

export function sectionPages(section, scales = {}) {
  const isLs = section.type === "ls";
  const horizontal = Number(scales.horizontal ?? (isLs ? 2400 : 150));
  const vertical = Number(scales.vertical ?? (isLs ? 300 : 150));
  if (!(horizontal > 0 && vertical > 0) || !Number.isFinite(horizontal + vertical)) throw new Error("Enter positive drawing scales.");
  const series = (section.series || []).map((s) => ({ ...s, data: (s.data || [])
    .filter((p) => valid(p.x)).map((p) => ({ x: Number(p.x), y: valid(p.y) ? Number(p.y) : null }))
    .sort((a, b) => a.x - b.x) }));
  const points = series.flatMap((s) => s.data).filter((p) => p.y !== null);
  if (!points.length) throw new Error("No valid levels to draw.");
  const minX = Math.min(...points.map((p) => p.x)), maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y)), maxY = Math.max(...points.map((p) => p.y));
  const datum = Math.floor((minY - 0.2) * 10) / 10;
  const pageWidth = isLs ? 297 : 210, pageHeight = isLs ? 210 : 297;
  const plotLeft = 51, plotRight = pageWidth - 12, plotTop = 30;
  const px = 1000 / horizontal, py = 1000 / vertical;
  const graphHeight = Math.max(18, (maxY - datum) * py + 5);
  const baseline = plotTop + graphHeight;
  const rowHeight = 25, bottom = baseline + (series.length + 1) * rowHeight;
  if (bottom > pageHeight - 16) throw new Error(`Vertical scale 1:${vertical} does not fit this section on the page. Use a larger vertical scale denominator.`);
  const span = (plotRight - plotLeft) / px;
  const pageCount = Math.max(1, Math.ceil((maxX - minX) / span));
  if (pageCount > 200) throw new Error("Horizontal scale would create over 200 pages for one section. Use a larger denominator.");
  return Array.from({ length: pageCount }, (_, pageIndex) => {
    const from = minX + pageIndex * span, to = Math.min(maxX, from + span);
    const commands = [];
    const line = (x1, y1, x2, y2, color = "#888888", width = 0.2) => commands.push({ kind: "line", x1, y1, x2, y2, color, width });
    const text = (value, x, y, { size = 3, color = "#111111", angle = 0, align = "left" } = {}) => commands.push({ kind: "text", value: String(value), x, y, size, color, angle, align });
    const x = (value) => plotLeft + (value - from) * px, y = (value) => baseline - (value - datum) * py;
    const graphRight = Math.max(plotLeft + 1, x(to));
    text(isLs ? "LONGITUDINAL SECTION" : `CROSS SECTION AT CHAINAGE ${section.chainage}`, pageWidth / 2, 15, { size: 4, align: "center" });
    text(`Horizontal 1:${horizontal}   Vertical 1:${vertical}`, pageWidth / 2, 22, { align: "center" });
    text(`Datum: ${fmt(datum)}`, 12, baseline - 3);
    line(plotLeft, plotTop, plotLeft, baseline);
    const tickStep = Math.max(0.1, Math.ceil((8 / py) * 10) / 10);
    for (let level = Math.ceil(datum / tickStep) * tickStep; level <= maxY; level += tickStep) {
      line(plotLeft - 1, y(level), plotLeft + 1, y(level));
      text(Number(level.toFixed(2)), plotLeft - 2, y(level) + 1, { size: 2.5, align: "right" });
    }
    for (const s of series) {
      for (let i = 1; i < s.data.length; i++) {
        const a = s.data[i - 1], b = s.data[i];
        if (a.y === null || b.y === null || b.x < from || a.x > to) continue;
        if (a.x === b.x) { if (a.x >= from && a.x <= to) line(x(a.x), y(a.y), x(b.x), y(b.y), s.color, 0.35); continue; }
        const left = Math.max(a.x, from), right = Math.min(b.x, to);
        const interpolate = (v) => a.y + (b.y - a.y) * (v - a.x) / (b.x - a.x);
        line(x(left), y(interpolate(left)), x(right), y(interpolate(right)), s.color, 0.35);
      }
    }
    const offsets = [...new Set(points.map((p) => p.x).filter((v) => v >= from && v <= to))].sort((a, b) => a - b);
    // Shared label positions; short leaders preserve the true offset for close toes/banks.
    const labelX = offsets.map(x);
    const gap = 3.2;
    for (let i = 1; i < labelX.length; i++) labelX[i] = Math.max(labelX[i], labelX[i - 1] + gap);
    if (labelX.at(-1) > plotRight) {
      labelX[labelX.length - 1] = plotRight;
      for (let i = labelX.length - 2; i >= 0; i--) labelX[i] = Math.min(labelX[i], labelX[i + 1] - gap);
    }
    if (labelX[0] < plotLeft - 1) throw new Error("Too many close offsets for readable labels. Use a smaller horizontal scale denominator to spread the drawing over more pages.");
    const rows = [...series].reverse().map((s) => ({ label: s.name, color: s.color, values: offsets.map((offset) => s.data.filter((p) => p.x === offset && p.y !== null).map((p) => fmt(p.y)).join(" / ")) }));
    rows.push({ label: isLs ? "Chainage" : "Offset", color: "#008000", values: offsets.map(fmt) });
    rows.forEach((row, index) => {
      const top = baseline + index * rowHeight;
      line(12, top, graphRight, top);
      // Long series names wrap in the fixed label column.
      const words = row.label.split(" "); let label = "", labels = [];
      for (const word of words) { if ((label + " " + word).trim().length > 20 && label) { labels.push(label); label = word; } else label = (label + " " + word).trim(); }
      labels.push(label);
      labels.forEach((value, i) => text(value, 14, top + 10 + i * 4));
      row.values.forEach((value, i) => {
        if (!value) return;
        const actual = x(offsets[i]), label = labelX[i];
        line(actual, top, actual, top + 1.5);
        if (Math.abs(label - actual) > 0.1) line(actual, top + 1.5, label, top + 4, "#aaaaaa", 0.15);
        text(value, label + 0.8, top + rowHeight - 2, { angle: 90, color: row.color, size: 2.8 });
      });
    });
    line(12, bottom, graphRight, bottom);
    line(12, baseline, 12, bottom); line(plotLeft, baseline, plotLeft, bottom); line(graphRight, baseline, graphRight, bottom);
    text(`Range ${fmt(from)} to ${fmt(to)}${pageCount > 1 ? `   Sheet ${pageIndex + 1}/${pageCount}` : ""}`, 12, bottom + 7, { size: 2.7 });
    text("Print at 100% / actual size to retain scales", 12, bottom + 12, { size: 2.5 });
    return { width: pageWidth, height: pageHeight, commands };
  });
}
