import jsPDF from "jspdf";
import Plotly from "plotly.js/dist/plotly";

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
  return { image, width: bounds.width, height: bounds.height };
};

export const addGraphPage = (pdf, image, section, scales, imageWidth, imageHeight, title = `CS AT CH ${section.chainage}`) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageCenter = pageWidth / 2;
  const margin = 10;
  const availableWidth = pageWidth - margin * 2;
  const graphHeight = availableWidth * imageHeight / imageWidth;
  const graphY = (pageHeight - graphHeight) / 2;

  pdf.setTextColor("#1e293b");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(title, pageCenter, graphY - 14, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Horizontal scale 1:${scales.horizontal}    Vertical scale 1:${scales.vertical}`, pageCenter, graphY - 8, { align: "center" });
  pdf.addImage(image, "JPEG", margin, graphY, availableWidth, graphHeight, undefined, "MEDIUM");

  const datumY = graphY + graphHeight + 10;
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
