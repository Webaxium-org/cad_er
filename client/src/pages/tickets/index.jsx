import { useEffect, useState } from "react";
import { Box, Button, Grid, Paper, Stack, Typography } from "@mui/material";
import TicketCard from "./components/TicketCard";
import { useDispatch, useSelector } from "react-redux";
import { getAllTickets } from "../../services/ticketServices";
import { handleFormError } from "../../utils/handleFormError";
import { useNavigate } from "react-router-dom";
import { stopLoading } from "../../redux/loadingSlice";
import SmallHeader from "../../components/SmallHeader";
import TicketsGrid from "./components/TicketsGrid";
import CreateTicket from "./components/CreateTicket";
import AlertDialogSlide from "../../components/AlertDialogSlide";

const TicketsDashboard = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);

  const [tickets, setTickets] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      const { data } = await getAllTickets();
      setTickets(data.tickets || []);
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <SmallHeader />
      <Box sx={{ maxWidth: "1200px", mx: "auto", p: { xs: 2, md: 4 } }}>
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: "28px", bgcolor: "#fff", border: "1px solid rgba(226, 232, 240, 0.8)", position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "linear-gradient(90deg, #4f46e5 0%, #0ea5e9 100%)" }} />
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={2} sx={{ mb: 3 }}>
            <Box>
              <Typography variant="overline" sx={{ color: "#6366f1", fontWeight: 800, letterSpacing: "0.12em" }}>SUPPORT</Typography>
              <Typography variant="h5" sx={{ color: "#1e293b", fontWeight: 800, lineHeight: 1.2 }}>Tickets</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Track requests and followups in one place</Typography>
            </Box>
            <Button variant="contained" onClick={() => setCreateOpen(true)} sx={{ bgcolor: "#6366f1", borderRadius: "12px", px: 2.5, py: 1.2, fontWeight: 700, textTransform: "none", boxShadow: "none", "&:hover": { bgcolor: "#4f46e5", boxShadow: "none" } }}>
              Create ticket
            </Button>
          </Stack>

        <AlertDialogSlide
          title="Create ticket"
          open={createOpen}
          onCancel={() => setCreateOpen(false)}
          content={createOpen && <CreateTicket onClose={(ticket) => {
            setCreateOpen(false);
            if (ticket?._id) setTickets((current) => [ticket, ...current]);
          }} />}
        />

          {tickets.length === 0 && (
            <Box sx={{ py: 4, textAlign: "center", bgcolor: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "16px" }}>
              <Typography variant="body1" color="text.secondary">No tickets found.</Typography>
            </Box>
          )}

        {/* Super Admin → DataGrid */}
          {user.role === "Super Admin" ? (
            <TicketsGrid tickets={tickets} />
          ) : (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              {tickets.map((ticket) => (
                <Grid key={ticket._id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <TicketCard ticket={ticket} user={user} />
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default TicketsDashboard;
