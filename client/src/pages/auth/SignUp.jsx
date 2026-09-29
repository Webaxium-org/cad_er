import * as React from "react";
import * as Yup from "yup";
import { motion } from "framer-motion";
import {
  Box,
  Divider,
  Typography,
  Stack,
  Card as MuiCard,
  IconButton,
  Container,
  Grid,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { styled, useTheme } from "@mui/material/styles";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUserGraduate, FaUserTie } from "react-icons/fa";
import { GoogleIcon } from "./components/CustomIcons";

import { showAlert } from "../../redux/alertSlice";
import { stopLoading } from "../../redux/loadingSlice";
import { handleFormError } from "../../utils/handleFormError";
import { googleLogin, registerUser } from "../../services/indexServices";
import BasicButtons from "../../components/BasicButton";
import BasicInput from "../../components/BasicInput";
import { setUser } from "../../redux/userSlice";
import lightLogo from "../../assets/logo/cader_logo.png";
import darkLogo from "../../assets/logo/cader_logo_2.png";

/* =========================
   Styled Components
========================= */
const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(5),
  gap: theme.spacing(3),
  margin: "auto",
  borderRadius: "24px",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)",
  [theme.breakpoints.up("sm")]: {
    maxWidth: "480px",
  },
}));

const StyledLink = styled(RouterLink)(({ theme }) => ({
  fontSize: 15,
  color: "#1976d2",
  textDecoration: "none",
  position: "relative",
  transition: "color 0.2s ease",
  width: "fit-content",
  fontWeight: 500,
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

/* =========================
   Validation Schema
========================= */
const schema = Yup.object().shape({
  name: Yup.string().required("Full name is required"),
  email: Yup.string()
    .trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
      "Please enter a valid email address",
    )
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string().min(6).required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Confirm password is required"),
});

const initialFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function SignUp() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formValues, setFormValues] = React.useState(initialFormValues);
  const [formErrors, setFormErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  const [coords, setCoords] = React.useState({ x: "42.3601", y: "71.0589" });

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  React.useEffect(() => {
    dispatch(stopLoading());
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormValues((prev) => {
      const newValues = { ...prev, [name]: value };

      // Validate the current field with full form context
      Yup.reach(schema, name)
        .validate(value, { context: newValues, parent: newValues })
        .then(() => {
          setFormErrors((p) => ({ ...p, [name]: null }));
        })
        .catch((err) => {
          setFormErrors((p) => ({ ...p, [name]: err.message }));
        });

      // If confirmPassword is being changed, also re-validate password
      if (name === "password" && newValues.confirmPassword) {
        Yup.reach(schema, "confirmPassword")
          .validate(newValues.confirmPassword, {
            context: newValues,
            parent: newValues,
          })
          .then(() => {
            setFormErrors((p) => ({ ...p, confirmPassword: null }));
          })
          .catch((err) => {
            setFormErrors((p) => ({ ...p, confirmPassword: err.message }));
          });
      }

      return newValues;
    });
  };

  const handleSuccessLogin = (user) => {
    const message = "Signup successful!";

    dispatch(setUser(user));

    dispatch(
      showAlert({
        type: "success",
        message,
      }),
    );

    navigate("/onboarding/account-type");
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await schema.validate(formValues, { abortEarly: false });
      const { data } = await registerUser(formValues);

      handleSuccessLogin(data.user);
    } catch (error) {
      handleFormError(error, setFormErrors, dispatch, navigate);
    } finally {
      setLoading(false);
    }
  };

  const googleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const { data } = await googleLogin({
        accessToken: tokenResponse.access_token,
        action: "register",
      });

      handleSuccessLogin(data.user);
    },
    onError: () => {
      showAlert({
        type: "error",
        message: "Google sign-in failed",
      });
    },
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCoords({
        x: (42.3601 + Math.random() * 0.001).toFixed(4),
        y: (71.0589 + Math.random() * 0.001).toFixed(4),
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        overflowX: "auto",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          display: "flex",
          flexGrow: 1,
          minHeight: "880px",
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            position: "relative",
            bgcolor: "#000b2e", // Slightly deeper navy for "midnight" surveying feel
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* 1. Topographical Contour Lines (Replaces Blueprint Grid) */}
          <Box
            component={motion.div}
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 1, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            sx={{
              position: "absolute",
              inset: -100, // Oversized to allow for rotation/scale animation
              opacity: 0.15,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='800' height='800' viewBox='0 0 800 800' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='white' stroke-width='1'%3E%3Cpath d='M-100 100 Q 100 50 300 100 T 700 100 T 1100 100'/%3E%3Cpath d='M-100 200 Q 50 250 250 200 T 650 200 T 1050 200'/%3E%3Cpath d='M-100 300 Q 200 280 400 320 T 800 300 T 1200 300'/%3E%3Cpath d='M-100 400 Q 150 350 350 400 T 750 400 T 1150 400'/%3E%3Cpath d='M-100 500 Q 350 550 550 500 T 950 500 T 1350 500'/%3E%3Cpath d='M-100 600 Q 100 650 300 600 T 700 600 T 1100 600'/%3E%3Cpath d='M-100 700 Q 450 750 650 700 T 1050 700'/%3E%3Cpath d='M200 -100 Q 250 100 200 300 T 200 700'/%3E%3Cpath d='M400 -100 Q 350 150 400 400 T 400 900'/%3E%3Cpath d='M600 -100 Q 650 100 600 300 T 600 700'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "1000px 1000px",
              maskImage:
                "radial-gradient(circle at center, black 30%, transparent 80%)",
              zIndex: 0,
            }}
          />

          {/* 2. Abstract Background Orbs */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(30, 64, 175, 0.2) 0%, transparent 50%)",
              zIndex: 1,
            }}
          />

          {/* 3. Tech UI Overlays */}
          <Box
            sx={{
              position: "absolute",
              inset: 40,
              zIndex: 4,
              pointerEvents: "none",
            }}
          >
            {/* Corner Crosshairs */}
            {[
              {
                top: 0,
                left: 0,
                borderLeft: "2px solid",
                borderTop: "2px solid",
              },
              {
                top: 0,
                right: 0,
                borderRight: "2px solid",
                borderTop: "2px solid",
              },
              {
                bottom: 0,
                left: 0,
                borderLeft: "2px solid",
                borderBottom: "2px solid",
              },
              {
                bottom: 0,
                right: 0,
                borderRight: "2px solid",
                borderBottom: "2px solid",
              },
            ].map((style, idx) => (
              <Box
                key={idx}
                sx={{
                  position: "absolute",
                  width: 20,
                  height: 20,
                  borderColor: "rgba(255,255,255,0.3)",
                  ...style,
                }}
              />
            ))}

            {/* Live Data readout */}
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                color: "rgba(255,255,255,0.5)",
                fontFamily: "monospace",
                fontSize: "11px",
                letterSpacing: "1px",
              }}
            >
              LAT: {coords.x} <br />
              LNG: {coords.y}
            </Box>

            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                color: "rgba(255,255,255,0.5)",
                fontFamily: "monospace",
                fontSize: "11px",
                textAlign: "right",
                letterSpacing: "1px",
              }}
            >
              SYSTEM: ACTIVE
              <br />
              MESH_PRECISION: 0.002mm
            </Box>
          </Box>

          <Grid container spacing={6} maxWidth={1100}>
            <Grid size={{ xs: 12, md: 6 }} width={500}>
              {/* LEFT SIDE */}
              <Box
                component="form"
                noValidate
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                    zIndex: 4000,
                    p: { xs: 2, md: 3 },
                  }}
                >
                  <Card variant="outlined" sx={{ zIndex: 1 }}>
                    <Stack spacing={1}>
                      <Typography
                        variant="h6"
                        color="black"
                        mb={0}
                        sx={{
                          fontWeight: 900,
                          fontSize: "1.4rem",
                          cursor: "pointer",
                          display: { xs: "block", md: "none" },
                        }}
                        onClick={() => navigate("/")}
                      >
                        <Box component="img" src={lightLogo} alt="Cader" sx={{ width: 52, height: 52, objectFit: "contain" }} />
                      </Typography>
                      <Typography
                        component="h1"
                        variant="h4"
                        sx={{
                          width: "100%",
                          fontWeight: 700,
                          fontSize: "clamp(2rem, 10vw, 2rem)",
                        }}
                      >
                        Sign up
                      </Typography>
                    </Stack>

                    <Stack spacing={2}>
                      <BasicInput
                        label="Full Name"
                        name="name"
                        value={formValues.name}
                        error={formErrors.name}
                        onChange={handleInputChange}
                        variant="filled"
                        placeholder="Full Name"
                      />

                      <BasicInput
                        label="Email"
                        name="email"
                        value={formValues.email}
                        error={formErrors.email}
                        onChange={handleInputChange}
                        variant="filled"
                        placeholder="name@gmail.com"
                      />

                      {/* Password */}
                      <Box position="relative">
                        <BasicInput
                          label="Password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formValues.password}
                          error={formErrors.password}
                          onChange={handleInputChange}
                          variant="filled"
                          placeholder="********"
                        />
                        <IconButton
                          onClick={() => setShowPassword((p) => !p)}
                          sx={{ position: "absolute", top: 25, right: 8 }}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </IconButton>
                      </Box>

                      {/* Confirm Password */}
                      <Box position="relative">
                        <BasicInput
                          label="Confirm Password"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formValues.confirmPassword}
                          error={formErrors.confirmPassword}
                          onChange={handleInputChange}
                          variant="filled"
                          placeholder="********"
                        />
                        <IconButton
                          onClick={() => setShowConfirmPassword((p) => !p)}
                          sx={{ position: "absolute", top: 25, right: 8 }}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </IconButton>
                      </Box>

                      <BasicButtons
                        value="Create Account"
                        fullWidth
                        loading={loading}
                        sx={{
                          textTransform: "none",
                          height: "2.5rem",
                          color: "white",
                          backgroundColor: "hsl(220, 35%, 3%)",
                          backgroundImage:
                            "linear-gradient(to bottom, hsl(220, 20%, 25%), hsl(220, 30%, 6%))",
                          boxShadow:
                            "inset 0 1px 0 hsl(220, 20%, 35%), inset 0 -1px 0 1px hsl(220, 0%, 0%)",
                          border: "1px solid hsl(220, 20%, 25%)",
                          "&:hover": {
                            backgroundImage: "none",
                            backgroundColor: "rgb(51, 60, 77)",
                            boxShadow: "none",
                          },
                        }}
                        type="submit"
                      />

                      <Divider>or</Divider>

                      {/* ✅ Google Register Button */}
                      <BasicButtons
                        fullWidth={true}
                        variant="outlined"
                        onClick={() => googleAuth()}
                        startIcon={<GoogleIcon />}
                        value={"Sign in with Google"}
                        sx={{
                          textTransform: "none",
                          height: "2.5rem",
                          color: "black",
                          backgroundColor: "#f5f6fa4d",
                          boxShadow: "none",
                          transition:
                            "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
                          border: "1px solid hsl(220, 20%, 88%)",
                          "&:hover": {
                            backgroundImage: "none",
                            backgroundColor: "hsl(220, 30%, 94%)",
                            borderColor: "hsl(220, 20%, 80%)",
                          },
                        }}
                      />
                    </Stack>

                    <Typography textAlign="center">
                      Already have an account?{" "}
                      <StyledLink to={"/login"}>Sign in</StyledLink>
                    </Typography>
                  </Card>
                </Box>
              </Box>
            </Grid>

            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{
                display: { xs: "none", md: "flex" },
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* Hero Content */}
              <Box
                sx={{
                  zIndex: 10,
                  textAlign: "center",
                  p: 6,
                  maxWidth: 600,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <Typography
                    variant="h6"
                    color="white"
                    sx={{
                      fontWeight: 900,
                      fontSize: "1.4rem",
                      cursor: "pointer",
                      mb: 4,
                    }}
                    onClick={() => navigate("/")}
                  >
                    <Box component="img" src={darkLogo} alt="Cader" sx={{ width: 60, height: 60, objectFit: "contain" }} />
                  </Typography>

                  <Typography
                    variant="h2"
                    color="white"
                    sx={{
                      fontWeight: 800,
                      mb: 2,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                    }}
                  >
                    Engineering the{" "}
                    <span style={{ color: "#60A5FA", position: "relative" }}>
                      Future
                      <svg
                        style={{
                          position: "absolute",
                          bottom: -5,
                          left: 0,
                          width: "100%",
                        }}
                        viewBox="0 0 100 10"
                      >
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                          d="M0 5 Q 25 0, 50 5 T 100 5"
                          fill="transparent"
                          stroke="#60A5FA"
                          strokeWidth="2"
                        />
                      </svg>
                    </span>
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      color: "rgba(255,255,255,0.6)",
                      fontWeight: 300,
                      lineHeight: 1.6,
                      maxWidth: 450,
                      mx: "auto",
                    }}
                  >
                    Transforming raw spatial data into precision infrastructure.
                    CADer empowers surveyors with real-time topographical
                    accuracy.
                  </Typography>
                </motion.div>
              </Box>
            </Grid>
          </Grid>

          {/* 4. Animated Surveying Orbits */}
          {[...Array(2)].map((_, i) => (
            <Box
              key={i}
              component={motion.div}
              animate={{
                rotate: i % 2 === 0 ? 360 : -360,
              }}
              transition={{
                duration: 40 + i * 20,
                repeat: Infinity,
                ease: "linear",
              }}
              sx={{
                position: "absolute",
                width: 600 + i * 200,
                height: 600 + i * 200,
                border: "1px dashed rgba(255,255,255,0.08)",
                borderRadius: "50%",
                zIndex: 2,
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: -4,
                  width: 8,
                  height: 8,
                  bgcolor: "#60A5FA",
                  borderRadius: "50%",
                  boxShadow: "0 0 15px #60A5FA",
                }}
              />
            </Box>
          ))}

          {/* 5. Scanning Laser Line */}
          <Box
            component={motion.div}
            animate={{ top: ["-10%", "110%"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.4), transparent)",
              boxShadow: "0 0 20px 2px rgba(96, 165, 250, 0.2)",
              zIndex: 5,
            }}
          />
        </Box>
      </Box>
    </Container>
  );
}
