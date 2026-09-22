import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Stack,
  TextField,
  MenuItem,
  LinearProgress,
  Button,
  Chip,
  Divider,
  IconButton,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  FiSettings,
  FiSave,
  FiServer,
  FiTool,
  FiUsers,
  FiBriefcase,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiMonitor,
} from "react-icons/fi";
import BigHeader from "../../components/BigHeader";

const PRIMARY_BRAND = "#6366f1";
const HEADER_GRADIENT_START = "#4f46e5";
const HEADER_GRADIENT_END = "#6366f1";
const CARD_BORDER = "#e2e8f0";
const BG_COLOR = "#f8fafc";

// ----------------------
// Animation Variants
// ----------------------
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

// ----------------------
// Reusable Styled Sections
// ----------------------
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

export default function Settings() {
  const [hierarchyExpanded, setHierarchyExpanded] = useState({
    1: true,
    2: false,
    3: false,
  });
  const [pegName, setPegName] = useState("Chainage");
  const [fieldInputMethod, setFieldInputMethod] = useState("HI Method");
  const [displayMode, setDisplayMode] = useState("System Settings");
  const [hatchType, setHatchType] = useState("Solid");
  const [reportModel, setReportModel] = useState("Standard Model");

  const toggleHierarchy = (level) => {
    setHierarchyExpanded((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  return (
    <Box sx={{ bgcolor: BG_COLOR, minHeight: "100vh", pb: 8 }}>
      <BigHeader />

      {/* Indigo Themed Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${HEADER_GRADIENT_START} 0%, ${HEADER_GRADIENT_END} 100%)`,
          pt: { xs: 10, md: 12 }, // Padding for AppHeader overlap
          pb: { xs: 8, md: 10 },
          color: "white",
          borderRadius: "0 0 40px 40px",
          boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.4)",
          position: "relative",
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={2}
            >
              <Box>
                <motion.div variants={fUp}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                    <FiSettings size={32} opacity={0.9} />
                    <Typography
                      variant="h3"
                      fontWeight={900}
                      letterSpacing="-0.02em"
                    >
                      System <span style={{ color: "#c7d2fe" }}>Settings</span>
                    </Typography>
                  </Stack>
                </motion.div>
                <motion.div variants={fUp}>
                  <Typography
                    variant="body1"
                    sx={{ opacity: 0.85, maxWidth: 500, fontWeight: 500 }}
                  >
                    Manage application preferences, client configuration, and
                    instrument details to ensure accurate graph generation and
                    project reporting.
                  </Typography>
                </motion.div>
              </Box>

              <motion.div variants={fUp}>
                <Button
                  variant="contained"
                  startIcon={<FiSave />}
                  sx={{
                    bgcolor: "white",
                    color: PRIMARY_BRAND,
                    fontWeight: 800,
                    borderRadius: "12px",
                    px: 3,
                    py: 1.5,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                    "&:hover": {
                      bgcolor: "#f1f5f9",
                    },
                  }}
                >
                  Save Configuration
                </Button>
              </motion.div>
            </Stack>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -8 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            {/* System Preferences & Storage */}
            <SectionCard
              icon={<FiServer size={22} />}
              title="System Preferences"
              description="Measurement units & storage usage."
              delay={0.1}
            >
              <Stack spacing={4}>
                <CustomTextField
                  select
                  label="Measurement Units"
                  defaultValue="metric"
                  helperText="Globally sets the measurement standards across the portal."
                >
                  <MenuItem value="metric">Metric (m / Km)</MenuItem>
                  <MenuItem value="imperial">Imperial (ft / mi)</MenuItem>
                </CustomTextField>

                {/* Peg Name */}
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="#64748b"
                    display="block"
                    mb={1}
                  >
                    PEG NAME
                  </Typography>
                  <ToggleButtonGroup
                    value={pegName}
                    exclusive
                    onChange={(_, v) => v && setPegName(v)}
                    size="small"
                    sx={{
                      "& .MuiToggleButton-root": {
                        borderRadius: "10px !important",
                        px: 3,
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        color: "#64748b",
                        borderColor: "#e2e8f0",
                        "&.Mui-selected": {
                          bgcolor: PRIMARY_BRAND,
                          color: "white",
                          borderColor: PRIMARY_BRAND,
                        },
                      },
                    }}
                  >
                    <ToggleButton value="Chainage">Chainage</ToggleButton>
                    <ToggleButton value="Station">Station</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {/* Field Date Input Method */}
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="#64748b"
                    display="block"
                    mb={1}
                  >
                    FIELD DATE INPUT METHOD
                  </Typography>
                  <ToggleButtonGroup
                    value={fieldInputMethod}
                    exclusive
                    onChange={(_, v) => v && setFieldInputMethod(v)}
                    size="small"
                    sx={{
                      "& .MuiToggleButton-root": {
                        borderRadius: "10px !important",
                        px: 2,
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        color: "#64748b",
                        borderColor: "#e2e8f0",
                        "&.Mui-selected": {
                          bgcolor: PRIMARY_BRAND,
                          color: "white",
                          borderColor: PRIMARY_BRAND,
                        },
                      },
                    }}
                  >
                    <ToggleButton value="HI Method">HI Method</ToggleButton>
                    <ToggleButton value="RF Method">RF Method</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {/* Area Volume Report Model */}
                <CustomTextField
                  select
                  label="Area Volume Report Model"
                  value={reportModel}
                  onChange={(e) => setReportModel(e.target.value)}
                >
                  <MenuItem value="Standard Model">Standard Model (Tabular)</MenuItem>
                  <MenuItem value="Detailed Model">Detailed Equation Model</MenuItem>
                </CustomTextField>

                {/* Hatch Settings */}
                <CustomTextField
                  select
                  label="Hatch Type"
                  value={hatchType}
                  onChange={(e) => setHatchType(e.target.value)}
                  helperText="Applied to cut/fill areas in CS drawings."
                >
                  <MenuItem value="Solid">Solid</MenuItem>
                  <MenuItem value="Diagonal">Diagonal</MenuItem>
                  <MenuItem value="Cross">Cross</MenuItem>
                  <MenuItem value="Dot">Dot</MenuItem>
                </CustomTextField>

                {/* Display Mode */}
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <FiMonitor size={14} color="#64748b" />
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="#64748b"
                    >
                      DISPLAY MODE
                    </Typography>
                  </Stack>
                  <ToggleButtonGroup
                    value={displayMode}
                    exclusive
                    onChange={(_, v) => v && setDisplayMode(v)}
                    size="small"
                    sx={{
                      "& .MuiToggleButton-root": {
                        borderRadius: "10px !important",
                        px: 2,
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: "#64748b",
                        borderColor: "#e2e8f0",
                        "&.Mui-selected": {
                          bgcolor: PRIMARY_BRAND,
                          color: "white",
                          borderColor: PRIMARY_BRAND,
                        },
                      },
                    }}
                  >
                    <ToggleButton value="Light">Light</ToggleButton>
                    <ToggleButton value="Dark">Dark</ToggleButton>
                    <ToggleButton value="System Settings">System</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                    >
                      STORAGE USED
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={800}
                      color={PRIMARY_BRAND}
                    >
                      12.5 GB / 50 GB
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={25}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: "#e2e8f0",
                      "& .MuiLinearProgress-bar": {
                        background: `linear-gradient(90deg, ${PRIMARY_BRAND}, #818cf8)`,
                        borderRadius: 5,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block", fontWeight: 500 }}
                  >
                    25% of your quota is currently utilized.
                  </Typography>
                </Box>
              </Stack>
            </SectionCard>

            {/* Application Overview Mini Card */}
            <motion.div
              variants={fUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: "20px",
                  border: `1px solid ${CARD_BORDER}`,
                  background: `linear-gradient(135deg, ${PRIMARY_BRAND}05, transparent)`,
                  mb: 4,
                  display: { xs: "none", md: "block" },
                }}
              >
                <Stack spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: "#fff",
                      borderRadius: "10px",
                      color: PRIMARY_BRAND,
                    }}
                  >
                    <FiInfo size={24} />
                  </Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={800}
                    color="#1e293b"
                  >
                    Graph Configuration
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={500}
                    lineHeight={1.6}
                  >
                    In the Client Management section, ensuring the Agreement
                    Number and the 3 Hierarchy Graph fields are provided is
                    vital. These fields dictate the X/Y axes and legends for the
                    final project metric reports.
                  </Typography>
                </Stack>
              </Paper>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            {/* Client Management Form */}
            <SectionCard
              icon={<FiBriefcase size={22} />}
              title="Client Management"
              description="Client details and core graph parameters"
              delay={0.2}
            >
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <CustomTextField
                    label="Header (e.g. Department Name)"
                    placeholder="Enter department name"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="#64748b"
                    >
                      AGREEMENT NUMBER
                    </Typography>
                    <Chip
                      label="Compulsory"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "10px",
                        bgcolor: "#fee2e2",
                        color: "#dc2626",
                        fontWeight: 800,
                      }}
                    />
                  </Stack>
                  <CustomTextField
                    required
                    label="Agreement No."
                    placeholder="Enter agreement number"
                    sx={{
                      "& .MuiOutlinedInput-root fieldset": {
                        borderColor: "#cbd5e1",
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box mt={{ xs: 0, sm: "28px" }}>
                    <CustomTextField
                      label="Field 2 (Contractor)"
                      placeholder="Enter contractor name"
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }}>
                    <Chip
                      label="Graphing Parameters"
                      size="small"
                      sx={{ fontWeight: 700, color: "#94a3b8" }}
                    />
                  </Divider>
                </Grid>

                {/* Graphing Fields */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="#64748b"
                    >
                      GRAPH FIELD 1
                    </Typography>
                    <Chip
                      label="Compulsory"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "10px",
                        bgcolor: "#fee2e2",
                        color: "#dc2626",
                        fontWeight: 800,
                      }}
                    />
                  </Stack>
                  <CustomTextField
                    required
                    label="Division"
                    placeholder="e.g. Division A"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="#64748b"
                    >
                      GRAPH FIELD 2
                    </Typography>
                    <Chip
                      label="Compulsory"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "10px",
                        bgcolor: "#fee2e2",
                        color: "#dc2626",
                        fontWeight: 800,
                      }}
                    />
                  </Stack>
                  <CustomTextField
                    required
                    label="Sub-Division"
                    placeholder="e.g. Sub-Div B"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="#64748b"
                    >
                      GRAPH FIELD 3
                    </Typography>
                    <Chip
                      label="Compulsory"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "10px",
                        bgcolor: "#fee2e2",
                        color: "#dc2626",
                        fontWeight: 800,
                      }}
                    />
                  </Stack>
                  <CustomTextField
                    required
                    label="Section"
                    placeholder="e.g. Section 4"
                  />
                </Grid>
              </Grid>
            </SectionCard>

            {/* Autolevel Instrument Details Form */}
            <SectionCard
              icon={<FiTool size={22} />}
              title="Autolevel Instrument Details"
              description="Register your surveying instruments"
              delay={0.3}
            >
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="#64748b"
                    >
                      INSTRUMENT
                    </Typography>
                    <Chip
                      label="Compulsory"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "10px",
                        bgcolor: "#fee2e2",
                        color: "#dc2626",
                        fontWeight: 800,
                      }}
                    />
                  </Stack>
                  <CustomTextField
                    required
                    label="Instrument Name"
                    placeholder="e.g. Sokkia B40"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="#64748b"
                    >
                      IDENTIFIER
                    </Typography>
                    <Chip
                      label="Compulsory"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "10px",
                        bgcolor: "#fee2e2",
                        color: "#dc2626",
                        fontWeight: 800,
                      }}
                    />
                  </Stack>
                  <CustomTextField
                    required
                    label="Instrument No."
                    placeholder="Enter serial/ID"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box mt={{ xs: 0, sm: "28px" }}>
                    <CustomTextField
                      type="date"
                      label="Purchase Date"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box mt={{ xs: 0, sm: "28px" }}>
                    <CustomTextField
                      type="date"
                      label="Last Calibration Date"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </SectionCard>

            {/* Hierarchy Nodes */}
            <SectionCard
              icon={<FiUsers size={22} />}
              title="Hierarchy Nodes"
              description="Assign staff fields to Engineer/Surveyor groups"
              delay={0.4}
            >
              <Stack spacing={3}>
                {[1, 2, 3].map((level) => (
                  <Paper
                    key={level}
                    elevation={0}
                    sx={{
                      border: `1px solid ${CARD_BORDER}`,
                      borderRadius: "16px",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: hierarchyExpanded[level]
                          ? `${PRIMARY_BRAND}08`
                          : "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: `${PRIMARY_BRAND}05`,
                        },
                      }}
                      onClick={() => toggleHierarchy(level)}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: "8px",
                            bgcolor: "white",
                            border: `1px solid ${CARD_BORDER}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: PRIMARY_BRAND,
                            fontWeight: 800,
                          }}
                        >
                          {level}
                        </Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color="#1e293b"
                        >
                          Engineer / Surveyor {level}
                        </Typography>
                      </Stack>
                      <IconButton size="small">
                        {hierarchyExpanded[level] ? (
                          <FiChevronUp />
                        ) : (
                          <FiChevronDown />
                        )}
                      </IconButton>
                    </Box>
                    <Collapse in={hierarchyExpanded[level]}>
                      <Box
                        sx={{
                          p: 3,
                          pt: 1,
                          borderTop: `1px solid ${CARD_BORDER}`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="#94a3b8"
                          display="block"
                          mb={2}
                        >
                          6 NON-COMPULSORY STAFF FIELDS
                        </Typography>
                        <Grid container spacing={2}>
                          {[1, 2, 3, 4, 5, 6].map((fieldNum) => (
                            <Grid
                              size={{ xs: 12, sm: 4 }}
                              key={`level${level}-field${fieldNum}`}
                            >
                              <CustomTextField
                                size="small"
                                label={`Staff ${fieldNum}`}
                                placeholder={`Enter name or ID`}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </Collapse>
                  </Paper>
                ))}
              </Stack>
            </SectionCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
