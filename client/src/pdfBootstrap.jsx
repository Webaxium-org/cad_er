import { createRoot } from "react-dom/client";
import PlottingPdfRenderer from "./pages/survey/PlottingPdfRenderer";
import "./pdfRenderer.css";

window.__PDF_EXPORT_READY__ = true;
createRoot(document.getElementById("root"), {
  onUncaughtError: (error) => { window.__PDF_EXPORT_ERROR__ = error.message; },
}).render(<PlottingPdfRenderer />);
