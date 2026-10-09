import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Chip,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import ScrollToTop from "../../components/ScrollToTop";
import { submitCareerApplication } from "../../services/indexServices";

// Custom SVG Icons to replace react-icons and ensure successful compilation
const IconBriefcase = () => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

const IconMapPin = () => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const IconChevronRight = () => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const IconUpload = () => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const IconArrowLeft = () => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const IconCheckCircle = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 20 20"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    ></path>
  </svg>
);

const IconClock = () => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const JOBS = [
  {
    id: "tele-callers",
    title: "Tele Callers",
    department: "Sales",
  },
  {
    id: "marketing-executives",
    title: "Marketing Executives",
    department: "Marketing",
    qualification: "MBA",
  },
  {
    id: "survey-engineer",
    title: "Survey Engineer",
    department: "Engineering",
    qualification: "B.Tech / Diploma / ITI",
  },
];

const Careers = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [cv, setCv] = useState(null);

  const handleApply = (job) => {
    setSelectedJob(job);
    setCv(null);
    setSubmitError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!cv) {
      setSubmitError("Please attach your CV as a PDF or DOCX file.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.set("position", selectedJob.title);
    formData.set("cv", cv);
    setSubmitting(true);
    try {
      await submitCareerApplication(formData);
      setFormSubmitted(true);
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Could not send your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ScrollToTop />
      <Box sx={{ bgcolor: "#ffffff", minHeight: "100vh", pb: 10 }}>
        {/* Header Section */}
        <Box
          sx={{
            bgcolor: "#f8fafc",
            pt: { xs: 8, md: 12 },
            pb: { xs: 6, md: 10 },
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={2} alignItems="center" textAlign="center">
              <Typography
                variant="overline"
                sx={{ color: "#6366f1", fontWeight: 800, letterSpacing: 3 }}
              >
                JOIN OUR MISSION
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  color: "#111827",
                  fontSize: { xs: "2.5rem", md: "3.5rem" },
                }}
              >
                Build the Future of <br />
                <span style={{ color: "#6366f1" }}>Construction Tech</span>
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "#64748b", maxWidth: 600, fontWeight: 400 }}
              >
                Join CADER and help us revolutionize how site engineers and
                surveyors work across the globe.
              </Typography>
            </Stack>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ mt: -4 }}>
          <AnimatePresence mode="wait">
            {!selectedJob ? (
              <motion.div
                key="job-list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Stack spacing={3}>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 800, color: "#1e293b", mb: 1 }}
                  >
                    Open Positions ({JOBS.length})
                  </Typography>
                  {JOBS.map((job) => (
                    <Paper
                      key={job.id}
                      elevation={0}
                      sx={{
                        p: 4,
                        borderRadius: 4,
                        border: "1px solid #e2e8f0",
                        transition: "all 0.2s",
                        "&:hover": {
                          borderColor: "#6366f1",
                          boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.1)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 800, color: "#111827" }}
                          >
                            {job.title}
                          </Typography>
                          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ color: "#64748b" }}
                            >
                              <IconBriefcase />
                              <Typography variant="body2">
                                {job.department}
                              </Typography>
                            </Stack>
                            {job.location && (
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ color: "#64748b" }}
                              >
                                <IconMapPin />
                                <Typography variant="body2">
                                  {job.location}
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            {(job.type || job.qualification) && (
                              <Chip
                                label={job.type || job.qualification}
                                size="small"
                                sx={{
                                  bgcolor: "#f1f5f9",
                                  fontWeight: 600,
                                  color: "#475569",
                                }}
                              />
                            )}
                            {job.salary && (
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                sx={{ color: "#94a3b8" }}
                              >
                                <IconClock />
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {job.salary}
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Grid>
                        <Grid
                          size={{ xs: 12, md: 3 }}
                          sx={{ textAlign: { md: "right" } }}
                        >
                          <Button
                            variant="contained"
                            onClick={() => handleApply(job)}
                            endIcon={<IconChevronRight />}
                            sx={{
                              bgcolor: "#6366f1",
                              borderRadius: 2,
                              px: 3,
                              textTransform: "none",
                              fontWeight: 700,
                              "&:hover": { bgcolor: "#4f46e5" },
                            }}
                          >
                            Apply Now
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              </motion.div>
            ) : (
              <motion.div
                key="apply-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 4, md: 6 },
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  {!formSubmitted ? (
                    <>
                      <Button
                        startIcon={<IconArrowLeft />}
                        onClick={() => setSelectedJob(null)}
                        sx={{ color: "#64748b", mb: 4, textTransform: "none" }}
                      >
                        View All Jobs
                      </Button>

                      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                        Applying for {selectedJob.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: "#64748b", mb: 5 }}
                      >
                        Tell us more about yourself and your journey in
                        construction/engineering.
                      </Typography>

                      <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              name="name"
                              label="Full Name"
                              required
                              variant="outlined"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              name="email"
                              label="Email Address"
                              type="email"
                              required
                              variant="outlined"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              name="phone"
                              label="Phone Number"
                              variant="outlined"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              name="experience"
                              select
                              label="Experience Level"
                              defaultValue="mid"
                              variant="outlined"
                            >
                              <MenuItem value="junior">
                                Junior (0-2 years)
                              </MenuItem>
                              <MenuItem value="mid">
                                Mid-Level (3-5 years)
                              </MenuItem>
                              <MenuItem value="senior">
                                Senior (5+ years)
                              </MenuItem>
                            </TextField>
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              name="portfolio"
                              label="LinkedIn or Portfolio URL"
                              placeholder="https://linkedin.com/in/username"
                              variant="outlined"
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              name="coverLetter"
                              multiline
                              rows={4}
                              label="Cover Letter / Brief Intro"
                              placeholder="Tell us about your technical background..."
                              variant="outlined"
                            />
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <Box
                              component="label"
                              sx={{
                                display: "block",
                                p: 4,
                                border: "2px dashed #e2e8f0",
                                borderRadius: 4,
                                textAlign: "center",
                                bgcolor: "#f8fafc",
                                cursor: "pointer",
                                transition: "0.2s",
                                "&:hover": {
                                  borderColor: "#6366f1",
                                  bgcolor: "#f3f4ff",
                                },
                              }}
                            >
                              <input
                                type="file"
                                name="cv"
                                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                style={{ display: "none" }}
                                onChange={(event) => {
                                  const file = event.target.files?.[0] || null;
                                  if (file && file.size > 10 * 1024 * 1024) {
                                    setSubmitError("CV must be 10 MB or smaller.");
                                    setCv(null);
                                    event.target.value = "";
                                    return;
                                  }
                                  setCv(file);
                                  setSubmitError("");
                                }}
                              />
                              <IconUpload />
                              <Typography
                                variant="h6"
                                sx={{
                                  fontSize: "1rem",
                                  fontWeight: 700,
                                  mt: 1,
                                }}
                              >
                                {cv ? cv.name : "Choose your CV"}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: "#94a3b8" }}
                              >
                                PDF, DOCX up to 10MB
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            {submitError && (
                              <Typography role="alert" color="error" sx={{ mb: 2 }}>
                                {submitError}
                              </Typography>
                            )}
                            <Button
                              type="submit"
                              disabled={submitting}
                              fullWidth
                              variant="contained"
                              size="large"
                              sx={{
                                py: 2,
                                bgcolor: "#6366f1",
                                borderRadius: 3,
                                fontWeight: 800,
                                fontSize: "1.1rem",
                                textTransform: "none",
                                mt: 2,
                                "&:hover": { bgcolor: "#4f46e5" },
                              }}
                            >
                              {submitting ? "Sending Application..." : "Submit My Application"}
                            </Button>
                          </Grid>
                        </Grid>
                      </form>
                    </>
                  ) : (
                    <Stack alignItems="center" spacing={3} sx={{ py: 8 }}>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <Box sx={{ color: "#10b981", fontSize: 80 }}>
                          <IconCheckCircle />
                        </Box>
                      </motion.div>
                      <Typography variant="h4" sx={{ fontWeight: 900 }}>
                        Application Received!
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: "#64748b",
                          textAlign: "center",
                          maxWidth: 450,
                        }}
                      >
                        Thanks for reaching out! Our recruitment team will
                        review your application for the {selectedJob.title}{" "}
                        position and get back to you shortly.
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setFormSubmitted(false);
                          setSelectedJob(null);
                        }}
                        sx={{
                          borderRadius: 2,
                          px: 4,
                          mt: 2,
                          textTransform: "none",
                        }}
                      >
                        Explore More Roles
                      </Button>
                    </Stack>
                  )}
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </Box>
    </>
  );
};

export default Careers;
