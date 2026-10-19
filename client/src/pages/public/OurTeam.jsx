import React from "react";
import {
  Box,
  Typography,
  Container,
  Avatar,
  IconButton,
  Stack,
  GlobalStyles,
  Paper,
  Grid, // Reverting to the standard stable Grid component
} from "@mui/material";
import { motion } from "framer-motion";
import { publicHeroMotion, publicCardContainerVariants, publicCardVariants } from "../../components/publicMotion";
import ScrollToTop from "../../components/ScrollToTop";
import { publicEyebrowSx, publicHeroTitleSx, publicHeroLeadSx } from "../../components/publicTypography";
import { publicSectionStartSx } from "../../components/publicLayoutStyles";

/**
 * Custom SVG Icons for Social Media
 */
const SocialIcons = {
  X: () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  Instagram: () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.981 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.981-6.98.058-1.28.072-1.689.072-4.948 0-3.259-.014-3.668-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  LinkedIn: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
};

const teamMembers = [
  {
    name: "Anees Majeed",
    role: "Founder & Chief Executive Officer",
    bio: "A visionary leader with a decade of expertise in mapping and mining, driving CADER’s innovation and strategic growth.",
  },
  {
    name: "Muhjir Ibrahim Shajahan",
    role: "Product Architect",
    bio: "Expert in human–computer interfaces, dedicated to simplifying complex workflows through intuitive and accessible design.",
  },
  {
    name: "Jaseem CM",
    role: "Research & Development, Civil Engineer",
    bio: "Leads technical innovation by applying civil engineering precision to CADER's cutting-edge methodologies.",
  },
  {
    name: "Asif Majeed",
    role: "Head of Accounts",
    bio: "Manages financial operations with a focus on transparency, sustainability, and long-term operational efficiency.",
  },
  {
    name: "Muhammed Noor",
    role: "Human Resources Lead",
    bio: "Focuses on talent acquisition and fostering a collaborative organizational culture to build high-performing teams.",
  },
  {
    name: "Kishore K. Ajayan",
    role: "Head of Marketing",
    bio: "Drives brand strategy and institutional outreach to expand CADER’s market presence and industry credibility.",
  },
];

const OurTeam = () => {
  const handleNavigate = (path) => {
    if (path) window.open(path, "_blank");
  };

  return (
    <>
      <ScrollToTop />
      <Box
        sx={{
          bgcolor: "#ffffff",
          minHeight: "100vh",
          pb: 10,
          overflowX: "hidden",
        }}
      >
        <GlobalStyles
          styles={{
            body: { margin: 0, padding: 0, backgroundColor: "#ffffff" },
          }}
        />

        {/* Hero Header */}
        <Box
          component={motion.div}
          {...publicHeroMotion}
          sx={{
            pt: 12,
            pb: 10,
            textAlign: "center",
            background:
              "radial-gradient(circle at 50% 0%, #f3f4ff 0%, #ffffff 80%)",
          }}
        >
          <Container maxWidth="md">
            <Typography
              variant="overline"
              sx={publicEyebrowSx}
            >
              OUR TALENT
            </Typography>
            <Typography
              component="h1"
              variant="h2"
              sx={{ ...publicHeroTitleSx, mb: 3 }}
            >
              Our <Box component="span" sx={{ color: "#4f46e5" }}>Governance</Box>
            </Typography>
            <Typography
              variant="h6"
              sx={{ ...publicHeroLeadSx, mx: "auto" }}
            >
              We're a diverse group of creators working to redefine the
              intersection of engineering and design.
            </Typography>
          </Container>
        </Box>

        {/* Team Grid using standard Grid */}
        <Container maxWidth="lg" sx={publicSectionStartSx}>
          <Grid
            container
            spacing={4}
            component={motion.div}
            variants={publicCardContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {teamMembers.map((member, index) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={index} sx={{ minWidth: 0 }}>
                <motion.div
                  variants={publicCardVariants}
                  whileHover={{ y: -10 }}
                  style={{ height: "100%" }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, md: 4 },
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      borderRadius: 10,
                      textAlign: "center",
                      border: "1px solid #f1f5f9",
                      bgcolor: "#ffffff",
                      position: "relative",
                      overflow: "hidden",
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        borderColor: "#4f46e5",
                        boxShadow: "0 30px 60px -12px rgba(79, 70, 229, 0.12)",
                        "& .social-stack": { opacity: 1, y: 0 },
                        "& .member-avatar": { transform: "scale(1.1)" },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        mb: 4,
                        width: { xs: 120, md: 140, xl: 150 },
                        height: { xs: 120, md: 140, xl: 150 },
                        mx: "auto",
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          inset: -6,
                          borderRadius: "50%",
                          border: "2px solid #4f46e5",
                          opacity: 0,
                          transition: "0.3s",
                          transform: "scale(0.8)",
                        },
                        "&:hover::after": {
                          opacity: 1,
                          transform: "scale(1)",
                        },
                      }}
                    >
                      <Avatar
                        className="member-avatar"
                        src={member.image}
                        sx={{
                          width: "100%",
                          height: "100%",
                          transition:
                            "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        }}
                      />
                    </Box>

                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 800, color: "#111827", mb: 0.5, overflowWrap: "anywhere" }}
                    >
                      {member.name}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: "#4f46e5",
                        fontWeight: 700,
                        mb: 2,
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                        fontSize: "0.75rem",
                      }}
                    >
                      {member.role}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "#64748b",
                        mb: 4,
                        flexGrow: 1,
                        lineHeight: 1.7,
                        fontSize: "0.95rem",
                      }}
                    >
                      {member.bio}
                    </Typography>

                    {/* Social Box with Motion logic */}
                    <Stack
                      direction="row"
                      spacing={1.5}
                      justifyContent="center"
                      className="social-stack"
                      sx={{
                        opacity: 0,
                        y: 20,
                        transition:
                          "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        "@media (hover: none)": { opacity: 1 },
                      }}
                    >
                      {[
                        { icon: <SocialIcons.X key="x" />, path: "" },
                        {
                          icon: <SocialIcons.LinkedIn key="li" />,
                          path: "https://www.linkedin.com/company/archstructures",
                        },
                        { icon: <SocialIcons.Instagram key="in" />, path: "" },
                      ].map(({ icon, path }, i) => (
                        <IconButton
                          key={i}
                          size="medium"
                          component={motion.button}
                          whileHover={{
                            scale: 1.2,
                            rotate: 8,
                            color: "#4f46e5",
                          }}
                          whileTap={{ scale: 0.9 }}
                          sx={{
                            color: "#94a3b8",
                            bgcolor: "#f8fafc",
                            transition: "color 0.2s",
                            "&:hover": { bgcolor: "#eef2ff" },
                          }}
                          onClick={() => handleNavigate(path)}
                        >
                          {icon}
                        </IconButton>
                      ))}
                    </Stack>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Bottom CTA Section */}
        <Container maxWidth="md" sx={{ mt: 15 }}>
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            sx={{
              p: 6,
              borderRadius: 12,
              textAlign: "center",
              bgcolor: "#111827",
              color: "white",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
              Want to join the mission?
            </Typography>
            <Typography
              sx={{ color: "#94a3b8", mb: 4, maxWidth: 500, mx: "auto" }}
            >
              We're always looking for talented individuals to help us build the
              next generation of CAD tools.
            </Typography>
            <IconButton
              component={motion.button}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              sx={{
                bgcolor: "#4f46e5",
                color: "white",
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 700,
                "&:hover": { bgcolor: "#4338ca" },
              }}
            >
              View Open Positions
            </IconButton>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default OurTeam;
