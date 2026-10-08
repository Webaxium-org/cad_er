import { useEffect, useRef, useState } from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { compactTitleSx, heroTitleSx } from "./pageHeaderStyles";

/** Shared Settings-style page hero with a compact header after half the hero scrolls away. */
export default function PageHeroHeader({ icon: Icon, title, subtitle, action }) {
  const heroRef = useRef(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const update = () => {
      const halfway = (heroRef.current?.offsetHeight || 0) / 2;
      setCompact(halfway > 0 && window.scrollY >= halfway);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const icon = Icon && <Icon size={32} style={{ flexShrink: 0, opacity: 0.9 }} />;
  return (
    <>
      <AnimatePresence>
        {compact && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            sx={{
              position: "fixed", top: { xs: 49, md: 65 }, left: 0, right: 0,
              zIndex: 1099, p: 2, color: "white",
              background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
              borderRadius: "0 0 20px 20px",
              boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.3)",
            }}
          >
            <Container maxWidth="lg">
              <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0 }}>
                {icon}
                <Typography fontWeight={900} sx={compactTitleSx} letterSpacing="-0.5px">
                  {title}
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
          pt: 10, pb: 10, color: "white", borderRadius: "0 0 20px 20px",
          boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.4)",
          position: "relative", mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box sx={{
              minWidth: 0,
              opacity: compact ? 0 : 1,
              transform: compact ? "translateY(-12px) scale(0.96)" : "none",
              transformOrigin: "left center",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={1} sx={{ minWidth: 0 }}>
                {icon}
                <Typography variant="h3" sx={heroTitleSx} fontWeight={900} letterSpacing="-0.02em">
                  {title}
                </Typography>
              </Stack>
              <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 500, fontWeight: 500 }}>
                {subtitle}
              </Typography>
            </Box>
            {action}
          </Stack>
        </Container>
      </Box>
    </>
  );
}
