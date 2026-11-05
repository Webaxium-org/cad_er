import { useEffect, useRef, useState } from "react";
import { Box, Container, IconButton, Stack, Typography } from "@mui/material";
import { MdArrowBackIosNew } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
import { compactTitleSx, heroTitleSx } from "./pageHeaderStyles";

/** Shared Settings-style page hero with a compact header after half the hero scrolls away. */
export default function PageHeroHeader({ icon: Icon, title, subtitle, action, compactTitle, compactSubtitle, onBack, backButtonSx = {}, onCompactHeightChange, enableCompact = true, keepActionInline = false }) {
  const heroRef = useRef(null);
  const compactRef = useRef(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const update = () => {
      const halfway = (heroRef.current?.offsetHeight || 0) / 2;
      setCompact(enableCompact && halfway > 0 && window.scrollY >= halfway);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [enableCompact]);

  useEffect(() => {
    if (!onCompactHeightChange) return;
    if (!compact) { onCompactHeightChange(0); return; }
    const node = compactRef.current;
    if (!node) return;
    const update = () => onCompactHeightChange(node.offsetHeight);
    const observer = new ResizeObserver(update);
    observer.observe(node);
    update();
    return () => observer.disconnect();
  }, [compact, onCompactHeightChange]);

  const icon = onBack ? <IconButton onClick={onBack} aria-label="Go back" sx={{ color: "inherit", bgcolor: "rgba(255,255,255,0.12)", flexShrink: 0, "&:hover": { bgcolor: "rgba(255,255,255,0.22)" }, ...backButtonSx }}><MdArrowBackIosNew size={22} /></IconButton>
    : Icon && <Icon size={32} style={{ flexShrink: 0, opacity: 0.9 }} />;
  return (
    <>
      <AnimatePresence>
        {compact && (
          <Box
            ref={compactRef}
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
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0, flex: 1 }}>
                  {icon && <Box sx={{ display: action && !onBack ? { xs: "none", sm: "flex" } : "flex" }}>{icon}</Box>}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={900} sx={compactTitleSx} letterSpacing="-0.5px">{compactTitle || title}</Typography>
                    {compactSubtitle && <Typography variant="body2" sx={{ mt: 0.25, opacity: 0.85, lineHeight: 1.3 }}>{compactSubtitle}</Typography>}
                  </Box>
                </Stack>
                {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
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
          <Stack direction="row" alignItems={keepActionInline ? "flex-start" : "center"} justifyContent="space-between" flexWrap={keepActionInline ? "nowrap" : "wrap"} gap={2}>
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
            {action && <Box sx={{ flexShrink: 0, visibility: compact ? "hidden" : "visible" }}>{action}</Box>}
          </Stack>
        </Container>
      </Box>
    </>
  );
}
