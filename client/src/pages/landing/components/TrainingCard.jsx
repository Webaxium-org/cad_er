import { Box, Paper, Typography } from "@mui/material";

const TrainingCard = ({ icon, title, description }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 4,
      bgcolor: "#fff",
      border: "1px solid rgba(0,0,0,0.06)",
      transition: "all 0.3s ease",
      "&:hover": {
        transform: "translateY(-5px)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.04)",
        borderColor: "#4f46e5",
      },
    }}
  >
    <Box sx={{ color: "#4f46e5", mb: 2 }}>{icon}</Box>
    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: "#111" }}>
      {title}
    </Typography>
    <Typography
      variant="body2"
      sx={{ color: "text.secondary", lineHeight: 1.6 }}
    >
      {description}
    </Typography>
  </Paper>
);

export default TrainingCard;
