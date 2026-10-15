import * as React from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import * as Yup from "yup";
import { Box, Typography, Divider } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { stopLoading } from "../../redux/loadingSlice";
import { googleLogin, loginUser } from "../../services/indexServices";
import { GoogleIcon } from "./components/CustomIcons";
import { showAlert } from "../../redux/alertSlice";
import { handleFormError } from "../../utils/handleFormError";
import { setUser } from "../../redux/userSlice";
import BasicButtons from "../../components/BasicButton";
import BasicInput from "../../components/BasicInput";
import AuthBrand from "./components/AuthBrand";
import SurveyBackground from "./components/SurveyBackground";
import LoginRobot from "./components/LoginRobot";
import "./signIn.css";

const schema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters long")
    .required("Password is required"),
});

export default function SignIn() {
  const reduceMotion = useReducedMotion();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formValues, setFormValues] = React.useState({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    dispatch(stopLoading());
  }, [dispatch]);

  const handleSuccessLogin = (user) => {
    const isQuizPending = user?.type === "Student" && !user?.isQuizCompleted;
    dispatch(setUser(user));
    dispatch(
      showAlert({
        type: "success",
        message: isQuizPending
          ? `Hi ${user?.name}, before getting started, please complete the quiz.`
          : `Hi ${user?.name}, everything's ready for you. Let's get started!`,
      }),
    );
    navigate("/");
  };

  const handleInputChange = async (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    try {
      await Yup.reach(schema, name).validate(value);
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    } catch (error) {
      setFormErrors((prev) => ({ ...prev, [name]: error.message }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await schema.validate(formValues, { abortEarly: false });
      const { data } = await loginUser(formValues);
      handleSuccessLogin(data.user);
    } catch (error) {
      if (error?.response?.data?.message === "Invalid credentials") {
        error.inner = ["email", "password"].map((path) => ({
          path,
          message: "Invalid credentials",
        }));
      }
      handleFormError(error, setFormErrors, dispatch, navigate);
    } finally {
      setLoading(false);
    }
  };

  const googleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const { data } = await googleLogin({
          accessToken: tokenResponse.access_token,
          action: "login",
        });
        handleSuccessLogin(data.user);
      } catch (error) {
        handleFormError(error, setFormErrors, dispatch, navigate);
      }
    },
    onError: () =>
      dispatch(showAlert({ type: "error", message: "Google sign-in failed" })),
  });

  return (
    <main className="signin-page signin-page-survey">
      <SurveyBackground />
      <div className="signin-layout">
        <Box
          component="form"
          className="signin-card"
          noValidate
          onSubmit={handleSubmit}
        >
          <RouterLink
            to="/"
            className="signin-mobile-logo"
            aria-label="CADER home"
          >
            <AuthBrand />
          </RouterLink>
          <Typography component="h1" className="signin-title">
            Sign in
          </Typography>
          <div className="signin-fields">
            {[
              {
                name: "email",
                label: "Email",
                type: "email",
                placeholder: "name@gmail.com",
              },
              {
                name: "password",
                label: "Password",
                type: "password",
                placeholder: "••••••••",
              },
            ].map((field) => (
              <BasicInput
                key={field.name}
                {...field}
                value={formValues[field.name]}
                onChange={handleInputChange}
                error={formErrors[field.name] || ""}
                labelColor="#080e48"
                errorTextColor="#bd2d43"
                sx={{
                  backgroundColor: "#fff",
                  color: "#080e48",
                  borderColor: "#bfc4ff",
                  height: 50,
                  "&:hover": {
                    backgroundColor: "#fff",
                    borderColor: "#6668f6",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "#fff",
                    borderColor: "#5353ed",
                  },
                  "& input::placeholder": { color: "#99999f", opacity: 1 },
                }}
              />
            ))}
            <BasicButtons
              value="Sign in"
              loading={loading}
              type="submit"
              fullWidth
              sx={{
                height: 49,
                color: "#fff",
                background: "linear-gradient(100deg, #5858ed, #413cea)",
                boxShadow: "0 8px 17px rgba(72, 68, 227, .18)",
                "&:hover": {
                  background: "linear-gradient(100deg, #4d4ddf, #3832da)",
                },
              }}
            />
            <RouterLink
              to="#"
              className="signin-forgot"
              onClick={(event) => {
                event.preventDefault();
                window.alert("This feature in progress !!");
              }}
            >
              Forgot your password?
            </RouterLink>
          </div>
          <Divider className="signin-divider">or</Divider>
          <BasicButtons
            value="Sign in with Google"
            variant="outlined"
            fullWidth
            onClick={() => googleAuth()}
            startIcon={<GoogleIcon />}
            sx={{
              height: 49,
              color: "#080e48",
              borderColor: "#7777ff",
              backgroundColor: "#fff",
              "&:hover": { borderColor: "#5050ed", backgroundColor: "#f7f7ff" },
            }}
          />
          <Typography className="signin-signup">
            Don&apos;t have an account?{" "}
            <RouterLink to="/register">Sign up</RouterLink>
          </Typography>
          <Typography className="signin-legal">
            By signing in you agree to our{" "}
            <RouterLink to="/terms">Terms &amp; Conditions</RouterLink> and{" "}
            <RouterLink to="/privacy">Privacy Policy</RouterLink>
          </Typography>
        </Box>

        <section className="signin-hero" aria-label="Welcome to CADER">
          <RouterLink
            to="/"
            className="signin-hero-logo"
            aria-label="CADER home"
          >
            <AuthBrand />
          </RouterLink>
          <h2>
            Hey!
            <br />
            We’re better{" "}
            <span className="signin-together">
              together!
              <svg
                className="signin-together-underline"
                viewBox="0 0 100 10"
                aria-hidden="true"
                focusable="false"
              >
                <Motion.path
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 1.5, delay: 0.5 }
                  }
                  d="M0 5 Q 25 0, 50 5 T 100 5"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </span>
          </h2>
          <div className="signin-robot-row">
            <LoginRobot />
            <div className="signin-speech">
              <strong>CADER</strong>
              <br />I turn your field observations into precise cut-and-fill
              reports—so you can finish faster.
            </div>
          </div>
          <p className="signin-hero-note">
            Now, let’s sign in to eliminate post-processing wrestling—and get
            you back some quality family time.
          </p>
          <RouterLink to="/register" className="signin-hero-cta">
            Sign up – let’s wrap up the race!
          </RouterLink>
        </section>
      </div>
    </main>
  );
}
