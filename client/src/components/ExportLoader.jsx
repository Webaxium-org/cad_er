import React from "react";
import {
  Backdrop,
  Typography,
  Stack,
  Box,
  LinearProgress,
  Paper,
  CircularProgress,
} from "@mui/material";
import { keyframes } from "@emotion/react";

// Keyframe for the pulsing file icon
const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

// Keyframe for the subtle shine effect on progress bar
const shine = keyframes`
  from { left: -100%; }
  to { left: 100%; }
`;

/**
 * Custom SVG Icons to avoid external dependency issues
 */
const FileTextIcon = ({ size = 32, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const DownloadIcon = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const ExportLoader = ({
  open = true,
  loader = "export",
  duration = 0,
  progress = null,
  progressMessage = "",
  estimatedTimeLeft = null,
}) => {
  const [timeLeft, setTimeLeft] = React.useState(duration);

  React.useEffect(() => {
    if (open) {
      setTimeLeft(duration);
    }
  }, [open, duration]);

  React.useEffect(() => {
    if (!open || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [open, timeLeft]);
  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 999,
        backgroundColor: "rgba(15, 23, 42, 0.7)", // Slate-900 with transparency
        backdropFilter: "blur(8px)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 320,
          width: "90%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Stack spacing={3} alignItems="center" sx={{ width: "100%" }}>
          {/* Animated Icon Container */}
          <Box
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
              animation: `${pulse} 2s infinite ease-in-out`,
            }}
          >
            {loader === "export" ? (
              <FileTextIcon size={32} color="white" />
            ) : (
              <Typography sx={{ color: "white", fontWeight: 600 }}>
                CADER
              </Typography>
            )}
            {loader === "export" && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  borderRadius: "50%",
                  p: 0.8,
                  display: "flex",
                  background: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                <DownloadIcon size={14} color="#6366f1" />
              </Box>
            )}
          </Box>

          <Stack spacing={1} alignItems="center">
            <Typography
              variant="h6"
              sx={{
                color: "white",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              {loader === "export"
                ? "PREMIERING PROJECT"
                : loader === "terrain"
                  ? "ENVISIONING TERRAIN"
                  : "INITIALISING CADER"}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.6)",
                textAlign: "center",
              }}
            >
              {loader === "export" && (progress !== null ? (progressMessage || "Preparing your document for download...") : "Preparing your document for download...")}
            </Typography>
            {loader === "export" && (
              <Typography
                variant="body2"
                sx={{
                  color: "#a5b4fc", // Premium light indigo
                  fontWeight: 600,
                  mt: 0.5,
                  textAlign: "center",
                }}
              >
                {progress !== null ? (
                  estimatedTimeLeft !== null ? (
                    estimatedTimeLeft > 0 ? (
                      estimatedTimeLeft >= 60 ? (
                        `Estimated Time Left: ~${Math.floor(estimatedTimeLeft / 60)}m ${estimatedTimeLeft % 60}s`
                      ) : (
                        `Estimated Time Left: ~${estimatedTimeLeft}s`
                      )
                    ) : (
                      "Finalizing document..."
                    )
                  ) : (
                    "Estimating remaining time..."
                  )
                ) : duration > 0 ? (
                  timeLeft > 0 ? `Estimated Time: ~${timeLeft}s` : "Finalizing document..."
                ) : null}
              </Typography>
            )}
          </Stack>

          {/* Custom Modern Progress Bar */}
          <Box sx={{ width: "100%", pt: 1 }}>
            <Box
              sx={{
                position: "relative",
                height: 6,
                borderRadius: 3,
                overflow: "hidden",
                bgcolor: "rgba(255,255,255,0.1)",
              }}
            >
              <LinearProgress
                variant={progress !== null ? "determinate" : "indeterminate"}
                value={progress !== null ? progress : undefined}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "transparent",
                  "& .MuiLinearProgress-bar": {
                    background: "linear-gradient(90deg, #6366f1, #a855f7)",
                  },
                }}
              />
              {/* Shine overlay */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "50%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  animation: `${shine} 1.5s infinite linear`,
                }}
              />
            </Box>
          </Box>

          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontSize: "0.65rem",
              fontWeight: 700,
            }}
          >
            Please wait a moment
          </Typography>
        </Stack>
      </Paper>
    </Backdrop>
  );
};

export default ExportLoader;
