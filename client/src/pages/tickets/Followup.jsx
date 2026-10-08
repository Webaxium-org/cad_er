import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Typography,
  Box,
  Button,
  Paper,
  Chip,
  Stack,
} from "@mui/material";
import { handleFormError } from "../../utils/handleFormError";
import { stopLoading } from "../../redux/loadingSlice";
import { useDispatch } from "react-redux";
import {
  getTicketById,
  getTicketImageUrl,
  updateTicketStatus,
} from "../../services/ticketServices";
import SmallHeader from "../../components/SmallHeader";
import BasicSelect from "../../components/BasicSelect";
import BasicInput from "../../components/BasicInput";
import { showAlert } from "../../redux/alertSlice";
import { MdArrowBackIosNew } from "react-icons/md";

const Followup = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { id } = useParams();

  const [ticket, setTicket] = useState(null);

  const [status, setStatus] = useState("");

  const [message, setMessage] = useState("");

  const [postponedUntil, setPostponedUntil] = useState("");

  const handleFollowupSubmit = async () => {
    try {
      const payload = {
        status,
        message,
      };

      if (status === "POSTPONED") {
        payload.postponedUntil = postponedUntil;
      }

      const { data } = await updateTicketStatus(id, payload);
      const ticketData = data.ticket;

      setTicket(ticketData);
      setStatus(ticketData.status);
      setMessage("");
      setPostponedUntil("");

      dispatch(
        showAlert({
          type: "success",
          message: "Followup added successfully",
        })
      );
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    }
  };

  const fetchTicket = async () => {
    try {
      const { data } = await getTicketById(id);

      const ticketData = data.ticket;

      setTicket(ticketData);
      setStatus(ticketData.status);
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const openImage = async (imageId) => {
    const tab = window.open("", "_blank");
    try {
      const { data } = await getTicketImageUrl(id, imageId);
      if (tab) {
        tab.opener = null;
        tab.location.href = data.url;
      }
    } catch (error) {
      tab?.close();
      handleFormError(error, null, dispatch, navigate);
    }
  };

  if (!ticket) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <SmallHeader />

      <Box sx={{ maxWidth: "1200px", mx: "auto", p: { xs: 2, md: 4 } }}>
        {/* Ticket Header */}
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 2, borderRadius: "28px", border: "1px solid #e2e8f0", borderLeftColor: "#6366f1", position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", bgcolor: "#6366f1" }} />
          <Stack direction="row" alignItems="flex-start" spacing={1.5}>
            <Button onClick={() => navigate(-1)} sx={{ minWidth: 40, width: 40, height: 40, p: 0, borderRadius: "12px", bgcolor: "#f1f5f9", color: "#334155", "&:hover": { bgcolor: "#e2e8f0" } }} aria-label="Back to tickets">
              <MdArrowBackIosNew fontSize={18} />
            </Button>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: "#6366f1", fontWeight: 800, letterSpacing: "0.12em" }}>TICKET FOLLOWUP</Typography>
              <Typography variant="h5" sx={{ color: "#1e293b", fontWeight: 800, lineHeight: 1.2 }}>{ticket.ticketNo} - {ticket.feedbackType}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Review updates and add a followup</Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
            <Chip label={`Status: ${ticket.status}`} color="primary" sx={{ fontWeight: 700 }} />
            <Chip label={`Priority: ${ticket.priority}`} color="warning" sx={{ fontWeight: 700 }} />
          </Stack>
          {ticket.images?.length > 0 && (
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
              {ticket.images.map((image, index) => (
                <Button key={image._id} variant="outlined" onClick={() => openImage(image._id)}>
                  {image.name || `Image ${index + 1}`}
                </Button>
              ))}
            </Stack>
          )}
        </Paper>

        {/* Add Followup Section */}
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: "20px", border: "1px solid #e2e8f0" }}>
          <Typography variant="h6" sx={{ color: "#1e293b", fontWeight: 800, mb: 2 }}>
            Add Followup
          </Typography>

          <Stack spacing={2}>
            <BasicSelect
              label="Status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { label: "Open", value: "OPEN" },
                { label: "In progress", value: "IN_PROGRESS" },
                { label: "Postponed", value: "POSTPONED" },
                { label: "Resolved", value: "RESOLVED" },
                // { label: "Reopened", value: "REOPENED" },
              ]}
            />

            {status === "POSTPONED" && (
              <BasicInput
                type="date"
                label="Postponed Until"
                value={postponedUntil}
                onChange={(e) => setPostponedUntil(e.target.value)}
              />
            )}

            <BasicInput
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter followup message"
              multiline
              minRows={3}
            />

            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={handleFollowupSubmit}
                disabled={!status || !message}
                sx={{ borderRadius: "12px", bgcolor: "#6366f1", textTransform: "none", fontWeight: 700, boxShadow: "none", "&:hover": { bgcolor: "#4f46e5", boxShadow: "none" } }}
              >
                Submit Followup
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Followup Timeline */}
        <Typography variant="h6" sx={{ color: "#1e293b", fontWeight: 800, mb: 2 }}>
          Followup History
        </Typography>

        <Stack spacing={1.5}>
          {ticket?.followups?.reverse()?.map((f, i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{ p: { xs: 2, sm: 2.5 }, border: "1px solid #e2e8f0", borderRadius: "16px", boxShadow: "none" }}
            >
              <Stack spacing={0.5}>
                <Stack direction={{ xs: "column", sm: "row" }} gap={1} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
                  <Chip
                    size="small"
                    label={f.status}
                    color={
                      f.status === "RESOLVED"
                        ? "success"
                        : f.status === "POSTPONED"
                        ? "warning"
                        : "default"
                    }
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(f.createdAt).toLocaleString()}
                  </Typography>
                </Stack>

                <Typography variant="body2">{f.message}</Typography>

                <Typography variant="caption" color="text.secondary">
                  By {f.user?.name}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default Followup;
