// The worker must not boot authentication, persistence or the PWA updater.
// Keep these imports dynamic so a fresh export browser downloads only its renderer.
if (window.location.pathname === "/pdf-export-render") {
  import("./pdfBootstrap.jsx").catch((error) => {
    window.__PDF_EXPORT_ERROR__ = `Could not load PDF renderer: ${error.message}`;
  });
} else {
  import("./appBootstrap.jsx");
}
