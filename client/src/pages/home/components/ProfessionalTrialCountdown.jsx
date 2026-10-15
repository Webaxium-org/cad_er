import { useEffect, useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

export default function ProfessionalTrialCountdown({ subscription }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const start = new Date(subscription.periodStart).getTime();
  const end = new Date(subscription.periodEnd).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  const remaining = Math.max(0, end - now);
  const expired = remaining === 0;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const time = `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;

  const projectLimit = subscription.projectLimit || 0;
  const projectCount = subscription.projectCount || 0;
  const available = Math.max(0, projectLimit - projectCount);
  const trialDays = Math.ceil((end - start) / 86400000);
  const progress = Math.min(100, Math.max(0, remaining / (end - start) * 100));

  return (
    <Paper elevation={0} sx={{ mb: 1.5, px: { xs: 1.75, sm: 2 }, py: { xs: 1.5, sm: 1.75 }, border: "1px solid #c7d2fe", borderRadius: 2, background: "linear-gradient(110deg, #fff 0%, #fafaff 65%, #f4f4ff 100%)", boxShadow: "0 6px 20px rgba(79,70,229,.06)" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "minmax(0,1fr) minmax(0,1fr)", lg: "minmax(0,1.35fr) minmax(0,.85fr) minmax(0,.95fr) auto" }, gap: { xs: 1.5, sm: 2 }, alignItems: "center" }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          <Box sx={{ width: 56, height: 56, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 1.5, bgcolor: "#eef2ff", color: "#5b55f4" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="1" /><path d="M2 6h20v4H2zM12 6v15M12 6C8 6 6 5 6 3.5 6 2.1 7 1.5 8.2 2c1.7.7 2.8 2.5 3.8 4ZM12 6c4 0 6-1 6-2.5 0-1.4-1-2-2.2-1.5C14.1 2.7 13 4.5 12 6Z" /></svg>
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 850, color: "#172554", lineHeight: 1.2 }}>Professional trial</Typography>
              <Box sx={{ px: 1, py: .3, borderRadius: 10, bgcolor: expired ? "#fee2e2" : "#dff8ed", color: expired ? "#b91c1c" : "#059669", fontSize: 12, fontWeight: 800 }}>{expired ? "Expired" : "● Active"}</Box>
            </Stack>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1e293b", mt: .4 }}>Explore CADer with {projectLimit} free projects.</Typography>
            <Typography sx={{ fontSize: 11, color: "#64748b", mt: .2 }}>Choose a plan to keep creating after your trial.</Typography>
          </Box>
        </Stack>

        <Box sx={{ minWidth: 0, pl: { lg: 2 }, borderLeft: { lg: "1px solid #dce2f2" } }}>
          <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Project allowance</Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 850, color: "#172554", mt: .15 }}>{projectCount} of {projectLimit} used</Typography>
          <Stack direction="row" spacing={.5} sx={{ mt: .6, maxWidth: 180 }}>
            {Array.from({ length: Math.min(projectLimit, 10) }, (_, index) => <Box key={index} sx={{ flex: 1, height: 8, borderRadius: 8, bgcolor: index < projectCount ? "#5b55f4" : "#dcdcff" }} />)}
          </Stack>
          <Typography sx={{ fontSize: 11, color: "#64748b", mt: .5 }}>{available} projects available</Typography>
        </Box>

        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0, pl: { lg: 2 }, borderLeft: { lg: "1px solid #dce2f2" } }}>
          <Box sx={{ width: 64, height: 64, flexShrink: 0, borderRadius: "50%", p: "6px", background: `conic-gradient(#5b55f4 ${progress}%, #dcdcff ${progress}% 100%)` }}>
            <Box sx={{ width: "100%", height: "100%", borderRadius: "50%", bgcolor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <Typography sx={{ fontSize: 20, fontWeight: 900, color: "#172554", lineHeight: 1 }}>{days}</Typography>
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#4338ca", mt: .25 }}>days left</Typography>
            </Box>
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: 11, color: "#4f46e5", fontWeight: 700 }}>of your {trialDays}-day trial</Typography>
            <Typography role="timer" aria-label="Trial time remaining" sx={{ color: expired ? "#b91c1c" : "#312e81", fontWeight: 900, fontSize: { xs: 13, sm: 14 }, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", mt: .2 }}>{expired ? "Trial expired" : time}</Typography>
          </Box>
        </Stack>
        <Button component={Link} to="/subscription" variant="contained" endIcon={<span aria-hidden="true">→</span>} sx={{ justifySelf: { xs: "stretch", sm: "start", lg: "end" }, bgcolor: "#5b55f4", textTransform: "none", whiteSpace: "nowrap", fontSize: 12, fontWeight: 800, borderRadius: 1.5, px: 1.75, py: 1, boxShadow: "0 5px 12px rgba(79,70,229,.22)", "&:hover": { bgcolor: "#4f46e5" } }}>Choose a plan</Button>
      </Box>
    </Paper>
  );
}
