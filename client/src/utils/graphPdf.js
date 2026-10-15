import jsPDF from "jspdf";
import Plotly from "plotly.js/dist/plotly";

const DISTANCE_LABEL_SPACING = 3.5;

export const createGraphPdf = () => new jsPDF({
  orientation: "portrait",
  unit: "mm",
  format: "a4",
  compress: true,
});

export const capturePlotImage = async (plot) => {
  if (!plot) throw new Error("The graph is not ready yet.");
  const bounds = plot.getBoundingClientRect();
  if (!bounds.width || !bounds.height) throw new Error("The graph has no visible size.");
  const image = await Plotly.toImage(plot, {
    format: "jpeg",
    width: Math.round(bounds.width),
    height: Math.round(bounds.height),
    scale: 2,
  });
  const plotSize = plot._fullLayout?._size;
  const plotArea = plotSize && {
    left: plotSize.l / bounds.width,
    width: plotSize.w / bounds.width,
    bottom: (plotSize.t + plotSize.h) / bounds.height,
    xRange: plot._fullLayout?.xaxis?.range,
  };
  return { image, width: bounds.width, height: bounds.height, plotArea };
};

const layoutLevelBands = (pdf, section, lineWidth, xRange) => {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  const series = [...(section.series || [])].reverse();
  const offsets = series.flatMap((item) => item.data || [])
    .map((point) => Number(point.x))
    .filter(Number.isFinite);
  if (!series.length || !offsets.length) return [];

  // Include every distinct horizontal position across the displayed profiles.
  // Reuse the level-band layout so positions share alignment and label spacing.
  series.push({
    name: section.type === "ls" ? "Chainage" : "Offset",
    color: "#000000",
    data: [...new Set(offsets)].map((offset) => ({ x: offset, y: offset })),
  });

  const rangeStart = Number(xRange?.[0]);
  const rangeEnd = Number(xRange?.[1]);
  const minOffset = Number.isFinite(rangeStart) && Number.isFinite(rangeEnd)
    ? rangeStart
    : Math.min(...offsets);
  const span = Number.isFinite(rangeStart) && Number.isFinite(rangeEnd)
    ? rangeEnd - rangeStart
    : Math.max(...offsets) - minOffset;
  return series.map((item) => {
    const levelsByOffset = new Map();
    for (const point of item.data || []) {
      const offset = Number(point.x);
      const level = point.y === null || point.y === undefined || point.y === ""
        ? NaN : Number(point.y);
      if (!Number.isFinite(offset) || !Number.isFinite(level)) continue;
      const levels = levelsByOffset.get(offset) || [];
      const formattedLevel = level.toFixed(3);
      if (!levels.includes(formattedLevel)) levels.push(formattedLevel);
      levelsByOffset.set(offset, levels);
    }
    const points = [...levelsByOffset.entries()]
      .sort(([left], [right]) => left - right)
      .map(([offset, levels]) => ({
        offset,
        value: levels.join(" / "),
        x: ((offset - minOffset) / (span || 0.001)) * lineWidth,
        textWidth: pdf.getTextWidth(levels.join(" / ")),
      }))
      .filter(({ x }) => x >= 0 && x <= lineWidth)
      .sort((a, b) => a.x - b.x);

    // Merge colliding groups until every adjacent label has enough clearance.
    // Regressing x - index * spacing keeps displacement small and order intact.
    const groups = [];
    points.forEach((point, index) => {
      groups.push({ start: index, count: 1, total: point.x - index * DISTANCE_LABEL_SPACING });
      while (groups.length > 1) {
        const right = groups[groups.length - 1];
        const left = groups[groups.length - 2];
        if (left.total / left.count <= right.total / right.count) break;
        left.count += right.count;
        left.total += right.total;
        groups.pop();
      }
    });
    const maxStart = Math.max(0, lineWidth - (points.length - 1) * DISTANCE_LABEL_SPACING);
    groups.forEach(({ start, count, total }) => {
      const position = Math.max(0, Math.min(maxStart, total / count));
      for (let index = start; index < start + count; index++) {
        points[index].labelX = position + index * DISTANCE_LABEL_SPACING;
      }
    });
    const labelHeight = Math.max(0, ...points.map(({ textWidth }) => textWidth));
    return { item, points, height: 13 + labelHeight };
  });
};

const drawLevelBands = (pdf, bands, top, lineStart, lineWidth) => {
  let y = top;
  bands.forEach(({ item, points, height }) => {
    const color = {
      green: "#008000",
      blue: "#0000ff",
      red: "#ff0000",
    }[item.color?.toLowerCase()] || item.color || "#000000";
    const label = item.name?.includes("Initial")
      ? "Initial Level"
      : item.name?.includes("Proposed")
        ? "Prop. Level"
        : item.name?.includes("Final")
          ? "Final Level"
          : item.name;

    pdf.setTextColor(color);
    pdf.setDrawColor(color);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(label, lineStart - 6, y + 5, { align: "right" });
    pdf.setLineWidth(0.4);
    pdf.line(lineStart, y + 5, lineStart + lineWidth, y + 5);

    for (const { value, labelX, textWidth } of points) {
      pdf.setFontSize(8);
      // Rotated text extends upward: measure its length so every label starts
      // at y + 9, below the band line.
      pdf.text(value, lineStart + labelX + 0.9, y + 9 + textWidth, { angle: 90, align: "left" });
    }
    y += height;
  });

  return y;
};

export const addGraphPage = (pdf, image, section, scales, imageWidth, imageHeight, title = `CS AT CH ${section.chainage}`, plotArea) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageCenter = pageWidth / 2;
  const margin = 10;
  const hasLevelBands = (section.type === "cs" || section.type === "ls") && section.series?.length;
  const availableWidth = hasLevelBands ? pageWidth - 47 : pageWidth - margin * 2;
  const graphLeft = hasLevelBands && plotArea
    ? pageCenter - availableWidth * (plotArea.left + plotArea.width / 2)
    : (pageWidth - availableWidth) / 2;
  const graphHeight = availableWidth * imageHeight / imageWidth;
  const lineWidth = availableWidth * (plotArea?.width ?? 0.8);
  const bands = hasLevelBands ? layoutLevelBands(pdf, section, lineWidth, plotArea?.xRange) : [];
  const bandHeight = bands.reduce((height, band) => height + band.height, 0) + (hasLevelBands ? 5 : 0);
  const graphY = (pageHeight - graphHeight - bandHeight) / 2;

  pdf.setTextColor("#1e293b");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(title, pageCenter, graphY - 14, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Horizontal scale 1:${scales.horizontal}    Vertical scale 1:${scales.vertical}`, pageCenter, graphY - 8, { align: "center" });
  pdf.addImage(image, "JPEG", graphLeft, graphY, availableWidth, graphHeight, undefined, "MEDIUM");

  const lineStart = graphLeft + availableWidth * (plotArea?.left ?? 0.16);
  const bandTop = plotArea
    ? graphY + graphHeight * plotArea.bottom + 10
    : graphY + graphHeight + 5;
  if (hasLevelBands) drawLevelBands(pdf, bands, bandTop, lineStart, lineWidth);
};
