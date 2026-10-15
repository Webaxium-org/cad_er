import { useEffect, useState } from "react";
import { Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";

const TRIAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export default function ProfessionalTrialCountdown({ startedAt }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const start = new Date(startedAt).getTime();
  if (!Number.isFinite(start)) return null;

  const remaining = Math.max(0, start + TRIAL_DURATION_MS - now);
  const expired = remaining === 0;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const time = `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;

  return (
    <Paper elevation={0} sx={{ border: "1px solid #c7d2fe", borderRadius: "12px", bgcolor: "#eef2ff", px: 2, py: 1.5, mb: 1.25 }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2}>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={800} color="#312e81" variant="body2">
            {expired ? "Your 30-day free trial has ended" : "Professional free trial"}
          </Typography>
          <Typography variant="caption" color="#4338ca">
            {expired ? "A subscription is required to continue using CADer." : "Subscribe to continue using CADer after your trial ends."}
          </Typography>
        </Box>
        <Box sx={{ minWidth: { sm: 180 }, textAlign: { sm: "right" } }}>
          <Typography variant="body1" fontWeight={900} color="#4f46e5" role="timer" aria-label={expired ? "Trial expired" : "Trial time remaining"}>
            {expired ? "Trial expired" : time}
          </Typography>
          {!expired && <Typography variant="caption" color="#4338ca">remaining of 30 days</Typography>}
        </Box>
      </Stack>
      <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, (now - start) / TRIAL_DURATION_MS * 100))}
        sx={{ mt: 1.25, height: 5, borderRadius: 3, bgcolor: "#c7d2fe", "& .MuiLinearProgress-bar": { bgcolor: "#4f46e5" } }} />
    </Paper>
  );
}
