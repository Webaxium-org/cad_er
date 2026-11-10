// Browser downloads are the default while background rendering is suspended.
export const serverPdfExportsEnabled = (env = process.env) => env.PDF_EXPORTS_ENABLED === "true";
