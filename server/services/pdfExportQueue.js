// A local API and a deployed API may share MongoDB, but must not run each
// other's browser jobs. Keep the existing deployed collection unchanged.
export const pdfExportCollection = (env = process.env) => {
  const explicit = env.PDF_EXPORT_QUEUE;
  if (explicit) {
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(explicit)) throw Error("Invalid PDF_EXPORT_QUEUE name.");
    return `pdfexports_${explicit}`;
  }
  try {
    const origin = new URL(env.PDF_RENDER_ORIGIN || env.CLIENT_URL);
    if (["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) return "pdfexports_local";
  } catch { /* Renderer configuration reports invalid origins separately. */ }
  return "pdfexports";
};
