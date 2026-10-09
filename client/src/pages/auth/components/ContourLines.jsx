import { Box } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { contourPaths } from "../contourBackground";

export default function ContourLines() {
  const reduceMotion = useReducedMotion();

  return (
    <Box
      component={motion.svg}
      viewBox="0 0 1200 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      animate={reduceMotion ? undefined : { scale: [1, 1.05, 1], rotate: [0, 1, 0] }}
      transition={reduceMotion ? undefined : { duration: 20, repeat: Infinity, ease: "linear" }}
      sx={{
        position: "absolute",
        inset: -100,
        width: "calc(100% + 200px)",
        height: "calc(100% + 200px)",
        opacity: 0.22,
        fill: "none",
        stroke: "white",
        strokeWidth: 1.3,
        maskImage: "radial-gradient(circle at center, black 30%, transparent 80%)",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      {contourPaths.map((path, index) => (
        <motion.path
          key={index}
          d={path}
          initial={reduceMotion ? false : { pathLength: 0, opacity: 1 }}
          animate={reduceMotion ? undefined : { pathLength: [0, 1, 1, 0], opacity: [1, 1, 1, 0] }}
          transition={reduceMotion ? undefined : {
            duration: 14,
            delay: index * 0.025,
            times: [0, 0.65, 0.9, 1],
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </Box>
  );
}
