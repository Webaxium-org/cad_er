import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Typography,
  Card,
  CardContent,
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
  updateTicketStatus,
} from "../../services/ticketServices";
import SmallHeader from "../../components/SmallHeader";
import BasicSelect from "../../components/BasicSelect";
import BasicInput from "../../components/BasicInput";
import { showAlert } from "../../redux/alertSlice";

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

  if (!ticket) return <Typography>Loading...</Typography>;

  return (
    <>
      <SmallHeader />

      <Box p={2} className="overlapping-header">
        {/* Ticket Header */}
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={700} fontSize="16px">
            {ticket.ticketNo} - {ticket.feedbackType}
          </Typography>

          <Stack direction="row" spacing={2} mt={1}>
            <Chip label={`Status: ${ticket.status}`} color="primary" />
            <Chip label={`Priority: ${ticket.priority}`} color="warning" />
          </Stack>
        </Paper>

        {/* Add Followup Section */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography fontWeight={700} fontSize="16px">
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
                { label: "Reopened", value: "REOPENED" },
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
              >
                Submit Followup
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Followup Timeline */}
        <Typography fontWeight={700} fontSize="16px" gutterBottom>
          Followup History
        </Typography>

        <Stack spacing={1}>
          {ticket?.followups?.reverse()?.map((f, i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{ p: 2, border: "1px solid #eee" }}
            >
              <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between">
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
    </>
  );
};

export default Followup;
