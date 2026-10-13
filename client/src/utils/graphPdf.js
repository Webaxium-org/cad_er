import jsPDF from "jspdf";
import Plotly from "plotly.js/dist/plotly";

const DISTANCE_BAND_HEIGHT = 16;

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

const drawDistanceBands = (pdf, section, top, lineStart, lineWidth, xRange) => {
  const series = [...(section.series || [])].reverse();
  const offsets = series.flatMap((item) => item.data || [])
    .map((point) => Number(point.x))
    .filter(Number.isFinite);
  if (!series.length || !offsets.length) return top;

  const rangeStart = Number(xRange?.[0]);
  const rangeEnd = Number(xRange?.[1]);
  const minOffset = Number.isFinite(rangeStart) && Number.isFinite(rangeEnd)
    ? rangeStart
    : Math.min(...offsets);
  const span = Number.isFinite(rangeStart) && Number.isFinite(rangeEnd)
    ? rangeEnd - rangeStart
    : Math.max(...offsets) - minOffset;
  series.forEach((item, index) => {
    const y = top + index * DISTANCE_BAND_HEIGHT;
    const color = {
      green: "#008000",
      blue: "#0000ff",
      red: "#ff0000",
    }[item.color?.toLowerCase()] || item.color || "#000000";
    const label = item.name?.includes("Initial")
      ? "Initial Dist"
      : item.name?.includes("Proposed")
        ? "Prop. Dist"
        : item.name?.includes("Final")
          ? "Final Dist"
          : `${item.name} Dist`;

    pdf.setTextColor(color);
    pdf.setDrawColor(color);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(label, lineStart - 6, y + 5, { align: "right" });
    pdf.setLineWidth(0.4);
    pdf.line(lineStart, y + 5, lineStart + lineWidth, y + 5);

    for (const point of item.data || []) {
      const offset = Number(point.x);
      if (!Number.isFinite(offset)) continue;
      const x = lineStart + ((offset - minOffset) / (span || 0.001)) * lineWidth;
      pdf.setFontSize(8);
      pdf.text(offset.toFixed(3), x, y + 14, { angle: 90, align: "left" });
    }
  });

  return top + series.length * DISTANCE_BAND_HEIGHT;
};

export const addGraphPage = (pdf, image, section, scales, imageWidth, imageHeight, title = `CS AT CH ${section.chainage}`, plotArea) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageCenter = pageWidth / 2;
  const margin = 10;
  const hasDistanceBands = section.type === "cs" && section.series?.length;
  const availableWidth = hasDistanceBands ? pageWidth - 47 : pageWidth - margin * 2;
  const graphLeft = hasDistanceBands && plotArea
    ? pageCenter - availableWidth * (plotArea.left + plotArea.width / 2)
    : (pageWidth - availableWidth) / 2;
  const graphHeight = availableWidth * imageHeight / imageWidth;
  const bandHeight = hasDistanceBands ? section.series.length * DISTANCE_BAND_HEIGHT + 5 : 0;
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
  const lineWidth = availableWidth * (plotArea?.width ?? 0.8);
  const bandTop = plotArea
    ? graphY + graphHeight * plotArea.bottom + 10
    : graphY + graphHeight + 5;
  const bandBottom = hasDistanceBands
    ? drawDistanceBands(pdf, section, bandTop, lineStart, lineWidth, plotArea?.xRange)
    : graphY + graphHeight;
  const datumY = bandBottom + 10;
  pdf.setFont("helvetica", "bold");
  pdf.text(`Datum: ${section.datum}`, pageCenter, datumY, { align: "center" });
  pdf.setFont("helvetica", "normal");

  const rows = [[]];
  let rowWidth = 0;
  for (const series of section.series || []) {
    const itemWidth = pdf.getTextWidth(series.name) + 9;
    if (rowWidth && rowWidth + itemWidth > availableWidth) {
      rows.push([]);
      rowWidth = 0;
    }
    rows[rows.length - 1].push({ series, width: itemWidth });
    rowWidth += itemWidth;
  }
  rows.forEach((row, index) => {
    const totalWidth = row.reduce((width, item) => width + item.width, 0);
    let x = pageCenter - totalWidth / 2;
    const y = datumY + 8 + index * 7;
    row.forEach(({ series, width }) => {
      pdf.setFillColor(series.color || "#000000");
      pdf.circle(x + 2, y - 1, 1.4, "F");
      pdf.setTextColor("#1e293b");
      pdf.text(series.name, x + 6, y);
      x += width;
    });
  });
};
