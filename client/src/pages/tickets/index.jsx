import { useEffect, useState } from "react";
import { Box, Button, Grid, Typography } from "@mui/material";
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
    <>
      <SmallHeader />
      <Box p={2} className="overlapping-header">
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
          <Typography variant="h6" fontSize={18} fontWeight={700}>
            Tickets Dashboard
          </Typography>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>
            Create ticket
          </Button>
        </Box>

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
          <Typography variant="body1" mt={2}>
            No tickets found.
          </Typography>
        )}

        {/* Super Admin → DataGrid */}
        {user.role === "Super Admin" ? (
          <TicketsGrid tickets={tickets} />
        ) : (
          <Grid container spacing={2} mt={2}>
            {tickets.map((ticket) => (
              <Grid key={ticket._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <TicketCard ticket={ticket} user={user} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </>
  );
};

export default TicketsDashboard;
