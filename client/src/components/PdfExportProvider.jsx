import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Box, Button, LinearProgress, Paper, Popover, Stack, Typography } from "@mui/material";
import { saveAs } from "file-saver";
import { axiosInstance } from "../utils/config";
import ExportLoader from "./ExportLoader";
import { PdfExportContext } from "../utils/pdfExportContext";
import { queuePdfExport } from "../utils/queuePdfExport";

export default function PdfExportProvider({ children }) {
  const user = useSelector((state) => state.user?.user);
  const userId = user?._id;
  const enabled = Boolean(userId && user.type === "Professional");
  const [jobs, setJobs] = useState([]);
  const [modalId, setModalId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingSubmission, setCheckingSubmission] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [downloadsAnchor, setDownloadsAnchor] = useState(null);
  const [connectionError, setConnectionError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const submittingRef = useRef(false);
  const attempted = useRef(new Set());
  const refresh = useRef(() => {});
  const revision = useRef(0);
  const owner = useRef(userId);
  owner.current = userId;

  useEffect(() => {
    setJobs([]); setModalId(null); setSubmitting(false); setMinimized(false);
    setDownloadsAnchor(null);
    setConnectionError(""); setDownloadError(""); attempted.current.clear();
    if (!enabled) return;
    let disposed = false, timer, inFlight = false, hasActive = false;
    const controller = new AbortController();
    const poll = async () => {
      if (inFlight || disposed) return;
      inFlight = true;
      const version = revision.current;
      try {
        const { data } = await axiosInstance.get("pdf-exports", { signal: controller.signal, timeout: 15000 });
        if (!disposed && version === revision.current) {
          hasActive = data.jobs.some((job) => ["queued", "running"].includes(job.status));
          setJobs(data.jobs); setConnectionError("");
        }
      } catch (error) {
        if (!disposed && error.code !== "ERR_CANCELED") setConnectionError("Waiting for connection. Server exports continue in the background.");
      } finally { inFlight = false; if (!disposed) timer = setTimeout(poll, hasActive ? 8000 : 30000); }
    };
    refresh.current = () => { hasActive = true; clearTimeout(timer); if (!inFlight) timer = setTimeout(poll, 1000); };
    const onVisible = () => { if (document.visibilityState === "visible") refresh.current(); };
    document.addEventListener("visibilitychange", onVisible);
    poll();
    return () => { disposed = true; clearTimeout(timer); controller.abort(); document.removeEventListener("visibilitychange", onVisible); refresh.current = () => {}; };
  }, [userId, enabled]);

  const download = useCallback(async (job) => {
    setDownloading(job.id); setDownloadError("");
    try {
      const response = await axiosInstance.get(`pdf-exports/${job.id}/download`, { responseType: "blob" });
      if (owner.current !== userId) return;
      saveAs(response.data, "plotting-and-quantity-report.pdf");
      // Acknowledges delivery to this browser, not a guarantee that the user saved it.
      await axiosInstance.patch(`pdf-exports/${job.id}`, { action: "downloaded" });
      revision.current++;
      setJobs((previous) => previous.map((item) => item.id === job.id ? { ...item, downloadedAt: new Date().toISOString() } : item));
    } catch {
      if (owner.current === userId) setDownloadError("The download could not start. Use Download PDF to try again.");
    } finally { if (owner.current === userId) setDownloading(null); }
  }, [userId]);

  useEffect(() => {
    if (downloading) return;
    const ready = jobs.find((job) => job.status === "completed" && !job.downloadedAt && !attempted.current.has(job.id));
    if (!ready) return;
    attempted.current.add(ready.id);
    download(ready);
  }, [jobs, download, downloading]);

  const startExport = async (surveyId, snapshot) => {
    if (submittingRef.current) return;
    const existing = jobs.find((job) => ["queued", "running"].includes(job.status));
    if (existing) { setModalId(existing.id); setMinimized(false); setDownloadsAnchor(null); return; }
    submittingRef.current = true;
    setCheckingSubmission(false);
    setSubmitting(true); setMinimized(false); setDownloadsAnchor(null); setDownloadError("");
    try {
      const job = await queuePdfExport(axiosInstance, { surveyId, snapshot, requestKey: crypto.randomUUID() }, {
        onRecovery: () => { if (owner.current === userId) setCheckingSubmission(true); },
      });
      if (owner.current !== userId) return;
      revision.current++;
      setJobs((previous) => [job, ...previous.filter((item) => item.id !== job.id)]);
      setModalId(job.id);
      refresh.current();
    } finally { submittingRef.current = false; if (owner.current === userId) { setSubmitting(false); setCheckingSubmission(false); } }
  };
  const cancel = async (job) => {
    setCancelling(job.id); setDownloadError("");
    try {
      const { data } = await axiosInstance.patch(`pdf-exports/${job.id}`, { action: "cancel" }, { timeout: 15000 });
      if (owner.current !== userId) return;
      revision.current++;
      setJobs(previous => previous.map(item => item.id === job.id ? data.job : item));
      setModalId(null);
    } catch {
      if (owner.current === userId) { setDownloadError("Could not cancel the PDF export. Please try again."); setMinimized(true); }
    } finally { if (owner.current === userId) { setCancelling(null); refresh.current(); } }
  };
  const dismiss = async (job) => {
    try {
      await axiosInstance.patch(`pdf-exports/${job.id}`, { action: "dismissed" });
      setJobs((previous) => previous.filter((item) => item.id !== job.id));
    } catch { setDownloadError("Could not dismiss this export. Please try again."); }
  };
  const selected = jobs.find((job) => job.id === modalId);
  const active = selected && ["queued", "running"].includes(selected.status);
  const showModal = !minimized && (submitting || active);
  return <PdfExportContext.Provider value={{ startExport, downloadCount: jobs.length + (submitting ? 1 : 0), downloadsOpen: Boolean(downloadsAnchor), openDownloads: (event) => setDownloadsAnchor(event.currentTarget) }}>
    {children}
    <ExportLoader open={Boolean(showModal)} progress={submitting ? 0 : selected?.progress ?? 0}
      progressMessage={submitting ? checkingSubmission ? "The server response was delayed. Checking whether your PDF was queued..." : "Sending report to server. Keep the app open until it is queued..." : connectionError || (selected?.attempts > 1 ? `Retry ${selected.attempts - 1} after an interruption. ${selected.message}` : selected?.message) || ""}
      onCancel={active ? () => cancel(selected) : undefined} cancelling={cancelling === selected?.id}
      estimatedTimeLeft={connectionError ? null : selected?.estimatedTimeLeft ?? null} onMinimize={() => { setMinimized(true); setDownloadsAnchor(null); }} />
    <Popover id="navbar-downloads" open={Boolean(downloadsAnchor) && !showModal} anchorEl={downloadsAnchor} onClose={() => setDownloadsAnchor(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { role: "dialog", "aria-label": "Downloads", sx: { mt: 1, p: 2, width: 360, maxWidth: "calc(100vw - 24px)", maxHeight: "70vh", borderRadius: 3 } } }}>
    <Stack spacing={1} aria-live="polite">
      <Typography fontWeight={800}>Downloads</Typography>
      {!submitting && jobs.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No downloads yet</Typography>}
      {connectionError && <Alert severity="warning">{connectionError}</Alert>}
      {downloadError && <Alert severity="error">{downloadError}</Alert>}
      {submitting && <Paper sx={{ p: 2 }}><Typography>Sending report to server…</Typography><LinearProgress /><Typography variant="caption">Keep the app open until it is queued.</Typography></Paper>}
      {jobs.map((job) => <Paper key={job.id} elevation={6} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #e2e8f0" }}>
        <Typography fontWeight={700} noWrap>{job.title}</Typography>
        <Typography variant="body2" color={job.status === "failed" ? "error" : "text.secondary"}>{job.message}</Typography>
        {["queued", "running"].includes(job.status) ? <>
          <LinearProgress variant={job.status === "queued" ? "indeterminate" : "determinate"} value={job.progress} sx={{ my: 1 }} />
          <Typography variant="caption">{job.progress}% · Continues if you close the app</Typography>
          <Stack direction="row" justifyContent="flex-end"><Button size="small" disabled={cancelling === job.id} onClick={() => cancel(job)}>{cancelling === job.id ? "Cancelling..." : "Cancel"}</Button><Button size="small" onClick={() => { setModalId(job.id); setMinimized(false); setDownloadsAnchor(null); }}>Expand</Button></Stack>
        </> : <Box>
          {job.status === "completed" && <><Button size="small" disabled={downloading === job.id} onClick={() => download(job)}>{downloading === job.id ? "Downloading…" : "Download PDF"}</Button><Typography variant="caption" display="block">Available until {new Date(job.expiresAt).toLocaleDateString()}. If no download appears, use the button.</Typography></>}
          <Button size="small" color="inherit" onClick={() => dismiss(job)}>Dismiss</Button>
        </Box>}
      </Paper>)}
    </Stack>
    </Popover>
  </PdfExportContext.Provider>;
}
