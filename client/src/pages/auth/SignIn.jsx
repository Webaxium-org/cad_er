import * as React from "react";
import * as Yup from "yup";
import {
  Box,
  Divider,
  Link,
  Typography,
  Stack,
  Card as MuiCard,
  Button,
  CssBaseline,
} from "@mui/material";
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
import Logo from "../../assets/logo/CADer logo-loader.png";
import BackgroundImage from "../../assets/back-ground-img.png";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  [theme.breakpoints.up("sm")]: {
    maxWidth: "450px",
  },
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  position: "relative",
  height: "calc((1 - var(--template-frame-height, 0)) * 100vh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  overflow: "hidden",
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  background: "#131344",
}));

const schema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
      "Please enter a valid email address"
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
  },
  {
    label: "Password",
    name: "password",
    type: "password",
  },
];

const initialFormValues = {
  email: "",
  password: "",
};

export default function SignIn() {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [inputData, setInputData] = React.useState(inputDetails);

  const [formValues, setFormValues] = React.useState(initialFormValues);

  const [formErrors, setFormErrors] = React.useState(null);

  const [loading, setLoading] = React.useState(false);

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

  return (
    <>
      <CssBaseline enableColorScheme />
      <SignInContainer
        direction="column"
        justifyContent="center"
        alignItems="center"
        minHeight={"660px !important"}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${BackgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.25,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        <Card variant="outlined" sx={{ zIndex: 1 }}>
          <img src={Logo} alt="logo" width={100} />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: "100%", fontSize: "clamp(1.5rem, 10vw, 1.6rem)" }}
          >
            Sign in
          </Typography>

          {/* Email & Password */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 2,
            }}
          >
            {inputData.map((input, index) => (
              <Box
                sx={{
                  "& .MuiOutlinedInput-root, & .MuiFilledInput-root": {
                    borderRadius: "15px",
                  },
                  width: "100%",
                }}
                key={index}
              >
                <BasicInput
                  {...input}
                  value={formValues[input.name] || ""}
                  error={(formErrors && formErrors[input.name]) || ""}
                  variant="filled"
                  sx={{ width: "100%" }}
                  onChange={(e) => handleInputChange(e)}
                />
              </Box>
            ))}

            <BasicButtons
              value={"Sign in"}
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
              fullWidth={true}
              onClick={handleSubmit}
              loading={loading}
            />

            <Link
              component="button"
              type="button"
              variant="body2"
              sx={{ alignSelf: "center" }}
              onClick={() => alert("This feature in progress !!")}
            >
              Forgot your password?
            </Link>
          </Box>

          <Divider>or</Divider>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
              fullWidth
              variant="outlined"
              onClick={() => alert("Sign in with Facebook")}
              startIcon={<FacebookIcon />}
            >
              Sign in with Facebook
            </Button> */}
            <Typography sx={{ textAlign: "center" }}>
              Don&apos;t have an account?{" "}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate("/register")}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignInContainer>
    </>
  );
}
