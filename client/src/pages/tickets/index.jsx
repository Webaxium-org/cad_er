import { useEffect, useRef, useState } from "react";
import { Box, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import TicketCard from "./components/TicketCard";
import { useDispatch, useSelector } from "react-redux";
import { getAllTickets } from "../../services/ticketServices";
import { handleFormError } from "../../utils/handleFormError";
import { useNavigate } from "react-router-dom";
import { stopLoading } from "../../redux/loadingSlice";
import SmallHeader from "../../components/SmallHeader";
import { heroTitleSx, compactTitleSx } from "../../components/pageHeaderStyles";
import TicketsGrid from "./components/TicketsGrid";
import CreateTicket from "./components/CreateTicket";
import AlertDialogSlide from "../../components/AlertDialogSlide";
import { FiMessageSquare, FiPlus } from "react-icons/fi";
import BasicButton from "../../components/BasicButton";
import { capsuleShellSx } from "../../components/bottomIslandStyles";
import { AnimatePresence, motion } from "framer-motion";

const TicketsDashboard = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);

  const [tickets, setTickets] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const heroRef = useRef(null);
  const [compactHeaderVisible, setCompactHeaderVisible] = useState(false);

  useEffect(() => {
    const updateCompactHeader = () => {
      const halfway = (heroRef.current?.offsetHeight || 0) / 2;
      setCompactHeaderVisible(window.scrollY >= halfway && halfway > 0);
    };
    updateCompactHeader();
    window.addEventListener("scroll", updateCompactHeader, { passive: true });
    window.addEventListener("resize", updateCompactHeader);
    return () => {
      window.removeEventListener("scroll", updateCompactHeader);
      window.removeEventListener("resize", updateCompactHeader);
    };
  }, []);

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
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", pb: { xs: 20, md: 24 } }}>
      <SmallHeader />
      <AnimatePresence>
        {compactHeaderVisible && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            sx={{
              position: "fixed",
              top: { xs: 49, md: 65 },
              left: 0,
              right: 0,
              zIndex: 1099,
              p: 2,
              color: "white",
              background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
              borderRadius: "0 0 20px 20px",
              boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.3)",
            }}
          >
            <Container maxWidth="lg">
              <Stack direction="row" alignItems="center" spacing={2}>
                <FiMessageSquare size={32} opacity={0.9} style={{ flexShrink: 0 }} />
                <Typography fontWeight={900} sx={compactTitleSx} letterSpacing="-0.5px">
                  Support <span style={{ color: "#c7d2fe" }}>Tickets</span>
                </Typography>
              </Stack>
            </Container>
          </Box>
        )}
      </AnimatePresence>
      <Box
        ref={heroRef}
        sx={{
          background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
          pt: 10,
          pb: 10,
          color: "white",
          borderRadius: "0 0 20px 20px",
          boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.4)",
          position: "relative",
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              opacity: compactHeaderVisible ? 0 : 1,
              transform: compactHeaderVisible ? "translateY(-12px) scale(0.96)" : "none",
              transformOrigin: "left center",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={1}>
              <FiMessageSquare size={32} opacity={0.9} style={{ flexShrink: 0 }} />
              <Typography variant="h3" sx={heroTitleSx} fontWeight={900} letterSpacing="-0.02em">
                Support <span style={{ color: "#c7d2fe" }}>Tickets</span>
              </Typography>
            </Stack>
            <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 500, fontWeight: 500 }}>
              Track requests and followups in one place.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -8, position: "relative" }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: "20px",
            bgcolor: "#fff",
            border: "1px solid #e2e8f0",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              width: 6,
              height: "100%",
              bgcolor: "#6366f1",
            },
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={800} color="#1e293b">
              Your Requests
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              {tickets.length} total
            </Typography>
          </Stack>
          {tickets.length === 0 && (
            <Box sx={{ py: 4, textAlign: "center", bgcolor: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "16px" }}>
              <Typography variant="body1" color="text.secondary">No tickets found.</Typography>
            </Box>
          )}
          {user?.role === "Super Admin" ? (
            <TicketsGrid tickets={tickets} />
          ) : (
            <Grid container spacing={2}>
              {tickets.map((ticket) => (
                <Grid key={ticket._id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <TicketCard ticket={ticket} user={user} />
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Container>
      <Box
        sx={{
          position: "fixed",
          bottom: { xs: 24, md: 32 },
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        <Container maxWidth="sm" sx={{ pointerEvents: "none" }}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ width: "100%", pointerEvents: "auto" }}
          >
            <BasicButton
              value={
                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                  <FiPlus fontSize="22px" />
                  <Typography fontSize="1.1rem" fontWeight={900} letterSpacing="0.05em">
                    CREATE TICKET
                  </Typography>
                </Stack>
              }
              sx={{
                background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                color: "white",
                 height: capsuleShellSx.height,
                borderRadius: "24px",
                border: "none",
                boxShadow: "0 15px 35px -5px rgba(99, 102, 241, 0.5)",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)",
                  boxShadow: "0 20px 40px -5px rgba(99, 102, 241, 0.6)",
                },
              }}
              fullWidth={true}
              onClick={() => setCreateOpen(true)}
            />
          </motion.div>
        </Container>
      </Box>
      <AlertDialogSlide
          title={
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  bgcolor: "#6366f115",
                  color: "#6366f1",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <FiMessageSquare size={22} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#1e293b">
                  Create ticket
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Share a request or report an issue.
                </Typography>
              </Box>
            </Stack>
          }
          paperSx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            bgcolor: "#fff",
            boxShadow: "0 24px 64px rgba(15, 23, 42, 0.2)",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              width: 6,
              height: "100%",
              bgcolor: "#6366f1",
            },
            "& .MuiDialogTitle-root": { px: { xs: 3, sm: 4 }, pt: 4, pb: 2 },
            "& .MuiDialogContent-root": { px: { xs: 3, sm: 4 }, pb: 4 },
          }}
          open={createOpen}
          onCancel={() => setCreateOpen(false)}
          content={createOpen && <CreateTicket onClose={(ticket) => {
            setCreateOpen(false);
            if (ticket?._id) setTickets((current) => [ticket, ...current]);
          }} />}
        />
    </Box>
  );
};

export default TicketsDashboard;
