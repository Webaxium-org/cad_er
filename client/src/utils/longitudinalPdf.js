import Plotly from "plotly.js/dist/plotly";
import { addGraphPage, capturePlotImage, createGraphPdf } from "./graphPdf";
import { splitLongitudinalRanges } from "./longitudinalPagination";

export const createLongitudinalPdf = async (section, scales, chartOptions, pageLength, onProgress) => {
  const ranges = splitLongitudinalRanges(section, pageLength);
  if (!ranges.length) throw new Error("No chainages are available to export.");
  const pdf = createGraphPdf();
  const plotNode = document.createElement("div");
  const width = 1000;
  const height = 300;
  Object.assign(plotNode.style, {
    position: "fixed", left: "-10000px", top: "0",
    width: `${width}px`, height: `${height}px`, background: "white",
  });
  document.body.appendChild(plotNode);
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
  const halfSpan = (baseRange[1] - baseRange[0]) * Number(scales.vertical) / 300 / 2;
  try {
    for (const [index, page] of ranges.entries()) {
      onProgress?.({ percent: Math.round(index / ranges.length * 100), message: `Rendering page ${index + 1} of ${ranges.length}` });
      await Plotly.react(plotNode, traces, {
        ...chartOptions.layout,
        title: undefined, width, height, autosize: false, showlegend: false,
        transition: { duration: 0 },
        xaxis: { ...chartOptions.layout.xaxis, autorange: false, range: page.range, dtick: undefined, nticks: 8 },
        yaxis: { ...chartOptions.layout.yaxis, autorange: false, range: [center - halfSpan, center + halfSpan] },
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
