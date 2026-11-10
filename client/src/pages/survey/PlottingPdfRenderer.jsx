import { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import CrossSectionChart from "./components/CrossSectionChart";
import CrossSectionChartV2 from "./components/CrossSectionChartV2";
import { withSectionBandLabelMargin } from "../../utils/sectionLevelBands";
import { exportPlottingPdf } from "../../utils/plottingPdf";

// This page has no API credentials. The server injects one authorized, frozen report.
export default function PlottingPdfRenderer() {
  const started = useRef(false);
  const [chartIndex, setChartIndex] = useState(null);
  const snapshot = window.__PDF_EXPORT_SNAPSHOT__;
  useEffect(() => {
    if (!snapshot || started.current) return;
    started.current = true;
    const run = async () => {
      try {
        await window.pdfExportProgress({ percent: 0, message: "Preparing report charts...", estimatedTimeLeft: null });
        await document.fonts.ready;
        const expected = snapshot.lsPages.length + snapshot.allCs.length;
        const getChart = async (index) => {
          // Mount only the page being captured. The keyed subtree purges the
          // previous Plotly graph instead of retaining the entire survey in RAM.
          setChartIndex(index);
          const deadline = Date.now() + 60000;
          while (Date.now() < deadline) {
            const item = document.querySelector(`[data-export-chart="${index}"]`);
            const chart = item?.querySelector(".js-plotly-plot");
            if (chart?._fullLayout?._size?.w > 0 && chart.getBoundingClientRect().height > 0 && chart.querySelector("svg.main-svg")) {
              await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
              return item;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          throw Error(`Chart ${index + 1} of ${expected} did not finish rendering.`);
        };
        const blob = await exportPlottingPdf({ ...snapshot, download: false,
          getChart, chartCount: expected,
          setProgress: (progress) => window.pdfExportProgress(progress).catch(() => {}) });
        setChartIndex(null);
        for (let offset = 0; offset < blob.size; offset += 1024 * 1024) {
          const chunk = blob.slice(offset, offset + 1024 * 1024);
          const data = await new Promise((resolve, reject) => {
            const reader = new FileReader(); reader.onerror = reject;
            reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.readAsDataURL(chunk);
          });
          await window.pdfExportChunk(data);
        }
        window.__PDF_EXPORT_DONE__ = true;
      } catch (error) { setChartIndex(null); window.__PDF_EXPORT_ERROR__ = error.message || "PDF rendering failed."; }
    };
    run();
  }, [snapshot]);
  if (!snapshot) return <Typography>No PDF export was supplied.</Typography>;
  const { lsPages, allCs, chartOptions, chartWidth } = snapshot;
  const page = chartIndex === null ? null : lsPages[chartIndex];
  const cs = chartIndex === null ? null : allCs[chartIndex - lsPages.length];
  return <Box sx={{ width: chartWidth, bgcolor: "white" }}>
    {page && <Box key={`ls-${chartIndex}`} data-export-chart={chartIndex} className="pdf-chart-item" sx={{ width: "100%", mb: 2 }}>
      {lsPages.length > 1 && <Typography fontSize="12px" textAlign="center" sx={{ mb: 1 }}>L.S · Chainage {page.start.toFixed(3)} – {page.end.toFixed(3)} · Part {chartIndex + 1} of {lsPages.length}</Typography>}
      <CrossSectionChart showLevelBands selectedCs={page.section}
        chartOptions={withSectionBandLabelMargin({ ...chartOptions, layout: { ...chartOptions.layout, xaxis: { ...chartOptions.layout.xaxis, autorange: false, range: page.range, dtick: undefined, nticks: 8 } } }, page.section)}
        drawingScales={{ horizontal: 2400, vertical: 300 }} />
    </Box>}
    {cs && <Box key={`cs-${chartIndex}`} data-export-chart={chartIndex} className="pdf-chart-item" sx={{ mb: 4, width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <CrossSectionChartV2 showLevelBands selectedCs={cs} chartOptions={withSectionBandLabelMargin(cs.specificOptions || chartOptions, cs)} />
    </Box>}
  </Box>;
}
