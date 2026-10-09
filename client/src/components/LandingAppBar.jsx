import {
  AppBar,
  Box,
  Button,
  Container,
  createTheme,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import logo from "../assets/logo/cader_logo_2.png";
// --- Theme Configuration ---
const theme = createTheme({
  palette: {
    primary: { main: "#6366f1" }, // Indigo
    secondary: { main: "#000000" }, // Black
    background: { default: "#ffffff" },
    text: {
      primary: "#000000",
      secondary: "#4b5563",
    },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", sans-serif',
    h1: { fontWeight: 900, letterSpacing: "-0.02em" },
    h2: { fontWeight: 800, letterSpacing: "-0.01em" },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
          padding: "10px 24px",
        },
        containedPrimary: {
          boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.3)",
          "&:hover": {
            boxShadow: "0 20px 25px -5px rgba(99, 102, 241, 0.4)",
          },
        },
      },
    },
  },
});

const MenuIcon = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const CloseIcon = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const NAV_ITEMS = [
  { label: "Pricing", path: "/pricing" },
  { label: "Careers", path: "/careers" },
  { label: "Our Team", path: "/our-team" },
  { label: "About", path: "/about" },
];

const LandingAppBar = () => {
  const navigate = useNavigate();

  const muiTheme = useTheme();
  const isMdDown = useMediaQuery(muiTheme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />

        {/* Navigation */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #f3f4f6",
            zIndex: 1100,
          }}
        >
          <Container maxWidth="lg">
            <Toolbar
              disableGutters
              sx={{
                justifyContent: "space-between",
                minHeight: { xs: 64, md: 72 },
              }}
            >
              <Box
                component="button"
                type="button"
                aria-label="Cader home"
                onClick={() => navigate("/")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  flexShrink: 0,
                  gap: { xs: 1, md: 1.25 },
                  p: 0,
                  border: 0,
                  bgcolor: "transparent",
                  cursor: "pointer",
                }}
              >
                <Box
                  component="img"
                  src={logo}
                  alt=""
                  sx={{
                    display: "block",
                    width: { xs: 52, md: 60 },
                    height: { xs: 52, md: 60 },
                    objectFit: "contain",
                  }}
                />
                <Box sx={{ textAlign: "left", whiteSpace: "nowrap" }}>
                  <Typography
                    component="span"
                    sx={{ display: "block", fontSize: { xs: "1.4rem", md: "1.65rem" }, fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em" }}
                  >
                    <Box component="span" sx={{ color: "#64748b" }}>Cad</Box>
                    <Box component="span" sx={{ color: "#6366f1" }}>er</Box>
                  </Typography>
                  <Typography
                    component="span"
                    sx={{ display: "block", color: "#64748b", fontSize: { xs: "0.56rem", md: "0.67rem" }, fontWeight: 600, lineHeight: 1.2, letterSpacing: "0.01em" }}
                  >
                    Complexity simplified
                  </Typography>
                </Box>
              </Box>

              {/* Desktop Menu */}
              {!isMdDown && (
                <Stack direction="row" spacing={1}>
                  {NAV_ITEMS.map((item) => (
                    <Button
                      key={item.label}
                      color="inherit"
                      sx={{
                        color: "text.secondary",
                        "&:hover": {
                          color: "primary.main",
                          bgcolor: "rgba(99, 102, 241, 0.05)",
                        },
                      }}
                      onClick={() => navigate(item.path)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Stack>
              )}

              <Stack direction="row" spacing={1} alignItems="center">
                {!isMdDown && (
                  <Button color="secondary" onClick={() => navigate("/login")}>
                    Sign In
                  </Button>
                )}

                {/* Mobile Menu Toggle */}
                {isMdDown && (
                  <IconButton
                    color="secondary"
                    onClick={handleDrawerToggle}
                    edge="end"
                    sx={{ ml: 1 }}
                  >
                    <MenuIcon size={24} />
                  </IconButton>
                )}
              </Stack>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Mobile Drawer */}
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          slotProps={{
            sx: { width: "280px", p: 2 },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon size={24} />
            </IconButton>
          </Box>
          <List sx={{ width: "280px", px: 2 }}>
            {NAV_ITEMS.map((item) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  onClick={() => navigate(item.path) && handleDrawerToggle}
                  sx={{ borderRadius: 2 }}
                >
                  <ListItemText
                    primary={item.label}
                    slotProps={{ typography: { fontWeight: 600 } }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            <Divider sx={{ my: 2 }} />
            <ListItem disablePadding>
              <ListItemButton
                sx={{ borderRadius: 2, bgcolor: "rgba(0,0,0,0.05)" }}
                onClick={() => navigate("/login")}
              >
                <ListItemText primary="Sign In" />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>
      </ThemeProvider>
    </>
  );
};

export default LandingAppBar;
