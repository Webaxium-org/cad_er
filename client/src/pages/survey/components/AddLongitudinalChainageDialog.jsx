import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { createLongitudinalChainage, previewLongitudinalChainage } from "../../../services/surveyServices";

export default function AddLongitudinalChainageDialog({ open, surveyId, referencePurposeId, separator = "/", onClose, onAdded }) {
  const [chainage, setChainage] = useState("");
  const [preview, setPreview] = useState(null);
  const [levels, setLevels] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    requestId.current += 1;
    setChainage(""); setPreview(null); setLevels([]); setError(""); setBusy(false);
    return () => { requestId.current += 1; };
  }, [open, surveyId, referencePurposeId]);

  const handlePreview = async () => {
    const current = ++requestId.current;
    setBusy(true); setError(""); setPreview(null);
    try {
      const { data } = await previewLongitudinalChainage(surveyId, { chainage: chainage.trim(), referencePurposeId });
      if (current !== requestId.current) return;
      setPreview(data);
      setLevels(data.levels.map((level) => ({ ...level, rl: Number(level.rl).toFixed(3) })));
    } catch (failure) {
      if (current === requestId.current) setError(failure.response?.data?.message || failure.message);
    } finally { if (current === requestId.current) setBusy(false); }
  };

  const invalidLevel = (value) => String(value).trim() === "" || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > 1000000;
  const handleSave = async (event) => {
    event.preventDefault();
    if (busy || !preview || levels.some((level) => invalidLevel(level.rl))) return;
    setBusy(true); setError("");
    try {
      const { data } = await createLongitudinalChainage(surveyId, {
        chainage: preview.chainage, referencePurposeId, previewToken: preview.previewToken,
        levels: levels.map(({ purposeId, rl }) => ({ purposeId, rl })),
      });
      await onAdded(data.chainage);
    } catch (failure) {
      setError(failure.response?.data?.message || failure.message);
      if (failure.response?.status === 409) setPreview(null);
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSave}>
        <DialogTitle sx={{ fontWeight: 800 }}>Add chainage</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Insert a station between existing chainages. Cross-sections are interpolated and saved in every existing level, including levels outside this report.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} gap={1} alignItems={{ sm: "flex-start" }}>
              <TextField label="New chainage" fullWidth value={chainage} disabled={busy}
                placeholder={`0${separator}025`} helperText="Use a station within the existing range, outside any breaks."
                onChange={(event) => { setChainage(event.target.value); setPreview(null); setLevels([]); setError(""); }} />
              <Button type="button" variant="outlined" disabled={busy || !chainage.trim()} onClick={handlePreview}
                sx={{ minHeight: 56, textTransform: "none", flexShrink: 0 }}>Preview</Button>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
            {preview && <>
              <Alert severity="info">Review RL values for {preview.chainage}. Adjusting an RL shifts that entire interpolated cross-section. These are calculated values, not field observations.</Alert>
              {levels.map((level, index) => <TextField key={level.purposeId} type="number" fullWidth
                label={`${level.name} (RL)`} value={level.rl} disabled={busy}
                error={invalidLevel(level.rl)}
                helperText={invalidLevel(level.rl) ? "Enter a valid RL." : `Between ${level.from} and ${level.to}`}
                inputProps={{ step: "0.001" }}
                onChange={(event) => setLevels((previous) => previous.map((entry, entryIndex) => entryIndex === index ? { ...entry, rl: event.target.value } : entry))} />)}
              <Typography variant="caption" color="text.secondary">Adding saves the station immediately. Undo in the table applies only to later unsaved RL edits.</Typography>
            </>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={busy || !preview || levels.some((level) => invalidLevel(level.rl))}
            sx={{ bgcolor: "#4f46e5", textTransform: "none", "&:hover": { bgcolor: "#4338ca" } }}>
            {busy ? "Working…" : "Add chainage"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
