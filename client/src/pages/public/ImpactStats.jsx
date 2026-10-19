import React from "react";
import {
  Box,
  Typography,
  Container,
  Stack,
  GlobalStyles,
  Paper,
  Grid,
  Divider,
  Button,
} from "@mui/material";
import { motion } from "framer-motion";
import { publicHeroMotion, publicCardContainerVariants, publicCardVariants } from "../../components/publicMotion";
import ScrollToTop from "../../components/ScrollToTopButton";
import { publicEyebrowSx, publicHeroTitleSx, publicHeroLeadSx } from "../../components/publicTypography";

/**
 * Icons for the Stats
 */
const StatIcons = {
  Colleges: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4f46e5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  Companies: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4f46e5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Users: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4f46e5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Experience: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4f46e5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

const statsData = [
  {
    label: "Colleges Collaborated",
    value: "50+",
    icon: <StatIcons.Colleges />,
    description: "Empowering technical education across the nation.",
  },
  {
    label: "Companies Using",
    value: "120+",
    icon: <StatIcons.Companies />,
    description: "Trusted by leading engineering and design firms.",
  },
  {
    label: "People Using",
    value: "15k+",
    icon: <StatIcons.Users />,
    description: "A growing community of skilled professionals.",
  },
  {
    label: "Years of Experience",
    value: "10+",
    icon: <StatIcons.Experience />,
    description: "A decade of mastery in mapping and engineering.",
  },
];

const timelineEvents = [
  {
    year: "2014",
    title: "Inception",
    detail: "Started with a vision to simplify complex engineering workflows.",
  },
  {
    year: "2017",
    title: "Institutional Shift",
    detail:
      "Partnered with our first 10 technical colleges for digital transformation.",
  },
  {
    year: "2020",
    title: "Enterprise Launch",
    detail:
      "Expanded services to major industrial players in mapping and mining.",
  },
  {
    year: "2024",
    title: "Global Scaling",
    detail: "Reaching 15,000+ users and defining the future of CADER.",
  },
];

const ImpactStats = () => {
  return (
    <>
      <ScrollToTop />
      <Box
        sx={{
          bgcolor: "#ffffff",
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <GlobalStyles
          styles={{
            body: { margin: 0, padding: 0, backgroundColor: "#ffffff" },
          }}
        />

        {/* Decorative Background Elements */}
        <Box
          sx={{
            position: "absolute",
            top: "-5%",
            right: "-10%",
            width: "50%",
            height: "50%",
            background:
              "radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, rgba(255, 255, 255, 0) 70%)",
            zIndex: 0,
          }}
        />

        <Container
          maxWidth="lg"
          sx={{ position: "relative", zIndex: 1, pt: 12, pb: 15 }}
        >
          {/* --- Hero Section --- */}
          <Box component={motion.div} {...publicHeroMotion} sx={{ textAlign: "center", mb: 10 }}>
            <Typography
              variant="overline"
              sx={publicEyebrowSx}
            >
              OUR GLOBAL FOOTPRINT
            </Typography>
            <Typography
              component="h1"
              variant="h2"
              sx={{ ...publicHeroTitleSx, mb: 3 }}
            >
              Empowering the Next <br />
              <Box component="span" sx={{ color: "#4f46e5" }}>
                Generation of Engineers
              </Box>
            </Typography>
            <Typography
              variant="h6"
              sx={{ ...publicHeroLeadSx, maxWidth: 750, mx: "auto" }}
            >
              Transparency is the cornerstone of our mission. Explore the
              real-world metrics that drive our innovation and the communities
              we serve every day.
            </Typography>
          </Box>

          {/* --- Primary Stats Grid --- */}
          <Grid
            container
            spacing={4}
            component={motion.div}
            variants={publicCardContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {statsData.map((stat, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <motion.div variants={publicCardVariants} style={{ height: "100%" }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      height: "100%",
                      borderRadius: 8,
                      bgcolor: "rgba(255, 255, 255, 0.4)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(241, 245, 249, 1)",
                      transition: "all 0.4s ease-in-out",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      "&:hover": {
                        transform: "translateY(-10px)",
                        borderColor: "#4f46e5",
                        bgcolor: "#ffffff",
                        boxShadow: "0 25px 50px -12px rgba(79, 70, 229, 0.15)",
                        "& .stat-icon-container": {
                          bgcolor: "#4f46e5",
                          "& svg": { stroke: "#fff" },
                        },
                      },
                    }}
                  >
                    <Box
                      className="stat-icon-container"
                      sx={{
                        mb: 3,
                        p: 2,
                        borderRadius: "24px",
                        bgcolor: "#f5f7ff",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {stat.icon}
                    </Box>

                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 900,
                        color: "#111827",
                        mb: 0.5,
                        fontSize: "2.5rem",
                      }}
                    >
                      {stat.value}
                    </Typography>

                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: "#4f46e5",
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                        fontSize: "0.75rem",
                        mb: 2,
                      }}
                    >
                      {stat.label}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ color: "#64748b", lineHeight: 1.6 }}
                    >
                      {stat.description}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* --- Journey / Timeline Section --- */}
          <Box sx={{ mt: 20, mb: 10 }}>
            <Grid container spacing={8} alignItems="center">
              <Grid item xs={12} md={5}>
                <Typography
                  variant="overline"
                  sx={{ color: "#4f46e5", fontWeight: 800, letterSpacing: 2 }}
                >
                  OUR JOURNEY
                </Typography>
                <Typography
                  variant="h3"
                  sx={{ fontWeight: 900, color: "#111827", mt: 2, mb: 3 }}
                >
                  A Decade of Continuous <br /> Mastery & Evolution
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "#6b7280", mb: 4, lineHeight: 1.8 }}
                >
                  What began as a small research initiative has evolved into a
                  comprehensive platform used by thousands. Our growth is
                  mirrored by the success of the professionals and institutions
                  that rely on our technical expertise.
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#4f46e5",
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: "none",
                    fontWeight: 700,
                    boxShadow: "0 10px 20px rgba(79, 70, 229, 0.3)",
                    "&:hover": { bgcolor: "#4338ca" },
                  }}
                >
                  Read our Story
                </Button>
              </Grid>
              <Grid item xs={12} md={7}>
                <Box sx={{ position: "relative" }}>
                  {timelineEvents.map((event, i) => (
                    <Box
                      key={i}
                      component={motion.div}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      sx={{
                        display: "flex",
                        mb: 4,
                        p: 3,
                        borderRadius: 4,
                        bgcolor:
                          i === timelineEvents.length - 1
                            ? "#f8faff"
                            : "transparent",
                        border:
                          i === timelineEvents.length - 1
                            ? "1px solid #e2e8f0"
                            : "none",
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 900,
                          color: "#4f46e5",
                          minWidth: 100,
                          opacity: 0.5,
                        }}
                      >
                        {event.year}
                      </Typography>
                      <Box sx={{ ml: 3 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 800, color: "#111827" }}
                        >
                          {event.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "#64748b", mt: 0.5 }}
                        >
                          {event.detail}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* --- Global Reach Illustration Section --- */}
          <Box
            sx={{
              mt: 15,
              p: 6,
              borderRadius: 12,
              bgcolor: "#111827",
              color: "white",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background SVG Grid Pattern */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0.1,
                pointerEvents: "none",
              }}
            >
              <svg width="100%" height="100%">
                <defs>
                  <pattern
                    id="grid"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="white"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </Box>

            <Typography
              variant="h3"
              sx={{ fontWeight: 900, mb: 2, position: "relative" }}
            >
              Impacting Industry Standards{" "}
              <Box component="span" sx={{ color: "#818cf8" }}>
                Worldwide
              </Box>
            </Typography>
            <Typography
              sx={{
                color: "#94a3b8",
                mb: 6,
                maxWidth: 600,
                mx: "auto",
                position: "relative",
              }}
            >
              Our tools are integrated into workflows across borders, helping
              engineers solve local problems with global-standard technology.
            </Typography>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={4}
              justifyContent="center"
              sx={{ position: "relative" }}
            >
              {[
                { label: "Active Regions", val: "12+" },
                { label: "Technical Certifications", val: "2500+" },
                { label: "Uptime Reliability", val: "99.9%" },
              ].map((reach, i) => (
                <Box key={i} sx={{ px: 4, py: 2 }}>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 900, color: "white" }}
                  >
                    {reach.val}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#4f46e5",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {reach.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* --- Trusted Values --- */}
          <Box sx={{ mt: 15 }}>
            <Grid container spacing={3}>
              {[
                {
                  title: "Strategic Growth",
                  sub: "Consistency in delivery since day one.",
                  color: "#4f46e5",
                },
                {
                  title: "Global Standard",
                  sub: "Adhering to international engineering norms.",
                  color: "#a855f7",
                },
                {
                  title: "24/7 Innovation",
                  sub: "Always evolving with user feedback.",
                  color: "#ec4899",
                },
              ].map((val, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      borderRadius: 6,
                      border: "1px solid #f1f5f9",
                      textAlign: "center",
                      transition: "0.3s",
                      "&:hover": {
                        borderColor: val.color,
                        transform: "scale(1.02)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: val.color,
                        mx: "auto",
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{ color: "#111827", fontWeight: 800, mb: 1 }}
                    >
                      {val.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      {val.sub}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default ImpactStats;
