import { Card, Typography, Box } from "@mui/material";
import { FaLock, FaPlay } from "react-icons/fa";

const VideoItem = ({ video, isPurchased }) => {
  return (
    <Card
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        height: "100%",
        cursor: isPurchased ? "pointer" : "default",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        "&:hover": {
          transform: isPurchased ? "translateY(-3px)" : "none",
          boxShadow: isPurchased ? "0 12px 30px rgba(0,0,0,0.15)" : "none",
        },
      }}
    >
      {/* Thumbnail */}
      <Box
        sx={{
          position: "relative",
          aspectRatio: "16 / 9",
          backgroundImage: `url(${video.thumbnail})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isPurchased ? (
            <FaPlay size={42} color="#fff" />
          ) : (
            <FaLock size={36} color="#fff" />
          )}
        </Box>

        {/* Duration */}
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            fontSize: 12,
            px: 0.8,
            py: 0.3,
            borderRadius: 1,
          }}
        >
          {video.duration}
        </Box>
      </Box>

      {/* Title */}
      <Box p={1.2}>
        <Typography
          fontWeight={600}
          fontSize={14}
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {video.title}
        </Typography>

        {!isPurchased && (
          <Typography fontSize={12} color="error.main" mt={0.3}>
            🔒 Locked – Unlock course to watch
          </Typography>
        )}
      </Box>
    </Card>
  );
};

export default VideoItem;
