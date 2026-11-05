import Plotly from "plotly.js/dist/plotly";
import { addGraphPage, capturePlotImage, createGraphPdf } from "./graphPdf";
import { splitLongitudinalRanges } from "./longitudinalPagination";
import { graphSpanAtScale } from "./graphScale";

export const fittedLongitudinalScales = (section, chartOptions) => {
  const pages = splitLongitudinalRanges(section, "auto");
  const imageWidthMm = createGraphPdf().internal.pageSize.getWidth() - 47;
  const yRange = chartOptions.layout.yaxis.range.map(Number);
  const xSpan = Math.max(...pages.map(page => page.range[1] - page.range[0]));
  return {
    horizontal: Math.ceil(xSpan * 1000 / (imageWidthMm * 0.9) * 1000) / 1000,
    vertical: Math.ceil((yRange[1] - yRange[0]) * 1000 / (imageWidthMm * 0.22) * 1000) / 1000,
  };
};

export const createLongitudinalPdf = async (section, scales, chartOptions, pageLength, onProgress) => {
  const horizontal = Number(scales.horizontal), vertical = Number(scales.vertical);
  if (!(horizontal > 0) || !(vertical > 0) || !Number.isFinite(horizontal) || !Number.isFinite(vertical)) throw new Error("Enter positive horizontal and vertical print scales.");
  const pdf = createGraphPdf();
  const plotNode = document.createElement("div");
  const width = 1000;
  const height = 300;
  Object.assign(plotNode.style, {
    position: "fixed", left: "-10000px", top: "0",
    width: `${width}px`, height: `${height}px`, background: "white",
  });
  const traces = section.series.map((series) => {
    const points = [...(series.data || [])].sort((a, b) => Number(a.x) - Number(b.x));
    return {
      x: points.map((point) => Number(point.x)),
      y: points.map((point) => point.y == null ? null : Number(point.y)),
      type: "scatter", mode: "lines", connectgaps: false,
      name: series.name, line: { shape: "linear", width: 1, color: series.color },
    };
  });
  const baseRange = chartOptions.layout.yaxis.range.map(Number);
  const center = (baseRange[0] + baseRange[1]) / 2;
  // Match addGraphPage's A4 width and use fixed plot margins so metres per
  // printed millimetre come directly from the selected scale denominators.
  const margin = { l: 80, r: 20, t: 30, b: 50, pad: 0, autoexpand: false };
  const imageWidthMm = pdf.internal.pageSize.getWidth() - 47;
  const horizontalSpan = graphSpanAtScale(imageWidthMm * (width - margin.l - margin.r) / width, horizontal);
  const halfSpan = graphSpanAtScale(imageWidthMm * (height - margin.t - margin.b) / width, vertical) / 2;
  const ranges = splitLongitudinalRanges(section, pageLength === "auto" ? horizontalSpan : Math.min(Number(pageLength), horizontalSpan), Number.MAX_SAFE_INTEGER);
  if (!ranges.length) throw new Error("No chainages are available to export.");
  document.body.appendChild(plotNode);
  try {
    for (const [index, page] of ranges.entries()) {
      onProgress?.({ percent: Math.round(index / ranges.length * 100), message: `Rendering page ${index + 1} of ${ranges.length}` });
      await Plotly.react(plotNode, traces, {
        ...chartOptions.layout,
        title: undefined, width, height, margin, autosize: false, showlegend: false,
        transition: { duration: 0 },
        xaxis: { ...chartOptions.layout.xaxis, automargin: false, domain: [0, 1], scaleanchor: false, autorange: false, range: [page.start, page.start + horizontalSpan], dtick: undefined, nticks: 8 },
        yaxis: { ...chartOptions.layout.yaxis, automargin: false, domain: [0, 1], scaleanchor: false, autorange: false, range: [center - halfSpan, center + halfSpan] },
      }, { staticPlot: true, displayModeBar: false });
      const capture = await capturePlotImage(plotNode);
      if (index) pdf.addPage();
      addGraphPage(pdf, capture.image, section, scales, width, height, "LONGITUDINAL SECTION", capture.plotArea);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor("#1e293b");
      pdf.text(`Chainage ${page.start.toFixed(3)} - ${page.end.toFixed(3)}  |  Page ${index + 1} of ${ranges.length}`,
        pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 12, { align: "center" });
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return pdf;
  } finally {
    Plotly.purge(plotNode);
    plotNode.remove();
  }
};
