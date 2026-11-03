# Background plotting PDF exports

The browser uploads a frozen report snapshot, then the API returns `202` once MongoDB has stored the job. Only after that acknowledgement can the app be closed safely. A server worker renders the same React charts and shared jsPDF exporter used by the report. The client does not need to remain connected. The server stores the resulting PDF privately in MongoDB GridFS and the app polls for jobs belonging to the signed-in user.

The existing export modal has a Minimize button. The progress card survives navigation within the authenticated app. After reopening, queued/running/completed jobs are restored from the API; a completed PDF starts downloading, with a Download PDF button available if the browser blocks automatic saving. A closed app cannot save a file onto the user's device: the server **generates and stores** it until the browser returns.

## Required deployment

Deploy both client and server changes together. The worker's browser must reach the new client route `/pdf-export-render`.

Set on the **server**:

```text
PDF_RENDER_ORIGIN=https://your-client-domain.example
PDF_CHROME_PATH=/usr/bin/chromium
```

`PDF_RENDER_ORIGIN` falls back to `CLIENT_URL`. Chrome/Chromium/Edge is detected at common local paths if `PDF_CHROME_PATH` is unset. No browser executable is downloaded by `puppeteer-core`. The API returns a clear 503 if the executable is missing or the origin is not configured. A configured but unreachable frontend results in a failed job.

For a container deployment, build with the `server` directory as context and `Dockerfile.pdf` as the Dockerfile. It installs Chromium, uses Node 22, and runs as the non-root `node` user. Existing database, authentication, CORS, and other application environment variables are still required. Use an always-running server/worker instance; a browser closure is independent of that instance, but a host that sleeps cannot actively process jobs. Configure enough memory for your largest report; begin with 2 GB and load-test representative surveys.

Chromium's sandbox is enabled by default. Only in a separately isolated container whose host cannot support it, explicitly set `PDF_CHROME_NO_SANDBOX=true`. The renderer has no user cookies, and its requests are restricted to the configured frontend origin (excluding API paths), blob URLs, and data URLs.

No S3 configuration is required. The existing MongoDB connection must allow read/write access to `pdfexports`, `pdfExports.files`, and `pdfExports.chunks`. Storage is private; downloads require the original authenticated owner. The renderer never receives a login token. Keep the API's request timeout/proxy body limit sufficient for an authenticated 9 MB upload; generated PDFs stream through the authenticated download endpoint.

## Recovery and retention

- One active export per user, enforced by a unique partial index; one renderer at a time per server process.
- Atomic job claims with a 2-minute lease and 15-second heartbeat support multiple server instances and reclaim interrupted jobs after restart.
- Three rendering attempts maximum after process interruptions; ordinary rendering errors are surfaced as failed jobs.
- Snapshots are removed on completion/failure. PDFs and job records expire after 7 days; hourly cleanup deletes GridFS chunks before metadata. A running server is needed for cleanup.
- Limits: 8 MB snapshot, 1,000 chart pages, 256 MB PDF, 20-minute render timeout.
- A download acknowledgement means the file was offered to the browser, not proof the user saved it. The Download PDF button remains available until expiry or dismissal.

## Verification

```text
node --test --test-isolation=none server/tests/pdfExports.test.js
```

For the real headless-render smoke check, run the client dev server on `127.0.0.1:5194`, then run `node server/tests/pdfExportRender.smoke.js` from the repository root. It uses a synthetic survey, not a live account. Set `PDF_CHROME_PATH` if Chromium is not at a detected path. Set `PDF_RENDER_ORIGIN` to check another deployed client build.

`node server/tests/pdfExportUi.smoke.js` checks the modal, minimize/expand, navigation, download, and reopening flow in a real browser with a mocked API. It creates and removes a temporary local test page. The render smoke test writes its PDF to the OS temporary directory, or to `PDF_SMOKE_OUTPUT` if supplied.

References: [Puppeteer launch options](https://pptr.dev/api/puppeteer.launchoptions), [MongoDB GridFS](https://www.mongodb.com/docs/drivers/node/current/crud/gridfs/).
