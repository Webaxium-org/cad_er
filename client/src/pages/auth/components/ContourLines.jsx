import { Box } from "@mui/material";
import { contourPaths } from "../contourBackground";

export default function ContourLines({ light = false }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 1200 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      sx={{
        position: "absolute",
        inset: -100,
        width: "calc(100% + 200px)",
        height: "calc(100% + 200px)",
        opacity: light ? 0.62 : 0.22,
        fill: "none",
        stroke: light ? "#b4baff" : "white",
        strokeWidth: 1.3,
        maskImage: light ? "none" : "radial-gradient(circle at center, black 30%, transparent 80%)",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      {contourPaths.map((path, index) => (
        <path
          key={index}
          d={path}
        />
      ))}
    </Box>
  );
}
