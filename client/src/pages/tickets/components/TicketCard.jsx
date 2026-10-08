import { Box, Button, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FiArrowUpRight, FiUser } from "react-icons/fi";
import TicketBadge from "./TicketBadge";

const TicketCard = ({ ticket, user }) => {
  const navigate = useNavigate();

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: "20px",
        borderColor: "#e2e8f0",
        boxShadow: "0 4px 16px rgba(15, 23, 42, 0.03)",
        bgcolor: "#fff",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: "#a5b4fc",
          boxShadow: "0 12px 30px rgba(99, 102, 241, 0.1)",
        },
      }}
    >
      <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", "&:last-child": { pb: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" fontWeight={900} letterSpacing="0.08em" color="#6366f1">
              {ticket.ticketNo || "TICKET"}
            </Typography>
            <Typography variant="h6" fontWeight={800} color="#1e293b" sx={{ mt: 0.5, lineHeight: 1.25, overflowWrap: "anywhere" }}>
              {ticket.feedbackType || "Support request"}
            </Typography>
          </Box>
          <TicketBadge value={ticket.status} />
        </Stack>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, mb: 2.5, minHeight: 40, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflowWrap: "anywhere" }}
        >
          {ticket.description || "No message provided."}
        </Typography>

        <Divider sx={{ mt: "auto", mb: 2, borderColor: "#eef2f7" }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
          <TicketBadge value={ticket.priority} kind="priority" />
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
            <FiUser size={14} color="#94a3b8" />
            <Typography variant="caption" color="#64748b" fontWeight={600} noWrap>
              {ticket.createdBy?.name || "Unknown user"}
            </Typography>
          </Stack>
        </Stack>

        {user?.role === "Super Admin" && (
          <Button
            variant="outlined"
            endIcon={<FiArrowUpRight />}
            onClick={() => navigate("/tickets/" + ticket._id + "/followup")}
            sx={{ mt: 2.5, borderRadius: "12px", borderColor: "#c7d2fe", color: "#4f46e5", fontWeight: 800, textTransform: "none", "&:hover": { borderColor: "#6366f1", bgcolor: "#eef2ff" } }}
          >
            View followups
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketCard;
