import html2canvas from "html2canvas";
import { capturePlotCanvas, GRAPH_EXPORT_SCALE } from "./graphCapture";

// A small, reusable document prevents html2canvas from cloning every graph and
// every report table for each page. The live report is never hidden or modified.
export const createChartCaptureSession = async () => {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, { position: "fixed", left: "-20000px", top: "0", border: "0", pointerEvents: "none" });
  document.body.appendChild(frame);
  const target = frame.contentDocument;
  const style = target.createElement("style");
  const refreshStyles = () => { style.textContent = [...document.styleSheets].flatMap(sheet => {
    try { return [...sheet.cssRules].filter(rule => !/^@(?:font-face|import)/i.test(rule.cssText)).map(rule => rule.cssText); }
    catch { return []; }
  }).join("\n") + "\nhtml,body{margin:0!important;background:white!important}body *{font-family:Arial,sans-serif!important}"; };
  target.head.appendChild(style);
  return {
    async capture(el) {
      const bounds = el.getBoundingClientRect();
      if (!bounds.width || !bounds.height) throw new Error("Chart has no size for PDF export.");
      frame.style.width = `${Math.ceil(bounds.width)}px`;
      frame.style.height = `${Math.ceil(bounds.height)}px`;
      const copy = el.cloneNode(true);
      copy.querySelectorAll("[data-pdf-scale-label]").forEach(node => { node.style.visibility = "hidden"; });
      copy.style.width = `${bounds.width}px`;
      copy.style.margin = "0";
      const originals = [...el.querySelectorAll(".js-plotly-plot")];
      const copies = [...copy.querySelectorAll(".js-plotly-plot")];
      if (!originals.length) throw new Error("The graph is not ready yet.");
      const plots = [];
      const canvases = [];
      let timeout;
      try {
        for (let index = 0; index < originals.length; index++) {
          const { canvas, width, height, plotArea } = await capturePlotCanvas(originals[index]);
          canvases.push(canvas);
          plots.push({ plotArea, plotWidthPx: width * plotArea?.width, plotHeightPx: height * plotArea?.height });
          // html2canvas copies canvas pixels directly. Avoid encoding a large
          // base64 JPEG and decoding it into another image for every chart.
          Object.assign(canvas.style, { width: `${width}px`, height: `${height}px`, display: "block" });
          copies[index].replaceWith(canvas);
        }
        // Sequential rendering introduces new Emotion rules as each chart mounts.
        refreshStyles();
        target.body.replaceChildren(copy);
        const canvas = await Promise.race([html2canvas(copy, { scale: GRAPH_EXPORT_SCALE, backgroundColor: "#ffffff", logging: false,
          useCORS: true, allowTaint: false, width: Math.ceil(bounds.width), height: Math.ceil(bounds.height),
          windowWidth: Math.ceil(bounds.width), windowHeight: Math.ceil(bounds.height), scrollX: 0, scrollY: 0 }),
          new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Chart image capture timed out.")), 60000); }),
        ]);
        return { canvas, plots };
      } finally {
        clearTimeout(timeout);
        canvases.forEach(canvas => { canvas.width = canvas.height = 0; });
        target.body.replaceChildren();
      }
    },
    dispose() { frame.remove(); },
  };
};
