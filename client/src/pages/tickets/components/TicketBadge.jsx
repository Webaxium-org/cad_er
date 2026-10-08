import { Box, Chip, Stack } from "@mui/material";

const statusStyles = {
  OPEN: { label: "Open", color: "#047857", background: "#ecfdf5", dot: "#10b981" },
  IN_PROGRESS: { label: "In progress", color: "#4338ca", background: "#eef2ff", dot: "#6366f1" },
  POSTPONED: { label: "Postponed", color: "#b45309", background: "#fffbeb", dot: "#f59e0b" },
  RESOLVED: { label: "Resolved", color: "#475569", background: "#f1f5f9", dot: "#94a3b8" },
};

const priorityStyles = {
  LOW: { label: "Low priority", color: "#047857", background: "#ecfdf5", dot: "#10b981" },
  MEDIUM: { label: "Medium priority", color: "#b45309", background: "#fffbeb", dot: "#f59e0b" },
  HIGH: { label: "High priority", color: "#c2410c", background: "#fff7ed", dot: "#f97316" },
  URGENT: { label: "Urgent", color: "#b91c1c", background: "#fef2f2", dot: "#ef4444" },
};

export default function TicketBadge({ value, kind = "status" }) {
  const normalized = String(value || "").toUpperCase().replace(/\s+/g, "_");
  const styles = kind === "priority" ? priorityStyles : statusStyles;
  const fallbackLabel = String(value || "Unknown").replace(/_/g, " ");
  const style = styles[normalized] || {
    label: fallbackLabel,
    color: "#475569",
    background: "#f1f5f9",
    dot: "#94a3b8",
  };

  return (
    <Chip
      size="small"
      label={
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: style.dot }} />
          <span>{style.label}</span>
        </Stack>
      }
      sx={{
        height: 26,
        borderRadius: "999px",
        bgcolor: style.background,
        color: style.color,
        fontWeight: 800,
        fontSize: "0.75rem",
        border: "1px solid " + style.dot + "33",
        "& .MuiChip-label": { px: 1.25 },
      }}
    />
  );
}
