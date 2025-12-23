import * as React from "react";
import * as Yup from "yup";
import {
  Box,
  Divider,
  Link,
  Typography,
  Stack,
  Card as MuiCard,
  CssBaseline,
  IconButton,
} from "@mui/material";
import { useGoogleLogin } from "@react-oauth/google";
import { styled } from "@mui/material/styles";
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
import Logo from "../../assets/logo/CADer logo-loader.png";
import BackgroundImage from "../../assets/back-ground-img.png";
import { setUser } from "../../redux/userSlice";

/* =========================
   Styled Components
========================= */
const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  maxWidth: "450px",
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  position: "relative",
  minHeight: "100vh",
  padding: theme.spacing(2),
  background: "#131344",
}));

/* =========================
   Validation Schema
========================= */
const schema = Yup.object().shape({
  type: Yup.string().oneOf(["Student", "Professional"]).required(),
  name: Yup.string().required("Full name is required"),
  email: Yup.string()
    .trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
      "Please enter a valid email address"
    )
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string().min(6).required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Confirm password is required"),
});

const initialFormValues = {
  type: "",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function SignUp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [step, setStep] = React.useState(1);
  const [formValues, setFormValues] = React.useState(initialFormValues);
  const [formErrors, setFormErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

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
    const isQuizPending = user?.type === "Student" && !user?.isQuizCompleted;

    const message = isQuizPending
      ? `Hi ${user?.name}, before getting started, please complete the quiz.`
      : `Hi ${user?.name}, everything's ready for you. Let's get started!`;

    dispatch(setUser(user));

    dispatch(
      showAlert({
        type: "success",
        message,
      })
    );

    navigate("/");
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
        type: formValues.type,
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

  return (
    <>
      <CssBaseline />
      <SignUpContainer alignItems="center" justifyContent="center">
        {/* Background */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${BackgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.25,
            zIndex: 0,
          }}
        />

        <Card sx={{ zIndex: 1 }}>
          <img src={Logo} alt="logo" width={100} />

          <Typography
            component="h1"
            variant="h4"
            sx={{ width: "100%", fontSize: "clamp(1.5rem, 10vw, 1.6rem)" }}
          >
            Sign up
          </Typography>

          {/* ================= STEP 1 ================= */}
          {step === 1 && (
            <>
              <Typography fontWeight={600}>What best describes you?</Typography>
              <Typography variant="body2" color="text.secondary">
                This helps us personalize your experience
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                {[
                  {
                    key: "Student",
                    icon: <FaUserGraduate size={26} />,
                    title: "Student",
                    desc: "Learning or academic use",
                  },
                  {
                    key: "Professional",
                    icon: <FaUserTie size={26} />,
                    title: "Professional",
                    desc: "Work or organization use",
                  },
                ].map((item) => (
                  <Box
                    key={item.key}
                    onClick={() =>
                      setFormValues((p) => ({
                        ...p,
                        type: item.key,
                      }))
                    }
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: 2,
                      cursor: "pointer",
                      border:
                        formValues.type === item.key
                          ? "2px solid #1976d2"
                          : "2px solid #ccc",
                      backgroundColor:
                        formValues.type === item.key
                          ? "rgba(25,118,210,0.08)"
                          : "transparent",
                    }}
                  >
                    {item.icon}
                    <Typography fontWeight="bold" mt={1}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.desc}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              <BasicButtons
                value="Continue"
                fullWidth
                disabled={!formValues.type}
                onClick={() => setStep(2)}
              />
            </>
          )}

          {/* ================= STEP 2 ================= */}
          {step === 2 && (
            <>
              <Stack spacing={2}>
                <BasicInput
                  label="Full Name"
                  name="name"
                  value={formValues.name}
                  error={formErrors.name}
                  onChange={handleInputChange}
                  variant="filled"
                />

                <BasicInput
                  label="Email"
                  name="email"
                  value={formValues.email}
                  error={formErrors.email}
                  onChange={handleInputChange}
                  variant="filled"
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
                  onClick={handleSubmit}
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
                />

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

                {/* <Button
                  variant="text"
                  onClick={() => setStep(1)}
                  sx={{ textTransform: "none" }}
                >
                  ← Back
                </Button> */}
              </Stack>
            </>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography textAlign="center">
            Already have an account?{" "}
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate("/login")}
            >
              Sign in
            </Link>
          </Typography>
        </Card>
      </SignUpContainer>
    </>
  );
}
