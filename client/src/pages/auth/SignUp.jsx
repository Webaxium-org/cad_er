import * as React from "react";
import * as Yup from "yup";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { Box, Divider, Typography, IconButton } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { GoogleIcon } from "./components/CustomIcons";
import { showAlert } from "../../redux/alertSlice";
import { stopLoading } from "../../redux/loadingSlice";
import { handleFormError } from "../../utils/handleFormError";
import { googleLogin, registerUser } from "../../services/indexServices";
import BasicButtons from "../../components/BasicButton";
import BasicInput from "../../components/BasicInput";
import { setUser } from "../../redux/userSlice";
import AuthBrand from "./components/AuthBrand";
import SurveyBackground from "./components/SurveyBackground";
import LoginRobot from "./components/LoginRobot";
import "./signIn.css";

const inputSx = {
  backgroundColor: "#fff", color: "#080e48", borderColor: "#bfc4ff", height: 50,
  "&:hover": { backgroundColor: "#fff", borderColor: "#6668f6" },
  "&.Mui-focused": { backgroundColor: "#fff", borderColor: "#5353ed" },
  "& input::placeholder": { color: "#99999f", opacity: 1 },
};

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
  const reduceMotion = useReducedMotion();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formValues, setFormValues] = React.useState(initialFormValues);
  const [formErrors, setFormErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);



  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  React.useEffect(() => {
    dispatch(stopLoading());
  }, [dispatch]);

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
      dispatch(showAlert({
        type: "error",
        message: "Google sign-in failed",
      }));
    },
  });

  return (
    <main className="signin-page signin-page-survey register-page">
      <SurveyBackground />
      <div className="signin-layout">
        <Box component="form" className="signin-card" noValidate onSubmit={(event) => { event.preventDefault(); handleSubmit(); }}>
          <RouterLink to="/" className="signin-mobile-logo" aria-label="CADER home"><AuthBrand /></RouterLink>
          <Typography component="h1" className="signin-title">Sign up</Typography>
          <div className="signin-fields">
            {[
              { name: "name", label: "Full Name", type: "text", placeholder: "Full Name", autoComplete: "name" },
              { name: "email", label: "Email", type: "email", placeholder: "name@gmail.com", autoComplete: "email" },
              { name: "password", label: "Password", type: showPassword ? "text" : "password", placeholder: "Password", autoComplete: "new-password" },
              { name: "confirmPassword", label: "Confirm Password", type: showConfirmPassword ? "text" : "password", placeholder: "Confirm password", autoComplete: "new-password" },
            ].map((field) => {
              const isPassword = field.name === "password" || field.name === "confirmPassword";
              const visible = field.name === "password" ? showPassword : showConfirmPassword;
              return (
                <BasicInput key={field.name} {...field}
                  value={formValues[field.name]} error={formErrors[field.name] || ""}
                  onChange={handleInputChange} labelColor="#080e48" errorTextColor="#bd2d43" sx={inputSx}
                  endAdornment={isPassword ? (
                    <IconButton type="button" size="small" aria-label={`${visible ? "Hide" : "Show"} ${field.label.toLowerCase()}`}
                      aria-pressed={visible} sx={{ color: "#62659c" }}
                      onClick={() => field.name === "password" ? setShowPassword((value) => !value) : setShowConfirmPassword((value) => !value)}>
                      {visible ? <FaEyeSlash /> : <FaEye />}
                    </IconButton>
                  ) : undefined}
                />
              );
            })}
            <BasicButtons value="Create Account" loading={loading} type="submit" fullWidth
              sx={{ height: 49, color: "#fff", background: "linear-gradient(100deg, #5858ed, #413cea)",
                boxShadow: "0 8px 17px rgba(72, 68, 227, .18)",
                "&:hover": { background: "linear-gradient(100deg, #4d4ddf, #3832da)" } }} />
          </div>
          <Divider className="signin-divider">or</Divider>
          <BasicButtons value="Sign up with Google" variant="outlined" fullWidth onClick={() => googleAuth()}
            startIcon={<GoogleIcon />}
            sx={{ height: 49, color: "#080e48", borderColor: "#7777ff", backgroundColor: "#fff",
              "&:hover": { borderColor: "#5050ed", backgroundColor: "#f7f7ff" } }} />
          <Typography className="signin-signup">Already have an account? <RouterLink to="/login">Sign in</RouterLink></Typography>
          <Typography className="signin-legal">By signing up you agree to our <RouterLink to="/terms">Terms &amp; Conditions</RouterLink> and <RouterLink to="/privacy">Privacy Policy</RouterLink></Typography>
        </Box>
        <section className="signin-hero register-hero" aria-label="Engineering the Future">
          <RouterLink to="/" className="signin-hero-logo" aria-label="CADER home"><AuthBrand /></RouterLink>
          <h2>Engineering the<br /><span className="signin-together">Future
            <svg className="signin-together-underline" viewBox="0 0 100 10" aria-hidden="true" focusable="false">
              <Motion.path initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 1.5, delay: 0.5 }}
                d="M0 5 Q 25 0, 50 5 T 100 5" fill="transparent" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span></h2>
          <div className="signin-robot-row">
            <LoginRobot />
            <div className="signin-speech"><strong>CADER</strong><br />I turn your field observations into precise cut-and-fill reports—so you can finish faster.</div>
          </div>
          <p className="signin-hero-note">Transforming raw spatial data into precision infrastructure. CADer empowers surveyors with real-time topographical accuracy.</p>
          <RouterLink to="/login" className="signin-hero-cta">Sign in – let’s pick up where you left off!</RouterLink>
        </section>
      </div>
    </main>
  );
}
