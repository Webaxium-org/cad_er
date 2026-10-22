import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Fade,
  Button,
  TextField,
  MenuItem,
  Container,
  Paper,
  GlobalStyles,
  Alert,
} from "@mui/material";
import { stopLoading } from "../../redux/loadingSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { qualificationOptions } from "../../constants";
import { handleFormError } from "../../utils/handleFormError";
import { registerAccountType, sendOnboardingCode, verifyOnboardingCode } from "../../services/indexServices";
import { setUser } from "../../redux/userSlice";

const PHONE_COUNTRIES = [
  { name: "India", code: "+91" },
  { name: "United Arab Emirates", code: "+971" },
  { name: "Saudi Arabia", code: "+966" },
  { name: "Qatar", code: "+974" },
  { name: "Oman", code: "+968" },
  { name: "Kuwait", code: "+965" },
  { name: "Bahrain", code: "+973" },
  { name: "United States / Canada", code: "+1" },
  { name: "United Kingdom", code: "+44" },
  { name: "Australia", code: "+61" },
  { name: "New Zealand", code: "+64" },
  { name: "Singapore", code: "+65" },
  { name: "Malaysia", code: "+60" },
  { name: "Sri Lanka", code: "+94" },
  { name: "Nepal", code: "+977" },
  { name: "Bangladesh", code: "+880" },
  { name: "Pakistan", code: "+92" },
  { name: "Germany", code: "+49" },
  { name: "France", code: "+33" },
  { name: "Italy", code: "+39" },
  { name: "Spain", code: "+34" },
  { name: "South Africa", code: "+27" },
];

const OnboardingAccountType = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const savedPhone = (user?.phone || "").replace(/[\s()-]/g, "");
  const savedCountry = [...PHONE_COUNTRIES].sort((a, b) => b.code.length - a.code.length)
    .find((country) => savedPhone.startsWith(country.code));
  const [phoneCode, setPhoneCode] = useState(savedCountry?.code || "+91");
  const [phone, setPhone] = useState(savedCountry ? savedPhone.slice(savedCountry.code.length) : savedPhone);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState(user?.email || "");
  const [busy, setBusy] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [verificationError, setVerificationError] = useState("");
  const localPhone = phone.trim().replace(/[\s()-]/g, "");
  const normalizedPhone = `${phoneCode}${localPhone}`;
  const validPhone = /^\d+$/.test(localPhone) && /^\+[1-9]\d{7,14}$/.test(normalizedPhone)
    && (phoneCode === "+91" ? /^[6-9]\d{9}$/.test(localPhone) : localPhone.length >= 7);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendCode = async () => {
    if (busy || cooldown > 0 || verified) return;
    setBusy("send");
    setVerificationError("");
    try {
      const { data } = await sendOnboardingCode();
      if (!data.success) throw new Error("Could not send verification code");
      setVerificationEmail(data.email);
      setCodeSent(true);
      setCode("");
      setCooldown(data.retryAfter || 60);
    } catch (error) {
      setVerificationError(error.response?.data?.message || error.message);
    } finally { setBusy(""); }
  };

  const handleVerifyCode = async () => {
    if (busy || !/^\d{6}$/.test(code)) return;
    setBusy("verify");
    setVerificationError("");
    try {
      const { data } = await verifyOnboardingCode(code);
      if (!data.success) throw new Error("Could not verify code");
      setVerified(true);
    } catch (error) {
      setVerificationError(error.response?.data?.message || error.message);
    } finally { setBusy(""); }
  };

  const [step, setStep] = useState(1);
  const [formValues, setFormValues] = useState({
    type: null,
    details: {},
  });

  // Custom SVG Icons
  const Icons = {
    Student: () => (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    Professional: () => (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    Company: () => (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
      </svg>
    ),
    Check: () => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
    Arrow: () => (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
    Back: () => (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    ),
  };

  const options = [
    {
      key: "Student",
      icon: <Icons.Student />,
      title: "Student",
      desc: "Learning or academic use",
      color: "#6366f1",
    },
    {
      key: "Professional",
      icon: <Icons.Professional />,
      title: "Professional",
      desc: "Work or organization use",
      color: "#0ea5e9",
    },
    {
      key: "Company",
      icon: <Icons.Company />,
      title: "Company",
      desc: "Enterprise or team use",
      color: "#10b981",
    },
  ];

  const handleDetailChange = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      details: { ...prev.details, [field]: value },
    }));
  };

  const handleSubmit = async () => {
    if (busy) return;
    try {
      const { type, details } = formValues;
      if (!type || !isStep2Valid() || !validPhone || !verified) {
        throw new Error("Please fill all the required fields");
      }

      setBusy("submit");
      const { data } = await registerAccountType({ type, details, phone: normalizedPhone });

      if (data?.success) {
        dispatch(setUser(data?.user));

        navigate("/");
      }
    } catch (error) {
      if (error.response?.data?.message === "Verify your email before completing setup") {
        setVerified(false);
        setCodeSent(false);
        setVerificationError("Your verification expired. Request a new code to continue.");
      }
      handleFormError(error, null, dispatch, navigate);
    } finally { setBusy(""); }
  };

  const isStep2Valid = () => {
    const { type, details } = formValues;

    const isFilled = (val) => val && val.trim().length > 0;

    if (type === "Student") {
      return (
        isFilled(details.instituteName) &&
        isFilled(details.qualification) &&
        isFilled(details.specialization) &&
        isFilled(details.discoverySource)
      );
    }

    if (type === "Professional") {
      return isFilled(details.jobTitle) && isFilled(details.industry);
    }

    if (type === "Company") {
      return isFilled(details.companyName) && isFilled(details.size);
    }

    return false;
  };

  const renderStep2Fields = () => {
    switch (formValues.type) {
      case "Student":
        return (
          <Stack spacing={3} sx={{ width: "100%", maxWidth: 400, mx: "auto" }}>
            <TextField
              fullWidth
              label="School / College / University Name"
              onChange={(e) =>
                handleDetailChange("instituteName", e.target.value)
              }
            />

            <TextField
              fullWidth
              select
              label="Current Qualification"
              defaultValue=""
              onChange={(e) =>
                handleDetailChange("qualification", e.target.value)
              }
            >
              {qualificationOptions?.map((qualification, idx) => (
                <MenuItem key={idx} value={qualification.label}>
                  {qualification.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Specialization / Branch"
              placeholder="e.g. Civil Engineering, Surveying"
              onChange={(e) =>
                handleDetailChange("specialization", e.target.value)
              }
            />

            <TextField
              fullWidth
              select
              label="How did you hear about us?"
              defaultValue=""
              onChange={(e) =>
                handleDetailChange("discoverySource", e.target.value)
              }
            >
              <MenuItem value="google">Google Search</MenuItem>
              <MenuItem value="youtube">YouTube</MenuItem>
              <MenuItem value="social">Instagram / Facebook</MenuItem>
              <MenuItem value="friend">Friend / Classmate</MenuItem>
              <MenuItem value="teacher">Teacher / Institute</MenuItem>
              <MenuItem value="ads">Advertisement</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Stack>
        );
      case "Professional":
        return (
          <Stack spacing={3} sx={{ width: "100%", maxWidth: 400, mx: "auto" }}>
            <TextField
              fullWidth
              label="Current Job Title"
              onChange={(e) => handleDetailChange("jobTitle", e.target.value)}
            />
            <TextField
              fullWidth
              select
              label="Industry"
              defaultValue=""
              onChange={(e) => handleDetailChange("industry", e.target.value)}
            >
              <MenuItem value="construction">
                Construction & Infrastructure
              </MenuItem>
              <MenuItem value="architecture">Architecture</MenuItem>
              <MenuItem value="surveying">Land Surveying</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Stack>
        );
      case "Company":
        return (
          <Stack spacing={3} sx={{ width: "100%", maxWidth: 400, mx: "auto" }}>
            <TextField
              fullWidth
              label="Company Name"
              onChange={(e) =>
                handleDetailChange("companyName", e.target.value)
              }
            />
            <TextField
              fullWidth
              select
              label="Team Size"
              defaultValue=""
              onChange={(e) => handleDetailChange("size", e.target.value)}
            >
              <MenuItem value="1-10">1-10 employees</MenuItem>
              <MenuItem value="11-50">11-50 employees</MenuItem>
              <MenuItem value="51-200">51-200 employees</MenuItem>
              <MenuItem value="200+">200+ employees</MenuItem>
            </TextField>
          </Stack>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f9fafb",
        py: 4,
      }}
    >
      <GlobalStyles styles={{ body: { margin: 0, padding: 0 } }} />
      <Container maxWidth="md">
        {/* Progress Indicator */}
        <Typography
          variant="overline"
          sx={{
            display: "block",
            textAlign: "center",
            color: "#6366f1",
            fontWeight: 700,
            letterSpacing: 2,
            mb: 1,
          }}
        >
          STEP {step} OF 2
        </Typography>

        {step === 1 ? (
          <Fade in={step === 1}>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  mb: 1,
                  fontWeight: 800,
                  color: "#111827",
                  textAlign: "center",
                }}
              >
                How do you plan to use CADer?
              </Typography>
              <Typography
                variant="body1"
                sx={{ mb: 6, color: "#6b7280", textAlign: "center" }}
              >
                We'll customize your experience based on your selection.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                {options.map((item) => {
                  const isSelected = formValues.type === item.key;
                  return (
                    <Paper
                      elevation={0}
                      key={item.key}
                      onClick={() =>
                        setFormValues((p) => ({ ...p, type: item.key }))
                      }
                      sx={{
                        flex: 1,
                        position: "relative",
                        p: 4,
                        borderRadius: 4,
                        cursor: "pointer",
                        backgroundColor: isSelected ? "white" : "transparent",
                        border: "2px solid",
                        borderColor: isSelected ? item.color : "#e5e7eb",
                        boxShadow: isSelected
                          ? `0 20px 25px -5px ${item.color}22`
                          : "none",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          borderColor: isSelected ? item.color : "#d1d5db",
                          transform: "translateY(-6px)",
                          backgroundColor: isSelected ? "white" : "#f9fafb",
                        },
                      }}
                    >
                      {isSelected && (
                        <Fade in={isSelected}>
                          <Box
                            sx={{
                              position: "absolute",
                              top: 16,
                              right: 16,
                              color: item.color,
                            }}
                          >
                            <Icons.Check />
                          </Box>
                        </Fade>
                      )}
                      <Box
                        sx={{
                          color: isSelected ? item.color : "#6b7280",
                          mb: 3,
                          display: "inline-flex",
                          p: 2,
                          borderRadius: 3,
                          backgroundColor: isSelected
                            ? `${item.color}15`
                            : "#f3f4f6",
                          transition: "all 0.3s",
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          color: isSelected ? "#111827" : "#374151",
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: isSelected ? "#4b5563" : "#6b7280",
                          mt: 1,
                          lineHeight: 1.6,
                        }}
                      >
                        {item.desc}
                      </Typography>
                    </Paper>
                  );
                })}
              </Stack>

              <Box sx={{ mt: 8, display: "flex", justifyContent: "center" }}>
                <Button
                  variant="contained"
                  disabled={!formValues.type}
                  onClick={() => setStep(2)}
                  endIcon={<Icons.Arrow />}
                  sx={{
                    px: 6,
                    py: 1.5,
                    borderRadius: 10,
                    textTransform: "none",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    backgroundColor: "#4f46e5",
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "#4338ca",
                      boxShadow: "none",
                    },
                    "&.Mui-disabled": { backgroundColor: "#e5e7eb" },
                  }}
                >
                  Continue
                </Button>
              </Box>
            </Box>
          </Fade>
        ) : (
          <Fade in={step === 2}>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  mb: 1,
                  fontWeight: 800,
                  color: "#111827",
                  textAlign: "center",
                }}
              >
                Tell us a bit more
              </Typography>
              <Typography
                variant="body1"
                sx={{ mb: 6, color: "#6b7280", textAlign: "center" }}
              >
                Help us set up your {formValues.type?.toLowerCase()} workspace.
              </Typography>

              {renderStep2Fields()}

              <Paper elevation={0} sx={{ width: "100%", maxWidth: 400, mx: "auto", mt: 3, p: { xs: 2, sm: 3 }, boxSizing: "border-box", borderRadius: 4, border: "1px solid #c7d2fe", bgcolor: "#eef2ff", "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#4f46e5" }, "& .MuiInputLabel-root.Mui-focused": { color: "#4f46e5" } }}>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ color: "#4f46e5", fontWeight: 800 }}>Contact and verification</Typography>
                  <TextField
                    select required fullWidth label="Country code" value={phoneCode}
                    onChange={(event) => setPhoneCode(event.target.value)} disabled={busy === "submit"}
                    autoComplete="tel-country-code" sx={{ bgcolor: "white", borderRadius: 1 }}
                  >
                    {PHONE_COUNTRIES.map((country) => (
                      <MenuItem key={country.code} value={country.code}>{country.name} ({country.code})</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    required fullWidth label="Phone number" type="tel" autoComplete="tel-national"
                    placeholder={phoneCode === "+91" ? "98765 43210" : "Phone number"} value={phone} disabled={busy === "submit"}
                    onChange={(event) => setPhone(event.target.value)}
                    error={phone.length > 0 && !validPhone}
                    helperText={phone.length > 0 && !validPhone
                      ? phoneCode === "+91" ? "Enter a valid 10-digit Indian mobile number." : "Enter a valid phone number without the country code."
                      : "Enter your number without the country code."}
                    sx={{ bgcolor: "white", borderRadius: 1 }}
                  />
                  <Typography variant="body2" sx={{ color: "#475569", overflowWrap: "anywhere" }}>
                    Verify your email{verificationEmail ? `: ${verificationEmail}` : " address"}. Your verification code will be sent by email.
                  </Typography>
                  {verificationError && <Alert severity="error" role="alert">{verificationError}</Alert>}
                  {verified ? <Alert severity="success">Email verified. You can complete setup.</Alert> : <>
                    <Button variant="outlined" onClick={handleSendCode} disabled={Boolean(busy) || cooldown > 0}
                      sx={{ color: "#4f46e5", borderColor: "#a5b4fc", borderRadius: 2, textTransform: "none" }}>
                      {busy === "send" ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : codeSent ? "Resend code" : "Send verification code"}
                    </Button>
                    {codeSent && <>
                      <Typography variant="caption" color="text.secondary" role="status">Code sent. Check your inbox and spam folder. It expires in 10 minutes.</Typography>
                      <TextField required fullWidth label="Email verification code" value={code}
                        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        disabled={Boolean(busy)} autoComplete="one-time-code"
                        inputProps={{ inputMode: "numeric", maxLength: 6 }} sx={{ bgcolor: "white", borderRadius: 1 }} />
                      <Button variant="contained" onClick={handleVerifyCode} disabled={Boolean(busy) || !/^\d{6}$/.test(code)}
                        sx={{ bgcolor: "#4f46e5", "&:hover": { bgcolor: "#4338ca" }, borderRadius: 2, textTransform: "none" }}>
                        {busy === "verify" ? "Verifying..." : "Verify email"}
                      </Button>
                    </>}
                  </>}
                </Stack>
              </Paper>

              <Stack
                direction="row"
                spacing={2}
                sx={{ mt: 8, justifyContent: "center" }}
              >
                <Button
                  variant="text"
                  onClick={() => setStep(1)}
                  startIcon={<Icons.Back />}
                  sx={{
                    px: 4,
                    textTransform: "none",
                    fontWeight: 600,
                    color: "#6b7280",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  disabled={!isStep2Valid() || !validPhone || !verified || Boolean(busy)}
                  onClick={handleSubmit}
                  endIcon={<Icons.Arrow />}
                  sx={{
                    px: 6,
                    py: 1.5,
                    borderRadius: 10,
                    textTransform: "none",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    backgroundColor: "#4f46e5",
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "#4338ca",
                      boxShadow: "none",
                    },
                    "&.Mui-disabled": { backgroundColor: "#e5e7eb" },
                  }}
                >
                  {busy === "submit" ? "Completing setup..." : "Complete Setup"}
                </Button>
              </Stack>
            </Box>
          </Fade>
        )}
      </Container>
    </Box>
  );
};

export default OnboardingAccountType;
