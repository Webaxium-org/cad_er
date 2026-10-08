import React, { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Typography } from '@mui/material';
import { IoClose } from 'react-icons/io5';
import { SlTarget } from 'react-icons/sl';
import { useDispatch } from 'react-redux';
import { showAlert } from '../../../redux/alertSlice';

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    bgcolor: "#f8fafc",
    "& fieldset": { borderColor: "#e2e8f0" },
    "&:hover fieldset": { borderColor: "#6366f1" },
    "&.Mui-focused fieldset": { borderColor: "#6366f1" },
  },
  "& .MuiInputLabel-root": { fontWeight: 600, color: "#64748b" },
};

const CalibrationModal = ({ open, onClose }) => {
  const dispatch = useDispatch();

  const [readings, setReadings] = useState({
    a1: '',
    b1: '',
    a2: '',
    b2: ''
  });

  const handleChange = (e) => {
    setReadings({ ...readings, [e.target.name]: e.target.value });
  };

  const calculateError = () => {
    // If any is missing
    if (!readings.a1 || !readings.b1 || !readings.a2 || !readings.b2) {
      dispatch(
        showAlert({
          type: "error",
          message: "Please enter all readings required for the Two-Peg Test.",
        })
      );
      return;
    }

    const a1 = parseFloat(readings.a1);
    const b1 = parseFloat(readings.b1);
    const a2 = parseFloat(readings.a2);
    const b2 = parseFloat(readings.b2);

    // Delta true from midpoint
    const trueHeightDiff = a1 - b1;
    // Apparent delta from peg
    const apparentHeightDiff = a2 - b2;
    // Difference (Error)
    const error = apparentHeightDiff - trueHeightDiff;

    if (Math.abs(error) > 0.003) {
      dispatch(
        showAlert({
          type: "error",
          message: `Collimation Error: ${error.toFixed(4)}m. Instrument requires physical adjustment.`,
        })
      );
    } else {
      dispatch(
        showAlert({
          type: "success",
          message: `Collimation Error: ${error.toFixed(4)}m. Instrument is within acceptable limits!`,
        })
      );
    }

    onClose();
    setReadings({ a1: '', b1: '', a2: '', b2: '' }); // Reset
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="calibration-dialog-title">
      <DialogTitle sx={{ px: { xs: 3, sm: 4 }, pt: 4, pb: 2 }}>
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
            <SlTarget size={22} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography id="calibration-dialog-title" variant="h6" fontWeight={800} color="#1e293b">
              Auto Level Calibration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter Two-Peg Test readings to check instrument error.
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close calibration" size="small" sx={{ color: "#64748b" }}>
            <IoClose size={22} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 3, sm: 4 }, pb: 1 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" color="#6366f1" fontWeight={800} mb={1.5} letterSpacing="0.05em">
              SETUP 1 · MIDPOINT
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField fullWidth label="Peg A1 (m)" name="a1" type="number" value={readings.a1} onChange={handleChange} sx={fieldSx} />
              <TextField fullWidth label="Peg B1 (m)" name="b1" type="number" value={readings.b1} onChange={handleChange} sx={fieldSx} />
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="#6366f1" fontWeight={800} mb={1.5} letterSpacing="0.05em">
              SETUP 2 · NEAR PEG A
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField fullWidth label="Peg A2 (m)" name="a2" type="number" value={readings.a2} onChange={handleChange} sx={fieldSx} />
              <TextField fullWidth label="Peg B2 (m)" name="b2" type="number" value={readings.b2} onChange={handleChange} sx={fieldSx} />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 3, sm: 4 }, pb: 4, pt: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "12px", borderColor: "#cbd5e1", color: "#475569", fontWeight: 700, textTransform: "none", px: 3 }}>
          Cancel
        </Button>
        <Button onClick={calculateError} variant="contained" sx={{ borderRadius: "12px", bgcolor: "#6366f1", fontWeight: 800, textTransform: "none", px: 3, "&:hover": { bgcolor: "#4f46e5" } }}>
          Calculate error
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CalibrationModal;
