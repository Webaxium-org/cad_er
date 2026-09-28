import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const TicketCard = ({ ticket, user }) => {
  const navigate = useNavigate();

  const handleFollowup = () => {
    navigate(`/tickets/${ticket._id}/followup`);
  };

  return (
    <Card variant="outlined" sx={{ height: "100%", borderRadius: "18px", borderColor: "#e2e8f0", boxShadow: "none", bgcolor: "#fff" }}>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Typography fontWeight={800} fontSize="16px" color="#1e293b" mb={2}>
          {ticket.ticketNo} - {ticket.feedbackType}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Status:
          </Typography>
          <Chip label={ticket.status} color="primary" size="small" sx={{ fontWeight: 700 }} />
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Priority:
          </Typography>
          {ticket.priority}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Created By:
          </Typography>
          {ticket.createdBy?.name}
        </Stack>

        {/* Admin Button to go to followup */}
        {user.role === "Super Admin" && (
          <Button
            variant="contained"
            color="secondary"
            size="small"
            sx={{ mt: 1, borderRadius: "10px", textTransform: "none", boxShadow: "none" }}
            onClick={handleFollowup}
          >
            Followups
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketCard;
