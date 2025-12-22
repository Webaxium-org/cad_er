import React, { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  FaCar,
  FaMapMarkerAlt,
  FaChartBar,
  FaUserShield,
} from "react-icons/fa";
import logo from "../../assets/logo/CADer logo-main.png";

const Landing = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [anchorEl, setAnchorEl] = useState(null);

  const handleNavigate = (link) => navigate(link);
  const openMenu = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  return (
    <>
      {/* Navbar */}
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <Box flexGrow={1}>
            <img src={logo} alt="CADer" style={{ width: "65px" }} />
          </Box>

          {/* Desktop */}
          {!isMobile && (
            <>
              <Button color="inherit">How It Works</Button>
              <Button color="inherit">Contact</Button>

              <Button
                variant="outlined"
                color="inherit"
                sx={{ ml: 2 }}
                onClick={() => handleNavigate("/login")}
              >
                Sign In
              </Button>

              <Button
                variant="contained"
                color="secondary"
                sx={{ ml: 1 }}
                onClick={() => handleNavigate("/register")}
              >
                Sign Up
              </Button>
            </>
          )}

          {/* Mobile */}
          {isMobile && (
            <>
              <IconButton color="inherit" onClick={openMenu}>
                <FiMenu size={22} />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={closeMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={closeMenu}>How It Works</MenuItem>
                <MenuItem onClick={closeMenu}>Contact</MenuItem>
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    handleNavigate("/login");
                  }}
                >
                  Sign In
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    handleNavigate("/register");
                  }}
                >
                  Sign Up
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          background: "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)",
          color: "white",
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={3} textAlign="center">
            <Typography variant="h3" fontWeight="bold">
              Smart Road Survey & Inspection Platform
            </Typography>

            <Typography variant="h6" color="rgba(255,255,255,0.85)">
              Digitize road inspections, capture GPS-based data, track damages,
              and generate reports — powered by MERN.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                size="large"
                variant="contained"
                color="secondary"
                onClick={() => handleNavigate("/register")}
              >
                Get Started
              </Button>
              <Button
                size="large"
                variant="outlined"
                sx={{ color: "white", borderColor: "white" }}
              >
                Request Demo
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" fontWeight="bold" textAlign="center" mb={6}>
          Key Features
        </Typography>

        <Grid container spacing={4}>
          {[
            {
              icon: <FaMapMarkerAlt size={28} color="#1976d2" />,
              title: "GPS-Based Surveys",
              desc: "Capture accurate road locations and survey routes in real time.",
            },
            {
              icon: <FaCar size={28} color="#1976d2" />,
              title: "Damage & Image Capture",
              desc: "Record potholes, cracks, and surface defects with photos.",
            },
            {
              icon: <FaChartBar size={28} color="#1976d2" />,
              title: "Automated Reports",
              desc: "Generate structured survey reports instantly.",
            },
            {
              icon: <FaUserShield size={28} color="#1976d2" />,
              title: "Role-Based Access",
              desc: "Secure access for Admins, Engineers, and Surveyors.",
            },
          ].map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card elevation={3} sx={{ height: "100%" }}>
                <CardContent>
                  <Box mb={1}>{item.icon}</Box>
                  <Typography variant="h6" mt={2}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works */}
      <Box sx={{ backgroundColor: "#f5f7fa", py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>
            How It Works
          </Typography>

          <Grid container spacing={3}>
            {[
              "Create road survey projects",
              "Assign surveyors and routes",
              "Collect field data via web or mobile",
              "Analyze data and export reports",
            ].map((step, index) => (
              <Grid size={{ xs: 12, sm: 6 }} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      {index + 1}. {step}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card
          sx={{
            p: 5,
            textAlign: "center",
            background: "linear-gradient(135deg, #0d47a1, #1976d2)",
            color: "white",
          }}
        >
          <Typography variant="h4" fontWeight="bold" mb={2}>
            Ready to Modernize Road Surveys?
          </Typography>
          <Typography mb={3}>
            Reduce paperwork and improve accuracy with digital road surveys.
          </Typography>
          <Button
            size="large"
            variant="contained"
            color="secondary"
            onClick={() => handleNavigate("/register")}
          >
            Start Now
          </Button>
        </Card>
      </Container>

      {/* Footer */}
      <Box sx={{ py: 3, backgroundColor: "#0d47a1", color: "white" }}>
        <Container>
          <Typography textAlign="center" variant="body2">
            © {new Date().getFullYear()} CADer. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </>
  );
};

export default Landing;
