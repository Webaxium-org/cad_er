import {
  Box,
  Container,
  Typography,
  Stack,
  Grid,
  Divider,
  IconButton,
  Collapse,
} from "@mui/material";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import { MdOutlineExpandLess, MdOutlineExpandMore } from "react-icons/md";
import logo from "../assets/logo/cader_logo.png";

const StyledLink = styled(RouterLink)(({ theme }) => ({
  fontSize: 13,
  color: theme.palette.text.secondary,
  textDecoration: "none",
  position: "relative",
  transition: "color 0.2s ease",
  width: "fit-content",
  "&::after": {
    content: '""',
    position: "absolute",
    width: "0%",
    height: "1px",
    bottom: 0,
    left: 0,
    backgroundColor: "#6366f1",
    transition: "width 0.25s ease",
  },

  "&:hover": {
    color: "#6366f1",
  },

  "&:hover::after": {
    width: "100%",
  },
}));

// --- Icons ---
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

const LandingFooter = () => {
  const [openSections, setOpenSections] = useState({});

  const handleToggle = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleNavigate = (path) => {
    if (path) window.open(path, "_blank");
  };

  return (
    <Box sx={{ bgcolor: "#f9fafb", py: 8, borderTop: "1px solid #f3f4f6" }}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 8 }}>
          {/* Logo + Description */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box component="img" src={logo} alt="Cader" sx={{ width: 56, height: 56, objectFit: "contain", mb: 1 }} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 400, lineHeight: 1.7 }}
            >
              CADER simplifies autolevel surveying, reducing on-site time by 40%
              while ensuring accurate, error-free calculations for
              professionals.
            </Typography>
            <Stack
              direction="row"
              spacing={1.5}
              mt={2}
              justifyContent="start"
              sx={{ transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
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
                  whileHover={{ scale: 1.2, rotate: 8, color: "#6366f1" }}
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
          </Grid>

          {/* Links Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color="text.primary"
                  gutterBottom
                >
                  Product
                </Typography>
                <Stack spacing={1.5}>
                  <StyledLink to="#">What’s new</StyledLink>
                  <StyledLink to="/pricing">Pricing</StyledLink>
                  <StyledLink to="#">Testimonials</StyledLink>
                  <StyledLink to="#">Community</StyledLink>

                  <StyledLink
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggle("placements");
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    <Stack direction={"row"} alignItems={"center"}>
                      Placements{" "}
                      {openSections.placements ? (
                        <MdOutlineExpandLess fontSize={18} />
                      ) : (
                        <MdOutlineExpandMore fontSize={18} />
                      )}
                    </Stack>
                  </StyledLink>

                  <Collapse in={openSections.placements}>
                    <Stack spacing={1.5} sx={{ pl: 2 }}>
                      <StyledLink to="/placements">· Talents</StyledLink>
                      <StyledLink to="#">· Recruiters</StyledLink>
                    </Stack>
                  </Collapse>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color="text.primary"
                  gutterBottom
                >
                  Resources
                </Typography>
                <Stack spacing={1.5}>
                  <StyledLink to="#">Documentation</StyledLink>
                  <StyledLink to="#">Tutorials</StyledLink>
                  <StyledLink to="#">Events</StyledLink>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color="text.primary"
                  gutterBottom
                >
                  Company
                </Typography>
                <Stack spacing={1.5}>
                  <StyledLink to="/about">About</StyledLink>
                  <StyledLink to="/careers">Careers</StyledLink>
                  <StyledLink to="/impact">Impact</StyledLink>
                  <StyledLink
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggle("governance");
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    <Stack direction={"row"} alignItems={"center"}>
                      Governance{" "}
                      {openSections.governance ? (
                        <MdOutlineExpandLess fontSize={18} />
                      ) : (
                        <MdOutlineExpandMore fontSize={18} />
                      )}
                    </Stack>
                  </StyledLink>

                  <Collapse in={openSections.governance}>
                    <Stack spacing={1.5} sx={{ pl: 2 }}>
                      <StyledLink to="#">· Founder</StyledLink>
                      <StyledLink to="#">· Business Architect</StyledLink>
                      <StyledLink to="#">
                        · Software Architect/ Developer
                      </StyledLink>
                      <StyledLink to="#">· Civil Survey Expert</StyledLink>
                      <StyledLink to="#">· Sales & Partnership</StyledLink>
                      <StyledLink to="#">
                        · Technical support/ trainer
                      </StyledLink>
                      <StyledLink to="#">· UI/UX designer</StyledLink>
                    </Stack>
                  </Collapse>
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Divider sx={{ my: 6, borderColor: "#e5e7eb" }} />

        {/* Contact Row */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          {[
            { label: "+91 79944 19955", type: "tel" },
            { label: "+91 79944 39955", type: "tel" },
            { label: "+91 79944 69955", type: "tel" },
            { label: "admin@getcader.com", type: "mailto" },
          ].map((contact, idx) => (
            <Stack direction="row" spacing={1} alignItems="center" key={idx}>
              <Typography variant="body2" color="text.secondary">
                {contact.type === "tel" ? "📞" : "✉"}
              </Typography>
              <StyledLink
                to={`${contact.type}:${contact.label.replace(/\s/g, "")}`}
              >
                {contact.label}
              </StyledLink>
            </Stack>
          ))}
        </Stack>

        <Divider sx={{ my: 6, borderColor: "#e5e7eb" }} />

        {/* Bottom Section */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Typography variant="caption" color="text.disabled">
            © 2025 CADER. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={3}>
            <StyledLink to="#">Privacy Policy</StyledLink>
            <StyledLink to="#">Terms of Service</StyledLink>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default LandingFooter;
