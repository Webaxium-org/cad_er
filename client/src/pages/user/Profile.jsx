import React, { useEffect } from "react";
import {
  Avatar,
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  Container,
  TextField,
  MenuItem,
  Button,
  Divider,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { stopLoading } from "../../redux/loadingSlice";
import BigHeader from "../../components/BigHeader";
import {
  FiUser,
  FiBriefcase,
  FiTool,
  FiSave,
  FiUploadCloud,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const PRIMARY_BRAND = "#6366f1";
const BG_COLOR = "#f8fafc";
const CARD_BORDER = "#e2e8f0";

const fUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const SectionCard = ({ icon, title, description, children, delay = 0 }) => (
  <motion.div
    variants={fUp}
    initial="hidden"
    animate="visible"
    transition={{ delay }}
  >
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: "20px",
        border: `1px solid ${CARD_BORDER}`,
        background: "#fff",
        mb: 4,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "6px",
          height: "100%",
          background: PRIMARY_BRAND,
          borderTopLeftRadius: "20px",
          borderBottomLeftRadius: "20px",
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" mb={1}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: "12px",
            bgcolor: `${PRIMARY_BRAND}15`,
            color: PRIMARY_BRAND,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} color="#1e293b">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {description}
          </Typography>
        </Box>
      </Stack>
      <Divider sx={{ my: 3, borderColor: CARD_BORDER }} />
      <Box>{children}</Box>
    </Paper>
  </motion.div>
);

const CustomTextField = (props) => (
  <TextField
    fullWidth
    variant="outlined"
    InputLabelProps={{ shrink: true }}
    sx={{
      "& .MuiOutlinedInput-root": {
        borderRadius: "12px",
        backgroundColor: "#f8fafc",
        "& fieldset": { borderColor: "#e2e8f0" },
        "&:hover fieldset": { borderColor: PRIMARY_BRAND },
        "&.Mui-focused fieldset": {
          borderColor: PRIMARY_BRAND,
          borderWidth: "2px",
        },
      },
      "& .MuiInputLabel-root": {
        fontWeight: 600,
        color: "#64748b",
      },
      "& .MuiInputBase-input": {
        fontWeight: 600,
        color: "#334155",
      },
    }}
    {...props}
  />
);

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  return (
    <Box sx={{ bgcolor: BG_COLOR, minHeight: "100vh", pb: 8 }}>
      <BigHeader />

      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <Grid container spacing={4}>
            {/* Left Column: Avatar & Summary */}
            <Grid size={{ xs: 12, md: 4 }}>
              <motion.div variants={fUp}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: "24px",
                    border: `1px solid ${CARD_BORDER}`,
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  <Box position="relative" display="inline-block" mb={2}>
                    <Avatar
                      src={user?.avatar}
                      alt={user?.name || "User Avatar"}
                      sx={{
                        width: 120,
                        height: 120,
                        mx: "auto",
                        border: `4px solid white`,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        bgcolor: "#c7d2fe",
                        color: PRIMARY_BRAND,
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        bgcolor: PRIMARY_BRAND,
                        color: "white",
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "3px solid white",
                        cursor: "pointer",
                      }}
                    >
                      <FiUploadCloud size={18} />
                    </Box>
                  </Box>
                  <Typography variant="h5" fontWeight={800} color="#1e293b">
                    {user?.name || "N/A"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={500}
                    mb={3}
                  >
                    {user?.email || "user@example.com"}
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<FiSave />}
                    sx={{
                      bgcolor: PRIMARY_BRAND,
                      color: "white",
                      fontWeight: 800,
                      borderRadius: "12px",
                      py: 1.5,
                      boxShadow: "0 8px 20px rgba(99, 102, 241, 0.2)",
                    }}
                  >
                    Save Changes
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      mt: 2,
                      color: "#ef4444",
                      borderColor: "#fca5a5",
                      fontWeight: 700,
                      borderRadius: "12px",
                      py: 1.5,
                      "&:hover": {
                        bgcolor: "#fef2f2",
                        borderColor: "#ef4444",
                      },
                    }}
                    onClick={() =>
                      alert(
                        "Delete account feature — please contact support to proceed.",
                      )
                    }
                  >
                    Delete Account
                  </Button>
                </Paper>
              </motion.div>
            </Grid>

            {/* Right Column: Information Forms */}
            <Grid size={{ xs: 12, md: 8 }}>
              {/* Core Information Section */}
              <SectionCard
                icon={<FiUser size={22} />}
                title="Personal Information"
                description="Update your basic profile and contact details."
                delay={0.1}
              >
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      label="Full Name"
                      defaultValue={user?.name || ""}
                      placeholder="John Doe"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      label="Email Address"
                      defaultValue={user?.email || ""}
                      placeholder="john@domain.com"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      label="Phone Number"
                      defaultValue={user?.phone || ""}
                      placeholder="+1 (555) 000-0000"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      label="Location"
                      defaultValue={user?.location || ""}
                      placeholder="City, Country"
                    />
                  </Grid>
                </Grid>
              </SectionCard>

              {/* Work & Organization */}
              <SectionCard
                icon={<FiBriefcase size={22} />}
                title="Work & Organization"
                description="Describe your professional role and plan limits."
                delay={0.2}
              >
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      select
                      label="Role"
                      defaultValue={user?.role || "Student"}
                    >
                      {[
                        "Student",
                        "Site Engineer",
                        "Surveyor",
                        "Project Manager",
                        "Consultant",
                        "Academic faculty",
                        "Business Owner",
                      ].map((role) => (
                        <MenuItem key={role} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      label="Organization"
                      defaultValue={user?.organization || ""}
                      placeholder="Your Company Ltd"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      select
                      label="License Type"
                      defaultValue="Monthly"
                    >
                      {["Custom", "Monthly", "Yearly"].map((plan) => (
                        <MenuItem key={plan} value={plan}>
                          {plan}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      type="number"
                      label="No. of Users"
                      defaultValue={1}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <CustomTextField
                      disabled
                      label="Cloud Storage"
                      defaultValue="Limited"
                      helperText="You are currently on a limited cloud capacity plan."
                    />
                  </Grid>
                </Grid>
              </SectionCard>

              {/* Preferences Section */}
              <SectionCard
                icon={<FiTool size={22} />}
                title="Project Preferences"
                description="Configure default behaviors for surveying generation."
                delay={0.3}
              >
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      select
                      label="Primary Project Type"
                      defaultValue="Roads"
                    >
                      {["Roads", "Canal", "Sewer", "Water network"].map(
                        (type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ),
                      )}
                    </CustomTextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      label="Preferred Survey Equipment"
                      defaultValue="Autolevel"
                      placeholder="e.g. Autolevel"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      select
                      label="Primary Device"
                      defaultValue="Laptop/ PC"
                    >
                      {[
                        "Laptop/ PC",
                        "Tablet",
                        "Android Mobile",
                        "Ipad",
                        "Iphone",
                      ].map((device) => (
                        <MenuItem key={device} value={device}>
                          {device}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  </Grid>
                </Grid>
              </SectionCard>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Profile;
