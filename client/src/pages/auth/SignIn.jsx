import * as React from "react";
import * as Yup from "yup";
import { motion } from "framer-motion";
import {
  Box,
  Divider,
  Typography,
  Card as MuiCard,
  Container,
  Grid,
  Stack,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { styled } from "@mui/material/styles";
import { useGoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { stopLoading } from "../../redux/loadingSlice";
import { googleLogin, loginUser } from "../../services/indexServices";
import { GoogleIcon, FacebookIcon } from "./components/CustomIcons";
import { showAlert } from "../../redux/alertSlice";
import { handleFormError } from "../../utils/handleFormError";
import { useNavigate } from "react-router-dom";
import { setUser } from "../../redux/userSlice";
import BasicButtons from "../../components/BasicButton";
import BasicInput from "../../components/BasicInput";
import { useTheme } from "@mui/material/styles";
import lightLogo from "../../assets/logo/cader_logo.png";
import darkLogo from "../../assets/logo/cader_logo_2.png";
import ContourLines from "./components/ContourLines";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "min(480px, calc(100vw - 32px))",
  padding: theme.spacing(5),
  gap: theme.spacing(3),
  margin: "auto",
  borderRadius: "24px",
  color: "#ffffff",
  background: "linear-gradient(145deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.08))",
  backdropFilter: "blur(24px) saturate(140%)",
  WebkitBackdropFilter: "blur(24px) saturate(140%)",
  border: "1px solid rgba(255, 255, 255, 0.5)",
  boxShadow: "0 24px 64px rgba(30, 27, 75, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
  "& .MuiDivider-root": {
    color: "#ffffff",
    "&::before, &::after": { borderColor: "rgba(255, 255, 255, 0.65)" },
  },
  "& a": { color: "#e0e7ff" },
  "& a:hover": { color: "#ffffff" },
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

const schema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
      "Please enter a valid email address",
    )
    .email("Please enter a valid email address")
    .required("Email is required"),

  password: Yup.string()
    .min(6, "Password must be at least 6 characters long")
    .required("Password is required"),
});

const inputDetails = [
  {
    label: "Email",
    name: "email",
    type: "text",
    placeholder: "name@gmail.com",
  },
  {
    label: "Password",
    name: "password",
    type: "password",
    placeholder: "********",
  },
];

const initialFormValues = {
  email: "",
  password: "",
};

const SignIn = () => {
  const theme = useTheme();

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [inputData, setInputData] = React.useState(inputDetails);

  const [formValues, setFormValues] = React.useState(initialFormValues);

  const [formErrors, setFormErrors] = React.useState(null);

  const [loading, setLoading] = React.useState(false);

  const [coords, setCoords] = React.useState({ x: "42.3601", y: "71.0589" });

  const handleSuccessLogin = (user) => {
    const isQuizPending = user?.type === "Student" && !user?.isQuizCompleted;

    const message = isQuizPending
      ? `Hi ${user?.name}, before getting started, please complete the quiz.`
      : `Hi ${user?.name}, everything's ready for you. Let's get started!`;

    dispatch(setUser(user));

    dispatch(
      showAlert({
        type: "success",
        message,
      }),
    );

    navigate("/");
  };

  const handleInputChange = async (event) => {
    const { name, value } = event.target;

    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    try {
      await Yup.reach(schema, name).validate(value);

      setFormErrors({ ...formErrors, [name]: null });
    } catch (error) {
      setFormErrors({ ...formErrors, [name]: error.message });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await schema.validate(formValues, { abortEarly: false });

      const { data } = await loginUser(formValues);

      handleSuccessLogin(data.user);
    } catch (error) {
      if (error?.response?.data?.message === "Invalid credentials") {
        const innerError = [
          { path: "email", message: error?.response?.data?.message },
          { path: "password", message: error?.response?.data?.message },
        ];

        error.inner = innerError;
      }

      handleFormError(error, setFormErrors, dispatch, navigate);
    } finally {
      setLoading(false);
    }
  };

  const googleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const { data } = await googleLogin({
        accessToken: tokenResponse.access_token,
        action: "login",
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
    dispatch(stopLoading());
  }, []);

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
          minHeight: "750px",
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            position: "relative",
            bgcolor: "#000b2e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Terrain contour lines */}
          <ContourLines />

          {/* 2. Abstract Background Orbs */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 20% 20%, rgba(129, 140, 248, 0.32) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(79, 70, 229, 0.55) 0%, transparent 50%)",
              zIndex: 1,
              pointerEvents: "none",
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
            <Grid
              size={{ xs: 12, md: 6 }}
              width={500}
              sx={{ display: "flex", alignItems: "center" }}
            >
              {/* LEFT SIDE */}
              <Box
                component="form"
                sx={{ width: "100%" }}
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
                        component={RouterLink}
                        to="/"
                        variant="h6"
                        color="black"
                        mb={0}
                        sx={{
                          fontWeight: 900,
                          fontSize: "1.4rem",
                          cursor: "pointer",
                          display: { xs: "block", md: "none" },
                          textDecoration: "none",
                        }}
                      >
                        <Box
                          component="img"
                          src={lightLogo}
                          alt="Cader"
                          sx={{ width: 52, height: 52, objectFit: "contain" }}
                        />
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
                        Sign in
                      </Typography>
                    </Stack>

                    {/* Email & Password */}
                    <Stack spacing={2}>
                      {inputData.map((input, index) => (
                        <Box
                          sx={{
                            "& .MuiOutlinedInput-root, & .MuiFilledInput-root":
                              {
                                borderRadius: "15px",
                              },
                            width: "100%",
                          }}
                          key={index}
                        >
                          <BasicInput
                            {...input}
                            labelColor="white"
                            errorTextColor="#fecdd3"
                            value={formValues[input.name] || ""}
                            error={(formErrors && formErrors[input.name]) || ""}
                            variant="filled"
                            sx={{
                              width: "100%",
                              color: "#ffffff",
                              backgroundColor: "rgba(255, 255, 255, 0.12)",
                              borderColor: "rgba(255, 255, 255, 0.55)",
                              "&:hover, &.Mui-focused": {
                                backgroundColor: "rgba(255, 255, 255, 0.2)",
                                borderColor: "#ffffff",
                              },
                              "& input::placeholder": { color: "rgba(255, 255, 255, 0.75)", opacity: 1 },
                              "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus": {
                                WebkitBoxShadow: "0 0 0 100px #56618c inset",
                                WebkitTextFillColor: "#ffffff",
                                caretColor: "#ffffff",
                              },
                            }}
                            onChange={(e) => handleInputChange(e)}
                          />
                        </Box>
                      ))}

                      <BasicButtons
                        value={"Sign in"}
                        sx={{
                          textTransform: "none",
                          height: "2.5rem",
                          color: "#3730a3",
                          backgroundColor: "#ffffff",
                          backgroundImage: "linear-gradient(90deg, #ffffff, #e0e7ff)",
                          boxShadow: "0 8px 24px rgba(49, 46, 129, 0.2)",
                          border: "1px solid rgba(255, 255, 255, 0.8)",
                          "&:hover": {
                            backgroundImage: "linear-gradient(90deg, #eef2ff, #c7d2fe)",
                            boxShadow: "0 10px 28px rgba(49, 46, 129, 0.28)",
                          },
                        }}
                        fullWidth={true}
                        loading={loading}
                        type="submit"
                      />

                      <Box display={"flex"} justifyContent={"center"}>
                        <StyledLink
                          to={"#"}
                          onClick={() => alert("This feature in progress !!")}
                        >
                          Forgot your password?
                        </StyledLink>
                      </Box>
                    </Stack>

                    <Divider>or</Divider>

                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      {/* ✅ Google Login Button */}
                      <BasicButtons
                        fullWidth={true}
                        variant="outlined"
                        onClick={() => googleAuth()}
                        startIcon={<GoogleIcon />}
                        value={"Sign in with Google"}
                        sx={{
                          textTransform: "none",
                          height: "2.5rem",
                          color: "#ffffff",
                          backgroundColor: "rgba(255, 255, 255, 0.12)",
                          boxShadow: "none",
                          transition:
                            "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
                          border: "1px solid rgba(255, 255, 255, 0.55)",
                          "& .MuiButton-startIcon": {
                            bgcolor: "#ffffff",
                            borderRadius: "50%",
                            p: 0.4,
                            mr: 1,
                          },
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.2)",
                            borderColor: "#ffffff",
                          },
                        }}
                      />

                      <Typography sx={{ textAlign: "center" }}>
                        Don&apos;t have an account?{" "}
                        <StyledLink to={"/register"}>Sign up</StyledLink>
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          textAlign: "center",
                          color: "rgba(255, 255, 255, 0.85)",
                          display: "block",
                        }}
                      >
                        By signing in you agree to our{" "}
                        <StyledLink
                          to="/terms"
                          style={{ fontSize: 12 }}
                        >
                          Terms &amp; Conditions
                        </StyledLink>{" "}
                        and{" "}
                        <StyledLink
                          to="/privacy"
                          style={{ fontSize: 12 }}
                        >
                          Privacy Policy
                        </StyledLink>
                      </Typography>
                    </Box>
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
                    component={RouterLink}
                    to="/"
                    variant="h6"
                    color="white"
                    sx={{
                      fontWeight: 900,
                      fontSize: "1.4rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      position: "relative",
                      zIndex: 11,
                      textDecoration: "none",
                    }}
                  >
                    <Box
                      component="img"
                      src={darkLogo}
                      alt="Cader"
                      sx={{ width: 60, height: 60, objectFit: "contain" }}
                    />
                  </Typography>

                  <Typography
                    variant="h3"
                    color="white"
                    sx={{
                      fontWeight: 800,
                      mb: 3,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                    }}
                  >
                    We're better{" "}
                    <span style={{ color: "#c7d2fe" }}>together!</span>
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: "rgba(255,255,255,0.75)",
                      fontWeight: 400,
                      lineHeight: 1.7,
                      maxWidth: 450,
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    I'm CADER, your AI integrated terrain imagining system. I
                    deliver precise cut-and-fill quantities before even you
                    pack-up your gear.
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: "rgba(255,255,255,0.65)",
                      fontWeight: 400,
                      lineHeight: 1.7,
                      maxWidth: 450,
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    Whether it's intricate waterways, rugged pipelines, complex
                    rail networks, or vast highway arteries, I help you handle
                    it all with unmatched speed and accuracy.
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: "rgba(255,255,255,0.65)",
                      fontWeight: 400,
                      lineHeight: 1.7,
                      maxWidth: 450,
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    From initial field observations to final volume reports. I
                    combine deep domain knowledge in levelling, proposal
                    generation, and quantity calculation with modern cloud and
                    mobile technology.
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: "rgba(255,255,255,0.55)",
                      fontWeight: 400,
                      lineHeight: 1.7,
                      maxWidth: 450,
                      mx: "auto",
                      fontStyle: "italic",
                    }}
                  >
                    Now, let's sign in to eliminate post-processing
                    wrestling—and get you back some quality family time.
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      color: "#c7d2fe",
                      fontWeight: 700,
                      mt: 3,
                    }}
                  >
                    Sign up – let's wrap up the race!
                  </Typography>
                </motion.div>
              </Box>
            </Grid>
          </Grid>

          {/* 4. Animated Surveying Orbits */}
          {[...Array(4)].map((_, i) => (
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
                pointerEvents: "none",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: -4,
                  width: 8,
                  height: 8,
                  bgcolor: "#a5b4fc",
                  borderRadius: "50%",
                  boxShadow: "0 0 15px #a5b4fc",
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
                "linear-gradient(90deg, transparent, rgba(165, 180, 252, 0.4), transparent)",
              boxShadow: "0 0 20px 2px rgba(165, 180, 252, 0.2)",
              zIndex: 5,
              pointerEvents: "none",
            }}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default SignIn;
