import { useEffect, useState } from "react";
import { Alert, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { getMyGstProfile, saveMyGstProfile } from "../../services/userServices";

const errorMessage = error => error.response?.data?.message || "GST details could not be fetched. Please try again.";
export default function ProfileGstDetails() {
  const [gstin, setGstin] = useState("");
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true); setError("");
    getMyGstProfile().then(({ data }) => {
      if (!live) return;
      setSaved(data); setGstin(data.gstin);
    }).catch(() => { if (live) setError("GST details could not be loaded. Please retry."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [retry]);
  const lookup = async (event, refresh = false) => {
    event?.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const { data } = await saveMyGstProfile({ gstin, refresh });
      setSaved(data); setGstin(data.gstin);
      setNotice(!data.gstin ? "GST details removed. Future invoices will use your CADer account name." : data.reused ? "Your previously fetched GST details are already saved." : "Firm details fetched and saved. Future invoices will use these details.");
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };
  const clear = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const { data } = await saveMyGstProfile({ gstin: "" });
      setSaved(data); setGstin(""); setNotice("GST details removed. Future invoices will use your CADer account name.");
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };
  const fetched = Boolean(saved?.gstin && saved?.gstFetchedAt);
  return <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: "20px", border: "1px solid #e2e8f0" }}>
    <Typography variant="h6" fontWeight={800} color="#1e293b">GST details for invoices</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>Enter your GSTIN to fetch and save the registered firm details. Without GST details, invoices use your CADer account name. Issued invoices keep their original details.</Typography>
    {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }} action={!saved && <Button onClick={() => setRetry(value => value + 1)}>Retry</Button>}>{error}</Alert>}
    {loading ? <CircularProgress size={24} /> : saved && <Stack component="form" onSubmit={lookup} spacing={2}>
      {!saved.lookupConfigured && <Alert severity="info">Automatic GST lookup is not available yet. You can continue using your CADer account name for invoices.</Alert>}
      <TextField label="GSTIN" value={gstin} onChange={e => { setGstin(e.target.value.toUpperCase()); setNotice(""); }} disabled={busy} fullWidth inputProps={{ maxLength: 15 }} helperText="Enter the 15-character GSTIN registered to your business." />
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button type="submit" variant="contained" disabled={busy || !gstin.trim() || !saved.lookupConfigured} sx={{ borderRadius: 2, bgcolor: "#6366f1", textTransform: "none" }}>{busy ? "Fetching..." : "Fetch and save GST details"}</Button>
        {saved.gstin && <Button onClick={clear} disabled={busy}>Remove GST details</Button>}
      </Stack>
      {fetched ? <Stack spacing={1.5} sx={{ p: 2.5, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", overflowWrap: "anywhere" }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography fontWeight={700}>Saved firm details</Typography>
          <Chip label="Fetched and saved" color="success" size="small" />
        </Stack>
        {[["Firm name", saved.gstBusinessName], ["Firm GSTIN", saved.gstin], ["Firm address", saved.gstBusinessAddress], ["Mobile number", saved.gstMobile || "Not provided by the GST lookup"]].map(([label, value]) => <Stack key={label} spacing={0.25}>
          <Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2">{value}</Typography>
        </Stack>)}
        <Typography variant="caption" color="text.secondary">Fetched on {new Date(saved.gstFetchedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</Typography>
        {gstin.trim() === saved.gstin && saved.lookupConfigured && <Button onClick={e => lookup(e, true)} disabled={busy} sx={{ alignSelf: "flex-start" }}>Refresh from GST records</Button>}
      </Stack> : saved.gstin ? <Alert severity="info">This GSTIN was entered previously. Fetch it to replace the old details with registered firm details.</Alert> : <Typography variant="body2" color="text.secondary">Invoice recipient: {saved.accountName}</Typography>}
    </Stack>}
  </Paper>;
}
