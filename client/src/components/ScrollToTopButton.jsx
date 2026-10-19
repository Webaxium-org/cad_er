import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { Fab, Box, useTheme, Zoom } from "@mui/material";

const ChevronUpIcon = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m18 15-6-6-6 6" />
  </svg>
);

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { scrollYProgress } = useScroll();

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.5, rotate: -45 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, y: 40, scale: 0.5, rotate: 45 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            zIndex: 1000,
            cursor: "pointer",
          }}
        >
          <Box
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <motion.svg
              animate={{
                rotate: isHovered ? 270 : -90,
                scale: isHovered ? 0.5 : 1,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              style={{
                position: "absolute",
                width: "64px",
                height: "64px",
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="transparent"
                stroke="#cbd5e1"
                strokeWidth="2"
                style={{ opacity: 0.3 }}
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                fill="transparent"
                stroke="#4f46e5"
                strokeWidth="3"
                strokeLinecap="round"
                style={{ pathLength: smoothProgress }}
              />
            </motion.svg>

            <Fab
              size="medium"
              onClick={scrollToTop}
              sx={{
                width: "48px",
                height: "48px",
                bgcolor: "#4f46e5",
                color: "white",
                boxShadow: isHovered
                  ? "0px 12px 24px rgba(79, 70, 229, 0.4)"
                  : "0px 4px 10px rgba(0,0,0,0.1)",
                "&:hover": { bgcolor: "#4338ca" },
              }}
            >
              <motion.div
                animate={
                  isHovered
                    ? {
                        y: [-2, -8, -2],
                        transition: { repeat: Infinity, duration: 0.6 },
                      }
                    : {
                        y: [0, -3, 0],
                        transition: {
                          repeat: Infinity,
                          duration: 2,
                          ease: "easeInOut",
                        },
                      }
                }
                style={{ display: "flex" }}
              >
                <ChevronUpIcon size={28} />
              </motion.div>
            </Fab>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
