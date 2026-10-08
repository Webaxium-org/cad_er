import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Container, Paper, Stack } from "@mui/material";
import { FiTrash2 } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import BigHeader from "../../components/BigHeader";
import { heroTitleSx, compactTitleSx } from "../../components/pageHeaderStyles";

const BG_COLOR = "#f8fafc";

export default function Trash() {
  const heroRef = useRef(null);
  const [compactHeaderVisible, setCompactHeaderVisible] = useState(false);

  useEffect(() => {
    const updateCompactHeader = () => {
      const halfway = (heroRef.current?.offsetHeight || 0) / 2;
      setCompactHeaderVisible(window.scrollY >= halfway && halfway > 0);
    };
    updateCompactHeader();
    window.addEventListener("scroll", updateCompactHeader, { passive: true });
    window.addEventListener("resize", updateCompactHeader);
    return () => {
      window.removeEventListener("scroll", updateCompactHeader);
      window.removeEventListener("resize", updateCompactHeader);
    };
  }, []);

  return (
    <Box sx={{ bgcolor: BG_COLOR, minHeight: "100vh", pb: 8 }}>
      <BigHeader />
      <AnimatePresence>
        {compactHeaderVisible && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            sx={{
              position: "fixed",
              top: { xs: 49, md: 65 },
              left: 0,
              right: 0,
              zIndex: 1099,
              p: 2,
              color: "white",
              background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
              borderRadius: "0 0 20px 20px",
              boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.3)",
            }}
          >
            <Container maxWidth="lg">
              <Stack direction="row" alignItems="center" spacing={2}>
                <FiTrash2 size={32} opacity={0.9} style={{ flexShrink: 0 }} />
                <Typography fontWeight={900} sx={compactTitleSx} letterSpacing="-0.5px">
                  Trash
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
          pt: 10,
          pb: 10,
          color: "white",
          borderRadius: "0 0 20px 20px",
          boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.4)",
          position: "relative",
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              opacity: compactHeaderVisible ? 0 : 1,
              transform: compactHeaderVisible ? "translateY(-12px) scale(0.96)" : "none",
              transformOrigin: "left center",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={1}>
              <FiTrash2 size={32} opacity={0.9} style={{ flexShrink: 0 }} />
              <Typography variant="h3" sx={heroTitleSx} fontWeight={900} letterSpacing="-0.02em">
                Trash
              </Typography>
            </Stack>
            <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 500, fontWeight: 500 }}>
              Review deleted items before permanent removal.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: -8, position: "relative" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 8 },
              borderRadius: "32px",
              textAlign: "center",
              border: "2px dashed #cbd5e1",
              bgcolor: "rgba(255, 255, 255, 0.5)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 10px 40px -20px rgba(0,0,0,0.05)",
            }}
          >
            <Stack alignItems="center" spacing={3}>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    bgcolor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                  }}
                >
                  <FiTrash2 size={56} />
                </Box>
              </motion.div>
              <Box>
                <Typography variant="h4" fontWeight={900} color="#1e293b" mb={1}>
                  Trash is Empty
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  fontWeight={500}
                  sx={{ maxWidth: 400, mx: "auto" }}
                >
                  Any field notes, components, or files you delete will temporarily
                  reside here before permanent removal.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}
