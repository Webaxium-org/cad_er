import React, { useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Paper,
  CssBaseline,
  Grid,
} from "@mui/material";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { publicHeroMotion, publicCardContainerVariants, publicCardVariants } from "../../components/publicMotion";
import ScrollToTop from "../../components/ScrollToTop";
import { publicEyebrowSx, publicHeroTitleSx, publicHeroLeadSx } from "../../components/publicTypography";
import { useNavigate } from "react-router-dom";

const CustomIcons = {
  Thunderbolt: () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  Safety: () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Solution: () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  Read: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
};

const fadeInUp = publicCardVariants;
const staggerContainer = publicCardContainerVariants;

const About = () => {
  const containerRef = useRef(null);

  const navigate = useNavigate();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothYProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const yBg = useTransform(smoothYProgress, [0, 1], ["0%", "10%"]);

  return (
    <>
      <ScrollToTop />
      <Box
        ref={containerRef}
        sx={{
          backgroundColor: "#ffffff",
          minHeight: "100vh",
          position: "relative",
          overflowX: "hidden",
        }}
      >
        <CssBaseline />

        {/* Background Elements */}
        {/* <Box
          component={motion.div}
          style={{ y: yBg }}
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            opacity: 0.03,
            pointerEvents: "none",
            backgroundImage: `url(${BackgroundImage})`,
            backgroundRepeat: "repeat",
            willChange: "transform",
          }}
        /> */}

        <Box sx={{ position: "relative", zIndex: 1 }}>
          {/* Hero Section */}
          <Container component={motion.div} {...publicHeroMotion} maxWidth="lg" sx={{ pt: { xs: 8, md: 15 }, pb: 8 }}>
            <Grid container spacing={8} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack
                  component={motion.div}
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  spacing={4}
                >
                  <motion.div variants={fadeInUp}>
                    <Typography
                      variant="overline"
                      sx={publicEyebrowSx}
                    >
                      THE FUTURE OF SURVEYING
                    </Typography>
                    <Typography
                      variant="h1"
                      sx={publicHeroTitleSx}
                    >
                      Why spend <br />
                      <span style={{ color: "#4f46e5" }}>
                        evenings in office?
                      </span>
                    </Typography>
                  </motion.div>

                  <motion.div variants={fadeInUp}>
                    <Typography
                      variant="h5"
                      sx={publicHeroLeadSx}
                    >
                      Eliminate post-processing entirely — your field data isn’t
                      just a list of numbers anymore. With precise numerical
                      input, your terrain is instantly visualized. Gradients and
                      profiles are processed in real time on any device,
                      ensuring maximum accuracy and reliability. From initial
                      levels to final volume reports, we’ve automated the entire
                      engineering workflow for exact cutting/ filling quantities
                      before you even leave the site.
                    </Typography>
                  </motion.div>

                  <motion.div variants={fadeInUp}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <Button
                        variant="contained"
                        size="large"
                        sx={{
                          bgcolor: "#4f46e5",
                          color: "white",
                          px: 5,
                          py: 2,
                          borderRadius: 3,
                          textTransform: "none",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          boxShadow: "0 10px 20px -5px rgba(79, 70, 229, 0.4)",
                          "&:hover": { bgcolor: "#4338ca" },
                        }}
                      >
                        Start Surveying
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        sx={{
                          borderColor: "#e5e7eb",
                          color: "#111827",
                          px: 5,
                          py: 2,
                          borderRadius: 3,
                          textTransform: "none",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          "&:hover": {
                            borderColor: "#4f46e5",
                            bgcolor: "#f3f4ff",
                          },
                        }}
                      >
                        Watch Demo
                      </Button>
                    </Stack>
                  </motion.div>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      bgcolor: "#f8fafc",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      textAlign: "center",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  >
                    <Typography
                      variant="h2"
                      sx={{ fontWeight: 900, color: "#4f46e5", mb: 1 }}
                    >
                      40%
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: "#1e293b", fontWeight: 700, mb: 1 }}
                    >
                      Time Reduction
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      Average time saved on-site for professionals conducting
                      autolevel surveys.
                    </Typography>
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          </Container>

          {/* Value Proposition Section */}
          <Box sx={{ bgcolor: "#f9fafb", py: { xs: 8, md: 12 } }}>
            <Container maxWidth="lg">
              <Grid container spacing={4}>
                {[
                  {
                    icon: <CustomIcons.Thunderbolt />,
                    title: "Industry-standard field book",
                    desc: "Human errors reduced by 40% — just clean, professional documentation at the click of a button.",
                  },
                  {
                    icon: <CustomIcons.Safety />,
                    title: "Real-Time Cross-Sections (CS)",
                    desc: "High-precision cross-sections update in real time with every intermediate sight, eliminating manual drafting and ensuring station-wide accuracy — saving hours of office work.",
                  },
                  {
                    icon: <CustomIcons.Solution />,
                    title: "Instant Longitudinal-Sections (LS)",
                    desc: "The moment you enter the last foresight, Longitudinal profile is ready — No manual plotting, no spreadsheet-to-CAD headaches.",
                  },
                  {
                    icon: <CustomIcons.Thunderbolt />,
                    title: "Precision Quantity Analytics",
                    desc: "Synchronizing proposed levels alongside your field data, instantly generate comprehensive Area and Volume reports, calculating vertical differences in seconds.",
                  },
                  {
                    icon: <CustomIcons.Safety />,
                    title: "Unified Project Intelligence",
                    desc: "Empower on-site precision and off-site collaboration. transforming field effort into synchronized success through real-time, anywhere-access.",
                  },
                  {
                    icon: <CustomIcons.Solution />,
                    title: "Direct PDF Export",
                    desc: "Generate professional, boardroom-ready reports for instant executive circulation.",
                  },
                ].map((item, i) => (
                  <Grid size={{ xs: 12, md: 4 }} key={i}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: i * 0.1 }}
                      style={{ height: "100%" }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          p: 5,
                          borderRadius: 8,
                          height: "100%",
                          bgcolor: "white",
                          border: "1px solid #f1f5f9",
                        }}
                      >
                        <Box sx={{ color: "#4f46e5", mb: 3 }}>{item.icon}</Box>
                        <Typography
                          variant="h5"
                          sx={{ fontWeight: 800, mb: 2, color: "#111827" }}
                        >
                          {item.title}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: "#6b7280", lineHeight: 1.7 }}
                        >
                          {item.desc}
                        </Typography>
                      </Paper>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>

          {/* Institutional Training Section */}
          <Container maxWidth="lg" sx={{ py: { xs: 8, md: 15 } }}>
            <Paper
              elevation={0}
              component={motion.div}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              sx={{
                p: { xs: 4, md: 8 },
                borderRadius: 12,
                bgcolor: "#111827",
                color: "white",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ mb: 4 }}
                >
                  <CustomIcons.Read />
                  <Typography
                    variant="overline"
                    sx={{ letterSpacing: 3, fontWeight: 700, color: "#818cf8" }}
                  >
                    ACADEMIC PARTNERSHIP
                  </Typography>
                </Stack>

                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    mb: 3,
                    maxWidth: 700,
                    lineHeight: 1.2,
                    fontSize: { xs: "2rem", md: "3rem" },
                  }}
                >
                  Equip your students with{" "}
                  <span style={{ color: "#818cf8" }}>cutting-edge skills</span>
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: "#94a3b8",
                    fontWeight: 400,
                    mb: 5,
                    maxWidth: 800,
                    fontSize: "1.1rem",
                  }}
                >
                  We are pleased to offer a specialized CADER training program
                  for students at your esteemed institution, designed to prepare
                  them for today's competitive job market.
                </Typography>

                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "white",
                    color: "#111827",
                    px: 6,
                    py: 2,
                    borderRadius: 4,
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    textTransform: "none",
                    "&:hover": { bgcolor: "#f1f5f9" },
                  }}
                  onClick={() =>
                    navigate("/", { state: { target: "contact" } })
                  }
                >
                  Enquire for Institution
                </Button>
              </Box>

              {/* Decorative background glow */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: -100,
                  right: -100,
                  width: 400,
                  height: 400,
                  bgcolor: "#4f46e5",
                  filter: "blur(120px)",
                  opacity: 0.15,
                  borderRadius: "50%",
                }}
              />
            </Paper>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default About;
