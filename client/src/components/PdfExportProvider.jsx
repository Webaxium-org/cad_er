import { useEffect, useRef, useState } from "react";
import { Box, Modal } from "@mui/material";
import { useCallback, useMemo } from "react";
import ExportLoader from "./ExportLoader";
import { PdfExportContext } from "../utils/pdfExportContext";
import { exportPlottingPdf } from "../utils/plottingPdf";

export default function PdfExportProvider({ children }) {
  const [progress, setProgress] = useState(null);
  const exporting = useRef(false);
  const busy = progress !== null;

  useEffect(() => {
    if (!busy) return;
    const beforeUnload = event => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    // Keep browser Back on this report while its charts are being captured.
    const lockedUrl = window.location.href;
    const originalState = window.history.state;
    const lockState = { ...originalState, pdfExportLock: true };
    window.history.pushState(lockState, "", lockedUrl);
    const preventBack = event => {
      event.stopImmediatePropagation();
      window.history.pushState(lockState, "", lockedUrl);
    };
    window.addEventListener("popstate", preventBack, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", preventBack, true);
      if (window.history.state?.pdfExportLock) window.history.back();
    };
  }, [busy]);

  const startExport = useCallback(async (surveyId, snapshot) => {
    if (exporting.current) return;
    exporting.current = true;
    setProgress({ percent: 0, message: "Preparing report charts...", estimatedTimeLeft: null });
    try {
      // Give the blocking dialog time to paint before generating the document.
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
      const expected = snapshot.lsPages.length + snapshot.allCs.length;
      const deadline = Date.now() + 60000;
      while (true) {
        const charts = [...document.querySelectorAll(".pdf-chart-item .js-plotly-plot")];
        if (charts.length === expected && charts.every(chart => chart._fullLayout?._size?.w > 0
          && chart.getBoundingClientRect().height > 0 && chart.querySelector("svg.main-svg"))) break;
        if (Date.now() >= deadline) throw Error("The report graphs did not finish loading. Please try again.");
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await exportPlottingPdf({ ...snapshot, setProgress });
    } finally {
      exporting.current = false;
      setProgress(null);
    }
  }, []);

  // Progress updates must not redraw the report charts being captured.
  const context = useMemo(() => ({ startExport, backgroundExportsEnabled: false }), [startExport]);

  return <PdfExportContext.Provider value={context}>
    {children}
    <Modal open={Boolean(progress)} disableEscapeKeyDown aria-label="PDF download progress">
      <Box tabIndex={-1}>
        <ExportLoader open={Boolean(progress)} progress={progress?.percent ?? 0}
          progressMessage={progress?.message || ""} estimatedTimeLeft={progress?.estimatedTimeLeft ?? null}
          keepWindowOpen />
      </Box>
    </Modal>
  </PdfExportContext.Provider>;
}
