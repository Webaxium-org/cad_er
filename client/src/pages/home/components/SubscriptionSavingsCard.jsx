import { Box, Paper, Stack, Typography } from "@mui/material";
import { FiTag } from "react-icons/fi";
import { DASHBOARD_CARD_RADIUS } from "./dashboardStyles";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2,
});

export default function SubscriptionSavingsCard({ totalSavingsPaise }) {
  const savings = totalSavingsPaise == null ? "\u2014" : currency.format(totalSavingsPaise / 100);
  const longAmount = savings.length > 12;
  return (
    <Paper component="section" aria-label="Subscription savings" elevation={0}
      sx={{
        position: "relative", overflow: "hidden", isolation: "isolate",
        borderRadius: DASHBOARD_CARD_RADIUS, mb: 1.25, p: { xs: 2, sm: 2.5 },
        color: "#142048", border: "1px solid #b9bbff",
        background: "linear-gradient(110deg, #eef0ff 0%, #f5f5ff 65%, #e4e7ff 100%)",
        boxShadow: "0 8px 28px rgba(89, 92, 242, .12)",
        "&::before": {
          content: '""', position: "absolute", inset: "0 auto 0 0",
          width: 5, bgcolor: "#595cf2",
        },
      }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2.5, sm: 3.5, md: 5 }}
        alignItems={{ xs: "stretch", sm: "center" }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box aria-hidden="true" sx={{
              width: 36, height: 36, flexShrink: 0, borderRadius: "11px",
              display: "grid", placeItems: "center", color: "#fff",
              bgcolor: "#595cf2", boxShadow: "0 4px 10px rgba(89, 92, 242, .2)",
            }}><FiTag size={19} /></Box>
            <Typography component="h2" sx={{ fontSize: 16, fontWeight: 750, color: "#142048" }}>
              Total savings
            </Typography>
          </Stack>
          <Typography component="p" sx={{
            mt: 1.5, fontSize: {
              xs: longAmount ? "1.75rem" : "2.5rem",
              sm: longAmount ? "2rem" : "2.75rem",
              md: longAmount ? "2.5rem" : "3rem",
            },
            fontWeight: 850, lineHeight: 1.12, letterSpacing: "-.04em",
            fontVariantNumeric: "tabular-nums", color: "#595cf2", overflowWrap: "anywhere",
          }}>
            {savings}
          </Typography>
        </Box>
        <Box sx={{
          minWidth: 0, flex: 1, pt: { xs: 2.5, sm: 0 }, pl: { xs: 0, sm: 3.5, md: 5 },
          borderTop: { xs: "1px solid #c7d2fe", sm: 0 },
          borderLeft: { xs: 0, sm: "1px solid #c7d2fe" },
        }}>
          <Typography sx={{ fontSize: { xs: 14, md: 16 }, fontWeight: 750, lineHeight: 1.35, maxWidth: 320 }}>
            Saved on your subscriptions
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 12, lineHeight: 1.6, color: "#667795" }}>
            Excludes GST and processing fees.
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}


