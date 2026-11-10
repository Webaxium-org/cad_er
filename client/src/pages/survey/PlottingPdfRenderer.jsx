import { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import CrossSectionChart from "./components/CrossSectionChart";
import CrossSectionChartV2 from "./components/CrossSectionChartV2";
import { withSectionBandLabelMargin } from "../../utils/sectionLevelBands";
import { exportPlottingPdf } from "../../utils/plottingPdf";

// This page has no API credentials. The server injects one authorized, frozen report.
export default function PlottingPdfRenderer() {
  const started = useRef(false);
  const snapshot = window.__PDF_EXPORT_SNAPSHOT__;
  useEffect(() => {
    if (!snapshot || started.current) return;
    started.current = true;
    const run = async () => {
      try {
        await window.pdfExportProgress({ percent: 0, message: "Preparing report charts...", estimatedTimeLeft: null });
        await document.fonts.ready;
        const expected = snapshot.lsPages.length + snapshot.allCs.length;
        const deadline = Date.now() + 120000;
        let lastReady = -1;
        while (true) {
          const charts = [...document.querySelectorAll(".js-plotly-plot")];
          const ready = charts.filter((chart) => chart._fullLayout?._size?.w > 0 && chart.getBoundingClientRect().width > 0 && chart.getBoundingClientRect().height > 0 && chart.querySelector("svg.main-svg")).length;
          if (ready !== lastReady) {
            lastReady = ready;
            await window.pdfExportProgress({ percent: 0, message: `Preparing report charts (${ready}/${expected})...`, estimatedTimeLeft: null });
          }
          if (ready === expected) break;
          if (Date.now() > deadline) throw Error("The report charts did not finish rendering.");
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const blob = await exportPlottingPdf({ ...snapshot, download: false,
          setProgress: (progress) => window.pdfExportProgress(progress).catch(() => {}) });
        for (let offset = 0; offset < blob.size; offset += 1024 * 1024) {
          const chunk = blob.slice(offset, offset + 1024 * 1024);
          const data = await new Promise((resolve, reject) => {
            const reader = new FileReader(); reader.onerror = reject;
            reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.readAsDataURL(chunk);
          });
          await window.pdfExportChunk(data);
        }
        window.__PDF_EXPORT_DONE__ = true;
      } catch (error) { window.__PDF_EXPORT_ERROR__ = error.message || "PDF rendering failed."; }
    };
    run();
  }, [snapshot]);
  if (!snapshot) return <Typography>No PDF export was supplied.</Typography>;
  const { lsPages, allCs, chartOptions, chartWidth } = snapshot;
  return <Box sx={{ width: chartWidth, bgcolor: "white" }}>
    {lsPages.map((page, index) => <Box key={`ls-${index}`} className="pdf-chart-item" sx={{ width: "100%", mb: 2 }}>
      {lsPages.length > 1 && <Typography fontSize="12px" textAlign="center" sx={{ mb: 1 }}>L.S · Chainage {page.start.toFixed(3)} – {page.end.toFixed(3)} · Part {index + 1} of {lsPages.length}</Typography>}
      <CrossSectionChart showLevelBands selectedCs={page.section}
        chartOptions={withSectionBandLabelMargin({ ...chartOptions, layout: { ...chartOptions.layout, xaxis: { ...chartOptions.layout.xaxis, autorange: false, range: page.range, dtick: undefined, nticks: 8 } } }, page.section)}
        drawingScales={{ horizontal: 2400, vertical: 300 }} />
    </Box>)}
    {allCs.map((cs, index) => <Box key={`cs-${index}`} className="pdf-chart-item" sx={{ mb: 4, width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <CrossSectionChartV2 showLevelBands selectedCs={cs} chartOptions={withSectionBandLabelMargin(cs.specificOptions || chartOptions, cs)} />
    </Box>)}
  </Box>;
}
