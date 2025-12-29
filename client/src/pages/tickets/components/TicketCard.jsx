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
    <Card variant="outlined">
      <CardContent>
        <Typography fontWeight={700} fontSize="16px">
          {ticket.ticketNo} - {ticket.feedbackType}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Status:
          </Typography>
          <Chip label={ticket.status} color="primary" size="small" />
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
            sx={{ mt: 1 }}
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
