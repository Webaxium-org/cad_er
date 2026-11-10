# PDF downloads

Plotting PDFs are currently generated and downloaded in the user's browser. The
progress dialog blocks navigation, warns against closing or refreshing the
window, and shows an estimate based on completed charts. Minimize and the
background Downloads menu are disabled. The client does not submit or poll PDF jobs.

Background generation is disabled by default, including processing previously
queued jobs. Leave `PDF_EXPORTS_ENABLED` unset or set it to `false` on the server.
New background submissions receive HTTP 503, directing older clients to refresh.
Deploy both client and server for this temporary browser-only mode.

The background implementation is retained for future use. Setting
`PDF_EXPORTS_ENABLED=true` re-enables server job acceptance and the worker; it
does not switch the current browser UI back to background exports. The remaining
deployment notes describe that retained server implementation.

## Required deployment

Local renderer origins (`localhost`, `127.0.0.1`, or `::1`) use the separate
`pdfexports_local` collection. Deployed origins keep using `pdfexports`, so a
deployed worker cannot claim a locally submitted export in a shared database.
For additional isolated environments, set `PDF_EXPORT_QUEUE` to the same short
name on that environment's API and workers. Jobs remain in their original
queue; submit a fresh export after changing queue configuration.

Deploy both client and server changes together. The worker's browser must reach the new client route `/pdf-export-render`.

Set on the **server**:

```text
PDF_RENDER_ORIGIN=https://your-client-domain.example
PDF_CHROME_PATH=/usr/bin/chromium
```

`PDF_RENDER_ORIGIN` falls back to `CLIENT_URL`. Chrome/Chromium/Edge is detected at common local paths if `PDF_CHROME_PATH` is unset. No browser executable is downloaded by `puppeteer-core`. The API returns a clear 503 if the executable is missing or the origin is not configured. A configured but unreachable frontend results in a failed job.

For a container deployment, build with the `server` directory as context and `Dockerfile.pdf` as the Dockerfile. It installs Chromium, uses Node 22, and runs as the non-root `node` user. Existing database, authentication, CORS, and other application environment variables are still required. Use an always-running server/worker instance; a browser closure is independent of that instance, but a host that sleeps cannot actively process jobs. Configure enough memory for your largest report; begin with 2 GB and load-test representative surveys.

### DigitalOcean App Platform

If runtime logs say `Background PDF generation is not configured on this server`, the renderer origin and/or an existing browser executable are missing. `puppeteer-core` does not install a browser with `npm install`.

In the existing backend service's app spec, set these fields (merge them; retain its repository, domains, routes, port, and existing environment variables):

```yaml
source_dir: server
dockerfile_path: server/Dockerfile.pdf
run_command: node server.js
```

The Dockerfile path is relative to the repository root; `source_dir` supplies the `server` build context. Remove a Node buildpack `build_command`/`environment_slug` override when switching this service to Docker. In the backend's runtime environment, set:

```text
PDF_RENDER_ORIGIN=https://getcader.com
PDF_CHROME_PATH=/usr/bin/chromium
```

Redeploy the backend using this Dockerfile. Setting `PDF_CHROME_PATH` alone does not install Chromium. Verify in the backend console that `test -x /usr/bin/chromium && /usr/bin/chromium --version` succeeds, and confirm the frontend includes `/pdf-export-render`. The required deployment is not complete until a production export is accepted with HTTP 202 and progresses to completion.

Reference: [DigitalOcean Dockerfile builds](https://docs.digitalocean.com/products/app-platform/reference/dockerfile/) and [app spec fields](https://docs.digitalocean.com/products/app-platform/reference/app-spec/).

Chromium's sandbox is enabled by default. Only in a separately isolated container whose host cannot support it, explicitly set `PDF_CHROME_NO_SANDBOX=true`. The renderer has no user cookies, and its requests are restricted to the configured frontend origin (excluding API paths), blob URLs, and data URLs.

No S3 configuration is required. The existing MongoDB connection must allow read/write access to `pdfexports`, `pdfExports.files`, and `pdfExports.chunks`. Storage is private; downloads require the original authenticated owner. The renderer never receives a login token. Keep the API's request timeout/proxy body limit sufficient for an authenticated 9 MB upload; generated PDFs stream through the authenticated download endpoint.

## Recovery and retention

The client recovers a lost queue acknowledgement by looking up the original request key after a network/gateway timeout. This does not upload the report again or create a duplicate job. Deploy client and API together for this recovery lookup.

### Diagnosing production 504 errors

`POST /api/pdf-exports` only validates and stores the snapshot; Chromium runs afterwards in the worker. A 504 on that POST is a queue acceptance or gateway problem, not evidence that the renderer exceeded its 20-minute limit. Slow POST requests log `PDF export queue request is slow` after 10 seconds, with a trace ID, elapsed time, upload size, and current stage (authentication, subscription, snapshot upload, ownership lookup, existing-job lookup, renderer configuration, or persistence). The completion/disconnection log records whether the API finished its response. No report contents or credentials are logged.

In DigitalOcean App Platform, inspect backend runtime logs for those entries at the failed request time. If requests finish with 202 but the browser gets 504, inspect the gateway/upload path; if a database stage stalls, inspect database connectivity/latency and indexes. If a job is accepted but later fails, inspect `PDF export failed` and the Chromium setup above. Increasing the renderer timeout will not fix a queue acceptance timeout.

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

`node server/tests/pdfExportUi.smoke.js` checks browser-only generation of a real
PDF, the keep-window-open warning, ETA, blocked navigation, duplicate-click
protection, and recovery after encoding failure. It rejects unexpected API calls
and creates and removes a temporary local test page and download directory. The
separate render smoke test writes its PDF to the OS temporary directory, or to
`PDF_SMOKE_OUTPUT` if supplied.

### Worker restarts during chart capture

The renderer mounts one chart at a time, releases capture canvases after each page,
and avoids the intermediate base64 JPEG copy. Deploy both client and server for
these changes. An interrupted job can be reclaimed after its lease expires, up to
three attempts. Increasing retries or the stall timeout does not fix a host restart.

Runtime logs now include `PDF export resources` at startup and every 15 seconds:
`containerBytes` includes Chromium and Node, `containerLimitBytes` is the Linux
cgroup limit, and `stage` identifies rendering, capturing, or encoding. On systems
without cgroups only Node RSS is available. Compare these with App Platform memory
and restart events; exit code 128 by itself does not establish an OOM kill.

For a wider stress check, set `PDF_SMOKE_CS_COUNT=35`,
`PDF_SMOKE_CHART_WIDTH=2000`, and `PDF_SMOKE_CPU_RATE=4` before running the render
smoke test. It asserts that only one live chart is mounted and that every chart
appears in the PDF. CPU throttling is not a container memory-limit test; validate
the real survey on the deployed instance before considering production resolved.

References: [Puppeteer launch options](https://pptr.dev/api/puppeteer.launchoptions), [MongoDB GridFS](https://www.mongodb.com/docs/drivers/node/current/crud/gridfs/).

Long-running exports use short worker-side status checks rather than one pending
browser evaluation. This avoids the browser protocol's separate three-minute
request timeout while retaining the export time limit and no-progress watchdog.
The smoke test includes a synthetic export whose duration exceeds its per-request
protocol timeout to prevent that regression.
