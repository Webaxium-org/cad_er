import { existsSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
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

export const renderPdfSnapshot = async (snapshot, { onProgress, onChunk, signal, configurePage, config = pdfRendererConfig() }) => {
  if (!config) throw Error("The PDF renderer is not configured.");
  await onProgress({ percent: 0, message: "Launching PDF browser...", estimatedTimeLeft: null });
  const browser = await puppeteer.launch({ executablePath: config.executablePath, headless: true,
    protocolTimeout: config.protocolTimeout ?? 180000,
    args: ["--disable-dev-shm-usage", ...(process.env.PDF_CHROME_NO_SANDBOX === "true" ? ["--no-sandbox"] : [])] });
  let closing;
  const closeBrowser = () => closing ||= (async () => {
    let timer;
    try {
      await Promise.race([
        browser.close().catch(() => { browser.process()?.kill("SIGKILL"); }),
        new Promise(resolve => { timer = setTimeout(() => { browser.process()?.kill("SIGKILL"); resolve(); }, 10000); }),
      ]);
    } finally { clearTimeout(timer); }
  })();
  const abort = () => { void closeBrowser(); };
  let rendererCrash;
  let lastProgress = Date.now(), lastStage = "Loading report", stalled = false;
  const watchdog = setInterval(() => {
    if (Date.now() - lastProgress > 120000) { stalled = true; abort(); }
  }, 5000);
  watchdog.unref();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    if (signal?.aborted) throw Error("Export lease lost.");
    const page = await browser.newPage();
    page.on("error", error => { rendererCrash = error; abort(); });
    if (configurePage) await configurePage(page);
    page.on("pageerror", error => {
      page.evaluate(message => { window.__PDF_EXPORT_ERROR__ = message; }, error.message).catch(() => {});
    });
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
    lastStage = "Loading PDF renderer";
    await onProgress({ percent: 0, message: "Loading PDF renderer...", estimatedTimeLeft: null });
    const response = await page.goto(config.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    if (!response?.ok()) throw Error(`PDF renderer page returned HTTP ${response?.status() || "no response"}.`);
    await page.waitForFunction(() => window.__PDF_EXPORT_READY__ || window.__PDF_EXPORT_DONE__ || window.__PDF_EXPORT_ERROR__, { timeout: 60000 });
    // A browser-side wait keeps one CDP request pending for the entire export.
    // That request hits Puppeteer's protocol timeout (normally 3 minutes), even
    // while charts are progressing. Poll with short requests from the worker.
    const deadline = Date.now() + 20 * 60 * 1000;
    while (true) {
      const state = await page.evaluate(() => ({ done: window.__PDF_EXPORT_DONE__, error: window.__PDF_EXPORT_ERROR__ }));
      if (state.error) throw Error(state.error);
      if (state.done) break;
      if (Date.now() >= deadline) throw Error(`PDF export exceeded its time limit at: ${lastStage}`);
      await delay(500);
    }
  } catch (error) {
    if (rendererCrash) throw Error(`PDF browser crashed at: ${lastStage}. ${rendererCrash.message}`);
    if (stalled) throw Error(`PDF rendering stopped making progress at: ${lastStage}`);
    throw error;
  } finally {
    clearInterval(watchdog);
    signal?.removeEventListener("abort", abort);
    await closeBrowser();
  }
};
