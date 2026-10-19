import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Fade,
  Paper,
  alpha,
  Grid,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { handleFormError } from "../../../utils/handleFormError";
import { scheduleDemoForm } from "../../../services/indexServices";

// --- Icons (Existing and New) ---
const IconWrapper = ({ children, size = 20, color = "currentColor" }) => (
  <Box
    sx={{
      width: size,
      height: size,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color,
    }}
  >
    {children}
  </Box>
);

const MdClose = (props) => (
  <IconWrapper {...props}>
    <svg
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
  </IconWrapper>
);

const MdOutlinePerson = (props) => (
  <IconWrapper {...props}>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  </IconWrapper>
);

const MdOutlineSchool = (props) => (
  <IconWrapper {...props}>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10L12 5L2 10L12 15L22 10Z"></path>
      <path d="M6 12V17C6 17 9 19 12 19C15 19 18 17 18 17V12"></path>
    </svg>
  </IconWrapper>
);

const MdOutlineBusiness = (props) => (
  <IconWrapper {...props}>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
  </IconWrapper>
);

const FormSectionHeader = ({ title, subtitle, icon: Icon }) => (
  <Box sx={{ mb: 3, mt: 1 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
      {Icon && <Icon size={20} color="#4f46e5" />}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#1e293b",
          fontSize: "0.75rem",
        }}
      >
        {title}
      </Typography>
    </Box>
    {subtitle && (
      <Typography
        variant="caption"
        sx={{ color: "#64748b", display: "block", fontWeight: 500 }}
      >
        {subtitle}
      </Typography>
    )}
  </Box>
);

const ScheduleDemoForm = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    enquiryType: "",
    contactPerson: "",
    organizationName: "",
    designation: "",
    email: "",
    phone: "",
    licenseType: "Yearly",
    projectTypes: [],
    projectVolume: "",
    numberOfUsers: "",
    instituteType: "",
    department: "",
    studentBatchSize: "",
    trainingMode: "Online",
    onSiteLocation: "",
    trainingTimeline: "",
    trainingProgram: "1-Day Masterclass",
    cloudStorage: "Standard",
    supportPreference: "Priority Email",
    notes: "",
    // Institution Specific Fields
    fieldTraining: "",
    calculationMethod: "",
    automatedTool: "",
    draftingStandard: "",
    relevanceRating: "",
    demoEngagement: "",
    projectedParticipants: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleProjectType = (type) => {
    setFormData((prev) => ({
      ...prev,
      projectTypes: prev.projectTypes.includes(type)
        ? prev.projectTypes.filter((t) => t !== type)
        : [...prev.projectTypes, type],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await scheduleDemoForm(formData);
    } catch (error) {
      handleFormError(error, dispatch, navigate);
    } finally {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2500);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          borderRadius: "28px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: "#0f172a" }}>
            Schedule a Demo
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Tailor your experience by providing your workflow details.
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ bgcolor: "#f1f5f9" }}>
          <MdClose size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{ p: { xs: 2, sm: 4 }, bgcolor: "#fafafa" }}
        data-lenis-prevent
      >
        {isSuccess ? (
          <Fade in={isSuccess}>
            <Box textAlign="center" py={10}>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                Request Received!
              </Typography>
              <Typography sx={{ color: "#64748b" }}>
                Our team will contact you shortly to finalize the schedule.
              </Typography>
            </Box>
          </Fade>
        ) : (
          <Box component="form" noValidate>
            {/* 1. Profile Selection */}
            <Box sx={{ mb: 6 }}>
              <FormSectionHeader
                title="I'm enquiring for"
                subtitle="Select your primary profile"
              />
              <Grid container spacing={2}>
                {[
                  {
                    id: "Individual Professional",
                    icon: <MdOutlinePerson size={24} />,
                    label: "Individual Professional",
                    desc: "Self-employed / Freelance",
                  },
                  {
                    id: "Educational Institution",
                    icon: <MdOutlineSchool size={24} />,
                    label: "Educational Institution",
                    desc: "Academic / Research",
                  },
                  {
                    id: "Corporate / Enterprise",
                    icon: <MdOutlineBusiness size={24} />,
                    label: "Corporate / Enterprise",
                    desc: "Company / Organization",
                  },
                ].map((type) => {
                  const isActive = formData.enquiryType === type.id;
                  return (
                    <Grid size={{ xs: 12, sm: 4 }} key={type.id}>
                      <Paper
                        elevation={0}
                        onClick={() =>
                          setFormData((p) => ({ ...p, enquiryType: type.id }))
                        }
                        sx={{
                          p: 2,
                          textAlign: "center",
                          cursor: "pointer",
                          borderRadius: "20px",
                          border: "2px solid",
                          borderColor: isActive ? "#4f46e5" : "#f1f5f9",
                          transition: "0.3s",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            borderColor: "#cbd5e1",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: "12px",
                            bgcolor: isActive ? "#4f46e5" : "#f8fafc",
                            color: isActive ? "white" : "#94a3b8",
                            mb: 1,
                            display: "inline-flex",
                          }}
                        >
                          {type.icon}
                        </Box>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 800,
                            color: isActive ? "#4338ca" : "#334155",
                          }}
                        >
                          {type.label}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            {/* 2. Basic Contact Info */}
            <Box sx={{ mb: 6 }}>
              <FormSectionHeader title="Contact Details" />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Contact Person"
                    name="contactPerson"
                    onChange={handleInputChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Organization Name"
                    name="organizationName"
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Designation"
                    name="designation"
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    onChange={handleInputChange}
                  />
                </Grid>
                {formData.enquiryType === "Educational Institution" && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Preferred License Type"
                      name="licenseType"
                      value={formData.licenseType}
                      onChange={handleInputChange}
                    >
                      {["Monthly", "Yearly", "Custom"].map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* 3. Conditional Project Info (Professional / Enterprise) */}
            {(formData.enquiryType === "Individual Professional" ||
              formData.enquiryType === "Corporate / Enterprise") && (
              <Box
                sx={{
                  mb: 6,
                  p: 3,
                  bgcolor: "white",
                  borderRadius: "24px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
                  Project Scope
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <FormLabel
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                      }}
                    >
                      PRIMARY PROJECT TYPES
                    </FormLabel>
                    <Box
                      sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}
                    >
                      {["Road", "Canal", "Sewer", "Water network"].map(
                        (type) => (
                          <Chip
                            key={type}
                            label={type}
                            onClick={() => toggleProjectType(type)}
                            color={
                              formData.projectTypes.includes(type)
                                ? "primary"
                                : "default"
                            }
                            variant={
                              formData.projectTypes.includes(type)
                                ? "filled"
                                : "outlined"
                            }
                          />
                        ),
                      )}
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Annual Project Volume"
                      name="projectVolume"
                      value={formData.projectVolume}
                      onChange={handleInputChange}
                    >
                      {["<5 projects", "5-20 projects", "20+ projects"].map(
                        (opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ),
                      )}
                    </TextField>
                  </Grid>
                  {formData.enquiryType === "Corporate / Enterprise" && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Number of Users"
                        name="numberOfUsers"
                        type="number"
                        onChange={handleInputChange}
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

            {/* 4. Conditional Academic Info (Institution) */}
            {formData.enquiryType === "Educational Institution" && (
              <Box
                sx={{
                  mb: 6,
                  p: 3,
                  bgcolor: alpha("#4f46e5", 0.02),
                  borderRadius: "24px",
                  border: "1px dashed #4f46e5",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 800, mb: 2, color: "#4338ca" }}
                >
                  Academic Profile
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="Type of Institute"
                      name="instituteType"
                      value={formData.instituteType}
                      onChange={handleInputChange}
                    >
                      {["ITI", "Diploma/ Polytechnic", "BE/ B-Tech"].map(
                        (opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ),
                      )}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="Department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                    >
                      {["Civil", "Surveying"].map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="Student Batch Size"
                      name="studentBatchSize"
                      value={formData.studentBatchSize}
                      onChange={handleInputChange}
                    >
                      {["<60", "60–120", "120+"].map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                {/* Technical Integration Questionnaire for Institutions */}
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="overline"
                    sx={{ fontWeight: 900, color: "#4f46e5" }}
                  >
                    Practical Training Integration
                  </Typography>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12 }}>
                      <FormLabel sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        Current Auto-Level Curriculum:
                      </FormLabel>
                      <RadioGroup
                        row
                        name="fieldTraining"
                        value={formData.fieldTraining}
                        onChange={handleInputChange}
                      >
                        <FormControlLabel
                          value="Active Field Training"
                          control={<Radio />}
                          label="Active Field Training"
                        />
                        <FormControlLabel
                          value="Theoretical Only"
                          control={<Radio />}
                          label="Theoretical Only"
                        />
                        <FormControlLabel
                          value="Needs Digital Transformation"
                          control={<Radio size="small" />}
                          label="Needs Digital Transformation"
                        />
                      </RadioGroup>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <FormLabel sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        Primary Cut & Fill Workflow:
                      </FormLabel>
                      <RadioGroup
                        row
                        name="calculationMethod"
                        value={formData.calculationMethod}
                        onChange={handleInputChange}
                      >
                        <FormControlLabel
                          value="Manual"
                          control={<Radio />}
                          label="Conventional Manual (Spreadsheets)"
                        />
                        <FormControlLabel
                          value="Automated"
                          control={<Radio />}
                          label="Software-Automated"
                        />
                      </RadioGroup>
                      {formData.calculationMethod === "Automated" && (
                        <TextField
                          fullWidth
                          size="small"
                          label="Specify tool"
                          name="automatedTool"
                          sx={{ mt: 1 }}
                          onChange={handleInputChange}
                        />
                      )}
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="Existing Drafting Tool"
                        name="draftingStandard"
                        value={formData.draftingStandard}
                        onChange={handleInputChange}
                      >
                        {[
                          "Manual CAD Drafting",
                          "Specialized Plugin",
                          "Spreadsheet-only",
                          "Other",
                        ].map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="CADER Relevance Rating"
                        name="relevanceRating"
                        value={formData.relevanceRating}
                        onChange={handleInputChange}
                      >
                        {[
                          "High (Industry-Ready)",
                          "Moderate (Supplementary)",
                          "Under Review",
                        ].map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="Technical Demo For"
                        name="demoEngagement"
                        value={formData.demoEngagement}
                        onChange={handleInputChange}
                      >
                        {[
                          "Management & Faculty",
                          "Student Body",
                          "No Demo Required",
                        ].map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Projected Student Participants"
                        name="projectedParticipants"
                        type="number"
                        onChange={handleInputChange}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}

            {/* 5. Logistics & Preferences */}
            <Box>
              <FormSectionHeader title="Logistics & Preferences" />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Preferred Training Mode"
                    name="trainingMode"
                    value={formData.trainingMode}
                    onChange={handleInputChange}
                  >
                    {["Online", "On-site", "Hybrid"].map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    fullWidth
                    label="Location of On-site Training (If applicable)"
                    name="onSiteLocation"
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Training Timeline / Availability"
                    name="trainingTimeline"
                    placeholder="e.g., Next month, Immediate"
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Select Program"
                    name="trainingProgram"
                    value={formData.trainingProgram}
                    onChange={handleInputChange}
                  >
                    {[
                      "1-Day Masterclass",
                      "10-Day Training",
                      "1- Month Course",
                    ].map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Cloud Storage Needs"
                    name="cloudStorage"
                    value={formData.cloudStorage}
                    onChange={handleInputChange}
                  >
                    {["Standard", "Extended", "Unlimited"].map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Support Preference"
                    name="supportPreference"
                    value={formData.supportPreference}
                    onChange={handleInputChange}
                  >
                    {["Priority Email", "Phone", "Dedicated Manager"].map(
                      (opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ),
                    )}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Additional Requirements / Notes"
                    name="notes"
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: "1px solid #f1f5f9" }}>
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          sx={{ fontWeight: 800, color: "#94a3b8" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.enquiryType || isSuccess}
          sx={{
            px: 4,
            borderRadius: "12px",
            fontWeight: 900,
            bgcolor: "#0f172a",
            "&:hover": { bgcolor: "#4338ca" },
          }}
        >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Schedule Demo Now"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleDemoForm;
