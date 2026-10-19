import { Box, Button, Collapse, Container, IconButton, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import { MdArrowForward, MdOutlineExpandLess, MdOutlineExpandMore } from "react-icons/md";
import { FiMail, FiPhone } from "react-icons/fi";
import CaderBrand from "./CaderBrand";

const StyledLink = styled(RouterLink)(() => ({
  color: "#626b8b",
  fontSize: "1rem",
  textDecoration: "none",
  position: "relative",
  width: "fit-content",
  transition: "color 0.2s ease",
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 0,
    height: 1,
    backgroundColor: "#4f46e5",
    transition: "width 0.25s ease",
  },
  "&:hover": { color: "#4f46e5" },
  "&:hover::after": { width: "100%" },
}));

const SocialIcons = {
  X: () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  LinkedIn: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 2H3.553C2.695 2 2 2.678 2 3.515v16.97C2 21.322 2.695 22 3.553 22h16.894c.858 0 1.553-.678 1.553-1.515V3.515C22 2.678 21.305 2 20.447 2ZM7.934 18.75H4.977V9.197h2.957v9.553ZM6.456 7.894a1.713 1.713 0 1 1 0-3.426 1.713 1.713 0 0 1 0 3.426ZM18.75 18.75h-2.954v-4.647c0-1.108-.022-2.533-1.545-2.533-1.545 0-1.781 1.207-1.781 2.453v4.727H9.516V9.197h2.836v1.304h.04c.395-.748 1.359-1.538 2.798-1.538 2.991 0 3.56 1.969 3.56 4.527v5.26Z" />
    </svg>
  ),
  Instagram: () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.981 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.981-6.98.058-1.28.072-1.689.072-4.948 0-3.259-.014-3.668-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
};

const contours = [
  "M0 290 C90 175 125 300 215 190 S340 175 420 110 S520 140 610 55 S735 35 835 -30",
  "M0 325 C100 205 140 320 230 225 S355 205 445 135 S545 165 640 80 S765 55 860 -10",
  "M0 360 C115 240 150 350 245 260 S375 235 470 165 S570 195 665 110 S790 85 885 20",
  "M0 395 C125 275 170 385 265 295 S390 270 485 200 S590 230 685 145 S810 120 910 55",
  "M0 430 C140 310 185 420 280 330 S410 305 505 235 S610 265 705 180 S830 155 930 90",
  "M0 465 C155 345 200 455 300 365 S430 340 525 270 S630 300 725 215 S850 190 950 125",
];

const ContourLines = ({ light = false }) => (
  <Box
    component="svg"
    viewBox="0 0 950 470"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    sx={{ position: "absolute", width: { xs: 650, md: 950 }, height: 470, right: -70, bottom: -120, pointerEvents: "none", opacity: light ? 0.5 : 0.55 }}
  >
    {contours.map((path) => (
      <path key={path} d={path} fill="none" stroke={light ? "#c7d2fe" : "#a5b4fc"} strokeWidth="1.15" />
    ))}
    <path d="M160 460 C285 360 345 430 435 335 S560 340 655 255 S760 255 870 170" fill="none" stroke={light ? "#c7d2fe" : "#a5b4fc"} strokeWidth="1.15" strokeDasharray="7 9" />
  </Box>
);

const BannerContours = () => (
  <Box
    component="svg"
    viewBox="0 0 900 360"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    sx={{ position: "absolute", inset: "0 0 0 auto", width: { xs: "85%", md: "68%" }, height: "100%", pointerEvents: "none", opacity: { xs: 0.22, md: 0.5 }, maskImage: "linear-gradient(to right, transparent, black 30%)" }}
  >
    {Array.from({ length: 13 }, (_, index) => {
      const offset = index * 18;
      return (
        <path
          key={index}
          d={`M ${-90 + offset * 0.6} ${380 + offset} C ${80 + offset * 0.5} ${225 + offset}, ${140 + offset * 0.35} ${370 + offset}, ${265 + offset * 0.45} ${235 + offset * 0.8} S ${430 + offset * 0.4} ${250 + offset * 0.55}, ${525 + offset * 0.25} ${125 + offset * 0.8} S ${690 + offset * 0.1} ${150 + offset * 0.55}, ${760 + offset * 0.25} ${40 + offset * 0.6} S ${865 + offset * 0.2} ${60 + offset * 0.4}, ${960 + offset * 0.2} ${-35 + offset * 0.55}`}
          fill="none"
          stroke="#c7d2fe"
          strokeWidth="1.1"
        />
      );
    })}
    <path d="M 300 350 C 425 250 495 340 580 225 S 725 200 825 95 S 900 100 970 20" fill="none" stroke="#dbe4ff" strokeWidth="1.3" strokeDasharray="7 9" />
  </Box>
);

const FooterGroup = ({ title, children }) => (
  <Stack spacing={1.6} alignItems="flex-start">
    <Typography component="h3" sx={{ fontWeight: 800, color: "#111936", fontSize: "1.05rem", mb: 0.5 }}>{title}</Typography>
    {children}
  </Stack>
);

const LandingFooter = () => {
  const [openSections, setOpenSections] = useState({});
  const toggle = (key) => setOpenSections((current) => ({ ...current, [key]: !current[key] }));

  return (
    <Box component="footer" sx={{ position: "relative", overflow: "hidden", bgcolor: "#fbfcff", color: "#111936", pt: { xs: 7, md: 10 }, pb: 4 }}>
      <Box sx={{ position: "absolute", inset: "auto 0 -180px auto", width: 700, height: 470, pointerEvents: "none" }}>
        <ContourLines light />
      </Box>
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ position: "relative", overflow: "hidden", borderRadius: { xs: 4, md: 6 }, px: { xs: 3, sm: 5, md: 8 }, py: { xs: 5, md: 6 }, background: "radial-gradient(circle at 76% 12%, rgba(130, 125, 255, 0.45), transparent 36%), linear-gradient(115deg, #2d36aa 0%, #373ec1 47%, #4f46e5 100%)", color: "#fff", boxShadow: "0 24px 60px rgba(79, 70, 229, 0.16)" }}>
          <BannerContours />
          <Box sx={{ position: "relative", zIndex: 1, maxWidth: 800 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.22em", mb: 1.5, color: "#e0e7ff" }}>SURVEY SMARTER</Typography>
            <Typography component="h2" sx={{ fontSize: { xs: "2rem", sm: "2.6rem", md: "3.3rem" }, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, mb: 1.5 }}>Ready to simplify your surveys?</Typography>
            <Typography sx={{ maxWidth: 610, color: "#dce2ff", fontSize: { xs: "1rem", md: "1.15rem" }, lineHeight: 1.6, mb: 2.5 }}>Join professionals who trust CADER for accurate, efficient and error-free surveying calculations.</Typography>
            <Button component={RouterLink} to="/register" variant="contained" endIcon={<MdArrowForward />} sx={{ bgcolor: "#fff", color: "#252cc1", textTransform: "none", fontSize: "1rem", fontWeight: 800, px: 3.5, py: 1.35, borderRadius: 2, boxShadow: "0 8px 22px rgba(17, 24, 70, 0.13)", "&:hover": { bgcolor: "#eef2ff" } }}>Get started</Button>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "minmax(240px, 1.7fr) repeat(3, minmax(120px, 1fr))" }, columnGap: { xs: 3, md: 7 }, rowGap: 5, py: { xs: 7, md: 8 } }}>
          <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
            <CaderBrand />
            <Typography sx={{ maxWidth: 320, mt: 2.5, color: "#626b8b", lineHeight: 1.7 }}>CADER simplifies autolevel surveying with accurate, efficient calculations.</Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
              {[
                { label: "X", icon: <SocialIcons.X />, path: "" },
                { label: "LinkedIn", icon: <SocialIcons.LinkedIn />, path: "https://www.linkedin.com/company/archstructures" },
                { label: "Instagram", icon: <SocialIcons.Instagram />, path: "" },
              ].map(({ label, icon, path }) => (
                <IconButton key={label} aria-label={label} component={motion.button} whileHover={{ scale: 1.2, rotate: 8, color: "#4f46e5" }} whileTap={{ scale: 0.9 }} onClick={() => path && window.open(path, "_blank", "noopener,noreferrer")} sx={{ color: "#626b8b", bgcolor: "#eef0ff", borderRadius: 2, "&:hover": { bgcolor: "#e0e7ff" } }}>
                  {icon}
                </IconButton>
              ))}
            </Stack>
          </Box>

          <FooterGroup title="Product">
            <StyledLink to="#">What's new</StyledLink>
            <StyledLink to="/pricing">Pricing</StyledLink>
            <StyledLink to="#">Testimonials</StyledLink>
            <StyledLink to="#">Community</StyledLink>
            <StyledLink to="#" aria-expanded={Boolean(openSections.placements)} onClick={(event) => { event.preventDefault(); toggle("placements"); }} sx={{ cursor: "pointer" }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>Placements {openSections.placements ? <MdOutlineExpandLess size={18} /> : <MdOutlineExpandMore size={18} />}</Stack>
            </StyledLink>
            <Collapse in={Boolean(openSections.placements)}>
              <Stack spacing={1.5} sx={{ pl: 2 }}>
                <StyledLink to="/placements">Talents</StyledLink>
                <StyledLink to="#">Recruiters</StyledLink>
              </Stack>
            </Collapse>
          </FooterGroup>

          <FooterGroup title="Resources">
            <StyledLink to="#">Documentation</StyledLink>
            <StyledLink to="#">Tutorials</StyledLink>
            <StyledLink to="#">Events</StyledLink>
          </FooterGroup>

          <FooterGroup title="Company">
            <StyledLink to="/about">About</StyledLink>
            <StyledLink to="/careers">Careers</StyledLink>
            <StyledLink to="/impact">Impact</StyledLink>
            <StyledLink to="#" aria-expanded={Boolean(openSections.governance)} onClick={(event) => { event.preventDefault(); toggle("governance"); }} sx={{ cursor: "pointer" }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>Governance {openSections.governance ? <MdOutlineExpandLess size={18} /> : <MdOutlineExpandMore size={18} />}</Stack>
            </StyledLink>
            <Collapse in={Boolean(openSections.governance)}>
              <Stack spacing={1.5} sx={{ pl: 2 }}>
                {["Founder", "Business Architect", "Software Architect/ Developer", "Civil Survey Expert", "Sales & Partnership", "Technical support/ trainer", "UI/UX designer"].map((item) => <StyledLink key={item} to="#">{item}</StyledLink>)}
              </Stack>
            </Collapse>
          </FooterGroup>
        </Box>

        <Box sx={{ borderTop: "1px solid #dde2f1", borderBottom: "1px solid #dde2f1", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, py: 2.5, rowGap: 2 }}>
          {[
            { label: "+91 79944 19955", href: "tel:+917994419955", Icon: FiPhone },
            { label: "+91 79944 39955", href: "tel:+917994439955", Icon: FiPhone },
            { label: "+91 79944 69955", href: "tel:+917994469955", Icon: FiPhone },
            { label: "admin@getcader.com", href: "mailto:admin@getcader.com", Icon: FiMail },
          ].map(({ label, href, Icon }, index) => (
            <Box key={label} component="a" href={href} sx={{ display: "flex", alignItems: "center", gap: 1.5, pl: { xs: 0, sm: index % 2 ? 2 : 0, lg: index ? 3 : 0 }, borderLeft: { lg: index ? "1px solid #dde2f1" : "none" }, textDecoration: "none", color: "#111936", fontSize: { xs: 14, md: 15 }, whiteSpace: "nowrap", "&:hover": { color: "#4f46e5" } }}>
              <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: "#eef0ff", color: "#4f46e5", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon size={19} /></Box>
              {label}
            </Box>
          ))}
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ pt: 3.5 }}>
          <Typography sx={{ color: "#78809e", fontSize: 13 }}>© {new Date().getFullYear()} CADER. All rights reserved.</Typography>
          <Stack direction="row" spacing={2.5} alignItems="center">
            <StyledLink to="/privacy">Privacy Policy</StyledLink>
            <Typography sx={{ color: "#c5c9d7" }}>|</Typography>
            <StyledLink to="/terms">Terms &amp; Conditions</StyledLink>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default LandingFooter;
