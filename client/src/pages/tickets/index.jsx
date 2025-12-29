import { useEffect, useState } from "react";
import { Box, Grid, Typography } from "@mui/material";
import TicketCard from "./components/TicketCard";
import { useDispatch, useSelector } from "react-redux";
import { getAllTickets } from "../../services/ticketServices";
import { handleFormError } from "../../utils/handleFormError";
import { useNavigate } from "react-router-dom";
import { stopLoading } from "../../redux/loadingSlice";
import SmallHeader from "../../components/SmallHeader";

const TicketsDashboard = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);

  const [tickets, setTickets] = useState([]);

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
        <Typography variant="h6" fontSize={18} fontWeight={700}>
          Tickets Dashboard
        </Typography>

        {tickets.length === 0 && (
          <Typography variant="body1" mt={2}>
            No tickets found.
          </Typography>
        )}

        <Grid container spacing={2} mt={2}>
          {tickets.map((ticket) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={ticket._id}>
              <TicketCard ticket={ticket} user={user} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
};

export default TicketsDashboard;
