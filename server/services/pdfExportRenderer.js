import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

export const pdfRendererConfig = () => {
  const origin = process.env.PDF_RENDER_ORIGIN || process.env.CLIENT_URL;
  const executablePath = process.env.PDF_CHROME_PATH || [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome",
  ].find((path) => existsSync(path));
  if (!origin || !executablePath || !existsSync(executablePath)) return null;
  try {
    const url = new URL("/pdf-export-render", origin);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return { url: url.href, executablePath };
  } catch { return null; }
};

export const renderPdfSnapshot = async (snapshot, { onProgress, onChunk, signal, config = pdfRendererConfig() }) => {
  if (!config) throw Error("The PDF renderer is not configured.");
  const browser = await puppeteer.launch({ executablePath: config.executablePath, headless: true,
    args: ["--disable-dev-shm-usage", ...(process.env.PDF_CHROME_NO_SANDBOX === "true" ? ["--no-sandbox"] : [])] });
  const abort = () => { browser.close().catch(() => {}); };
  let lastProgress = Date.now(), lastStage = "Loading report", stalled = false;
  const watchdog = setInterval(() => {
    if (Date.now() - lastProgress > 120000) { stalled = true; abort(); }
  }, 5000);
  watchdog.unref();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    if (signal?.aborted) throw Error("Export lease lost.");
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.setBypassServiceWorker(true);
    await page.setRequestInterception(true);
    const origin = new URL(config.url).origin;
    page.on("request", (request) => {
      const url = request.url();
      // No credentials or arbitrary network access in the export browser.
      if (url.startsWith("data:") || url.startsWith("blob:") || url === "about:blank") return void request.continue();
      const parsed = new URL(url);
      if (parsed.origin === origin && !parsed.pathname.startsWith("/api/")) return void request.continue();
      return void request.abort();
    });
    await page.exposeFunction("pdfExportProgress", async value => {
      lastProgress = Date.now(); lastStage = value.message;
      await onProgress(value);
    });
    await page.exposeFunction("pdfExportChunk", async value => {
      lastProgress = Date.now();
      await onChunk(value);
    });
    await page.evaluateOnNewDocument((value) => { window.__PDF_EXPORT_SNAPSHOT__ = value; }, snapshot);
    await page.goto(config.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => window.__PDF_EXPORT_DONE__ || window.__PDF_EXPORT_ERROR__, { timeout: 20 * 60 * 1000, polling: 500 });
    const error = await page.evaluate(() => window.__PDF_EXPORT_ERROR__);
    if (error) throw Error(error);
  } catch (error) {
    if (stalled) throw Error(`PDF rendering stopped making progress at: ${lastStage}`);
    throw error;
  } finally {
    clearInterval(watchdog);
    signal?.removeEventListener("abort", abort);
    await browser.close();
  }
};
