import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AlertDialogSlide from "../../../components/AlertDialogSlide";
import UniversalConverter from "../../../components/UniversalConverter";
import CreateTicket from "../../tickets/components/CreateTicket";
import AppHeader from "../../../components/AppHeader";
import { APP_VERSION } from "../../../constants/appVersion";
import { compactTitleSx, heroTitleSx } from "../../../components/pageHeaderStyles";
import { getAllSurvey } from "../../../services/surveyServices";
import {
  Stack,
  Box,
  Typography,
  Grid,
  Paper,
  Fab,
  IconButton,
  Chip,
  Container,
  Divider,
  LinearProgress,
} from "@mui/material";

const unitConverterAlertData = {
  title: "Unit Converter",
  description: "",
  content: "",
  submitButtonText: "Cancel",
};

const fUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const PulseDot = () => (
  <Box
    component={motion.span}
    sx={{
      width: 8,
      height: 8,
      borderRadius: "50%",
      bgcolor: "#F2F2F2",
      display: "inline-block",
      mr: 1,
    }}
    animate={{
      scale: [1, 1.5, 1],
      opacity: [1, 0.5, 1],
    }}
    transition={{
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Requested Palette
const PRIMARY_BRAND = "#6366f1"; // The requested Indigo
const HEADER_GRADIENT_START = "#4f46e5"; // Deep Indigo
const HEADER_GRADIENT_END = "#6366f1"; // Mid Indigo
const SUCCESS_COLOR = "#10b981";
const BG_COLOR = "#f8fafc";
const CARD_BORDER = "#e2e8f0";

// Custom SVG Icons
const Icons = {
  Search: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Chart: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  Files: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  ),
  Pending: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Ongoing: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <polyline points="22 4 22 10 16 10" />
    </svg>
  ),
  Completed: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Map: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  ),
  Notification: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  Add: () => (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Options: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="12" cy="5" r="1"></circle>
      <circle cx="12" cy="19" r="1"></circle>
    </svg>
  ),
  Support: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
};

const taskData = [
  // {
  //   title: "Auto Level Verification",
  //   description: "create level and accurate road profiles",
  //   status: "Pending",
  //   time: "12:00 PM",
  //   category: "Surveying",
  //   assignee: "M. Rivera",
  // },
  // {
  //   title: "Soil Sample Analysis",
  //   description: "analyze soil composition and moisture content",
  //   status: "Pending",
  //   time: "09:30 AM",
  //   category: "Laboratory",
  //   assignee: "S. Chen",
  // },
  // {
  //   title: "Site Inspection",
  //   description: "inspect construction site for quality assurance",
  //   status: "In Progress",
  //   time: "03:45 PM",
  //   category: "Inspection",
  //   assignee: "J. Doe",
  // },
  // {
  //   title: "Material Check",
  //   description: "verify material delivery and measurements",
  //   status: "Pending",
  //   time: "08:15 AM",
  //   category: "Quality",
  //   assignee: "T. Hardy",
  // },
  // {
  //   title: "Excavation Leveling",
  //   description: "ensure excavation is done at correct levels",
  //   status: "In Progress",
  //   time: "11:20 AM",
  //   category: "Surveying",
  //   assignee: "Safety Dept",
  // },
];

const TaskCard = ({ task, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: "20px",
        border: `1px solid ${CARD_BORDER}`,
        mb: 2,
        background: "#fff",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 24px -10px rgba(99, 102, 241, 0.15)",
          borderColor: PRIMARY_BRAND,
        },
      }}
    >
      <Stack direction="row" spacing={3} alignItems="center">
        <Box
          sx={{
            minWidth: 65,
            textAlign: "center",
            bgcolor: `${PRIMARY_BRAND}08`,
            p: 1,
            borderRadius: "12px",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={800}
            color={HEADER_GRADIENT_START}
          >
            {task.time.split(" ")[0]}
          </Typography>
          <Typography variant="caption" fontWeight={700} color={PRIMARY_BRAND}>
            {task.time.split(" ")[1]}
          </Typography>
        </Box>
        <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="caption"
              fontWeight={800}
              sx={{ color: "#94a3b8", letterSpacing: "0.05em" }}
            >
              {task.category.toUpperCase()}
            </Typography>
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                bgcolor: "#cbd5e1",
              }}
            />
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
            >
              By {task.assignee}
            </Typography>
          </Stack>
          <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
            {task.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {task.description}
          </Typography>
        </Stack>
        <Chip
          label={task.status}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: "10px",
            borderRadius: "8px",
            bgcolor:
              task.status === "Pending"
                ? "#fff1f2"
                : task.status === "In Progress"
                  ? "#f5f3ff"
                  : task.status === "Done"
                    ? "#f0fdf4"
                    : "#f8fafc",
            color:
              task.status === "Pending"
                ? "#e11d48"
                : task.status === "In Progress"
                  ? PRIMARY_BRAND
                  : task.status === "Done"
                    ? "#16a34a"
                    : "#64748b",
            border: "1px solid currentColor",
          }}
        />
      </Stack>
    </Paper>
  </motion.div>
);

export default function ProfessionalDashboard() {
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [openUnitConverter, setOpenUnitConverter] = useState(false);
  const [projectCounts, setProjectCounts] = useState(null);
  const heroRef = useRef(null);
  const [compactHeaderVisible, setCompactHeaderVisible] = useState(false);

  useEffect(() => {
    const updateCompactHeader = () => {
      const halfway = (heroRef.current?.offsetHeight || 0) / 2;
      setCompactHeaderVisible(halfway > 0 && window.scrollY >= halfway);
    };
    updateCompactHeader();
    window.addEventListener("scroll", updateCompactHeader, { passive: true });
    window.addEventListener("resize", updateCompactHeader);
    return () => {
      window.removeEventListener("scroll", updateCompactHeader);
      window.removeEventListener("resize", updateCompactHeader);
    };
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all(
      [undefined, "Scheduled", "Active", "Completed"].map((status) =>
        getAllSurvey({ ...(status && { status }), page: 1, limit: 1 }),
      ),
    )
      .then(([all, scheduled, ongoing, completed]) => {
        if (!active) return;
        setProjectCounts({
          total: all.data.total,
          pending: scheduled.data.total,
          ongoing: ongoing.data.total,
          wrapped: completed.data.total,
        });
      })
      .catch(() => {
        if (active) setProjectCounts(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleOpen = (action) => {
    setOpen(action === "help & support");
    setOpenUnitConverter(action === "unit converter");
  };

  const handleClose = () => {
    setOpen(false);
    setOpenUnitConverter(false);
  };

  const alertData = {
    title: "Help & Support",
    description: `If you have any questions or need assistance, we're here to help.
            Please describe your issue below, and our support team will get back
            to you as soon as possible.`,
    content: <CreateTicket onClose={handleClose} />,
  };

  return (
    <>
      <AlertDialogSlide {...alertData} open={open} />

      <AlertDialogSlide
        {...unitConverterAlertData}
        content={<UniversalConverter />}
        open={openUnitConverter}
        onSubmit={handleClose}
      />
      <AppHeader />
      <Box sx={{ bgcolor: BG_COLOR, minHeight: "100vh", pb: 5 }}>
        <AnimatePresence>
          {compactHeaderVisible && (
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              sx={{
                position: "fixed",
                top: { xs: 49, md: 65 },
                left: 0,
                right: 0,
                zIndex: 1099,
                p: 2,
                color: "white",
                background: `linear-gradient(135deg, ${HEADER_GRADIENT_START} 0%, ${HEADER_GRADIENT_END} 100%)`,
                borderRadius: "0 0 20px 20px",
                boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.3)",
              }}
            >
              <Container maxWidth="lg">
                <Typography fontWeight={900} sx={compactTitleSx} letterSpacing="-0.5px">
                  CADER Project <span style={{ color: "#c7d2fe" }}>Hub</span>
                </Typography>
              </Container>
            </Box>
          )}
        </AnimatePresence>
        {/* Indigo Themed Professional Header */}
        <Box
          ref={heroRef}
          sx={{
            background: `linear-gradient(135deg, ${HEADER_GRADIENT_START} 0%, ${HEADER_GRADIENT_END} 100%)`,
            pt: 10,
            pb: 10,
            color: "white",
            borderRadius: "0 0 20px 20px",
            boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.3)",
          }}
        >
          <Container maxWidth="lg">
            {/* Header Hero Content */}
            <Grid
              container
              spacing={3}
              alignItems="flex-end"
              pb={{ xs: 1, md: 0 }}
            >
              <Grid
                size={{ xs: 12, md: 7 }}
                display={"flex"}
                flexDirection={"column"}
                alignItems={"start"}
                justifyContent={"start"}
                height={"100%"}
                sx={{
                  opacity: compactHeaderVisible ? 0 : 1,
                  transform: compactHeaderVisible ? "translateY(-12px) scale(0.96)" : "none",
                  transformOrigin: "left center",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                }}
              >
                <Stack
                  direction={"row"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  width={"stretch"}
                  gap={2}
                >
                  <Typography
                    variant="h3"
                    fontWeight={900}
                    sx={{
                      mb: 1,
                      letterSpacing: "-0.02em",
                      ...heroTitleSx,
                    }}
                  >
                    CADER Project <span style={{ color: "#c7d2fe" }}>Hub</span>
                  </Typography>
                  <Box>
                    <motion.div variants={fUp}>
                      <Box
                        sx={{
                          // display: "inline-flex",
                          px: 2,
                          py: 0.5,
                          borderRadius: 10,
                          // Change: Use a white semi-transparent background for "Glass" effect
                          bgcolor: "rgba(255, 255, 255, 0.15)",
                          border: "1px solid rgba(255, 255, 255, 0.3)",
                          backdropFilter: "blur(4px)",
                          display: { xs: "flex", md: "none" },
                        }}
                      >
                        <Box
                          display="flex"
                          alignItems="center"
                          width={"max-content"}
                        >
                          <PulseDot />
                          <Typography
                            variant="caption"
                            sx={{
                              // Change: Pure white or very light indigo for readability
                              color: "#ffffff",
                              fontWeight: 700,
                              letterSpacing: 1,
                            }}
                          >
                            v{APP_VERSION} is live
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  </Box>
                </Stack>
                <Typography
                  variant="body1"
                  sx={{ opacity: 0.8, maxWidth: 500, fontWeight: 500 }}
                >
                  Streamline your surveying workflow. Access your projects,
                  field reports, and camera tools all in one place.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }} height={"100%"}>
                <Stack
                  alignItems={{ xs: "end", md: "end" }}
                  justifyContent={"space-between"}
                  height={"100%"}
                >
                  <motion.div variants={fUp}>
                    <Box
                      sx={{
                        // display: "inline-flex",
                        px: 2,
                        py: 0.5,
                        mb: 3,
                        borderRadius: 10,
                        // Change: Use a white semi-transparent background for "Glass" effect
                        bgcolor: "rgba(255, 255, 255, 0.15)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        backdropFilter: "blur(4px)",
                        display: { xs: "none", md: "flex" },
                      }}
                    >
                      <Box display="flex" alignItems="center">
                        <PulseDot />
                        <Typography
                          variant="caption"
                          sx={{
                            // Change: Pure white or very light indigo for readability
                            color: "#ffffff",
                            fontWeight: 700,
                            letterSpacing: 1,
                          }}
                        >
                          v{APP_VERSION} is live
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                  <Stack
                    direction="row"
                    spacing={3}
                    justifyContent={{ xs: "flex-end", md: "flex-end" }}
                    width={"100%"}
                  >
                    <Box mt={6}>
                      <Typography
                        variant="h5"
                        fontWeight={900}
                        textAlign={"end"}
                      >
                        {projectCounts?.total ?? "—"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.7,
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                        }}
                      >
                        PROJECTS
                      </Typography>
                    </Box>
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{ borderColor: "rgba(255,255,255,0.2)" }}
                    />
                    <Box>
                      <Typography
                        variant="h5"
                        fontWeight={900}
                        textAlign={"end"}
                      >
                        {projectCounts?.pending ?? "—"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.7,
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                        }}
                      >
                        PENDING
                      </Typography>
                    </Box>
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{ borderColor: "rgba(255,255,255,0.2)" }}
                    />
                    <Box>
                      <Typography
                        variant="h5"
                        fontWeight={900}
                        color={SUCCESS_COLOR}
                        textAlign={"end"}
                      >
                        {projectCounts?.wrapped ?? "—"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.7,
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                        }}
                      >
                        WRAPPED
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Navigation & Action Bar */}
        <Container maxWidth="lg" sx={{ p: "0px !important" }}>
          <Box
            sx={{
              mt: -4,
              mb: 4,
              paddingLeft: "20px",
              paddingRight: "20px",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "start" }}>
              <Paper
                elevation={0}
                sx={{
                  p: "8px",
                  borderRadius: "20px",
                  display: "inline-flex",
                  gap: 2,

                  // --- THE GLASSY BACKGROUND ---
                  bgcolor: "rgba(255, 255, 255, 0.4)", // Low opacity white
                  backdropFilter: "blur(12px)", // This creates the "glass" look
                  WebkitBackdropFilter: "blur(12px)", // Safari Support
                  border: "1px solid rgba(255, 255, 255, 0.3)", // Subtle light edge
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                  // -----------------------------

                  maxWidth: "100%",
                  overflowX: "auto",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {[
                  {
                    label: "Projects",
                    icon: <Icons.Files />,
                    count: projectCounts ? `${projectCounts.total} Total` : "—",
                  },
                  {
                    label: "Pending",
                    icon: <Icons.Pending />,
                    count: "View All",
                  },
                  {
                    label: "Ongoing",
                    icon: <Icons.Ongoing />,
                    count: "View All",
                  },
                  {
                    label: "Completed",
                    icon: <Icons.Completed />,
                    count: "View All",
                  },
                ].map((action, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      px: 2,
                      py: 1,
                      borderRadius: "16px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,

                      // Only the active item stays solid, others stay transparent/glassy
                      bgcolor: i === 0 ? PRIMARY_BRAND : "transparent",
                      color: i === 0 ? "white" : "#1e293b",

                      transition: "0.2s",
                      "&:hover": {
                        bgcolor:
                          i === 0 ? PRIMARY_BRAND : "rgba(255, 255, 255, 0.3)",
                      },
                    }}
                    onClick={() => {
                      navigate("/survey");
                    }}
                  >
                    <Box sx={{ color: i === 0 ? "white" : PRIMARY_BRAND }}>
                      {action.icon}
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight={800}
                        sx={{ lineHeight: 1.1 }}
                      >
                        {action.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.8, fontWeight: 600 }}
                      >
                        {action.count}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Box>
          </Box>
        </Container>

        {/* Dashboard Main Grid */}
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 3 }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#334155">
                    Operational Timeline
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    Daily tasks and verification queue
                  </Typography>
                </Box>
                <Chip
                  label={new Date().toDateString()}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    bgcolor: "#f1f5f9",
                    color: "#64748b",
                    borderRadius: "8px",
                    px: 1,
                  }}
                />
              </Stack>

              <Box>
                <AnimatePresence>
                  {taskData.length ? (
                    taskData.map((task, idx) => (
                      <TaskCard key={idx} task={task} index={idx} />
                    ))
                  ) : (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: "24px",
                        border: `1px solid ${CARD_BORDER}`,
                        background: `linear-gradient(45deg, ${PRIMARY_BRAND}05, white)`,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={900}
                        color={HEADER_GRADIENT_START}
                      >
                        No Tasks Found!
                      </Typography>
                    </Paper>
                  )}
                </AnimatePresence>
              </Box>
            </Grid>

            {/* Modern Sidebar with Richer Content */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                variant="h6"
                fontWeight={800}
                color="#334155"
                sx={{ mb: 3 }}
              >
                Site Intelligence
              </Typography>
              <Stack spacing={3}>
                {/* Broadcasts */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: "24px",
                    border: `1px solid ${CARD_BORDER}`,
                    background: `linear-gradient(45deg, ${PRIMARY_BRAND}05, white)`,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={900}
                    color={HEADER_GRADIENT_START}
                    sx={{ mb: 2 }}
                  >
                    System Updates
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={800}
                        color="#1e293b"
                      >
                        New Features Available
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5, lineHeight: 1.5 }}
                      >
                        Check out the new calibration calculator and enhanced
                        plotting tools in the latest CADER release.
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={800}
                        color="#1e293b"
                      >
                        Maintenance Notice
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5, lineHeight: 1.5 }}
                      >
                        Scheduled server maintenance this weekend. v0.2.0 will
                        be released next week.
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* Project Progress */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: "24px",
                    border: `1px solid ${CARD_BORDER}`,
                    bgcolor: "white",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={900}
                    color="#1e293b"
                    sx={{ mb: 2 }}
                  >
                    Project Milestones
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        sx={{ mb: 1 }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          color="#64748b"
                        >
                          SURVEY COMPLETION
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          color={PRIMARY_BRAND}
                        >
                          88%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={88}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: "#f1f5f9",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: PRIMARY_BRAND,
                          },
                        }}
                      />
                    </Box>
                    <Box>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        sx={{ mb: 1 }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          color="#64748b"
                        >
                          PROPOSAL GENERATION
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          color={PRIMARY_BRAND}
                        >
                          42%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={42}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: "#f1f5f9",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: PRIMARY_BRAND,
                          },
                        }}
                      />
                    </Box>
                  </Stack>
                </Paper>

                {/* Equipment Calibration Card */}
                <Paper
                  elevation={0}
                  component={motion.div}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/survey/select-equipment")}
                  sx={{
                    p: 3,
                    borderRadius: "24px",
                    bgcolor: PRIMARY_BRAND,
                    color: "white",
                    textAlign: "left",
                    boxShadow: "0 10px 20px -5px rgba(99, 102, 241, 0.3)",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  <Box sx={{ position: "relative", zIndex: 1 }}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{ opacity: 0.8, letterSpacing: "0.1em" }}
                    >
                      CALIBRATION ALERT
                    </Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ mt: 1 }}>
                      Two-Peg Test Due
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ opacity: 0.9, mt: 0.5, fontWeight: 500 }}
                    >
                      Auto Level (Sokkia B40)
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mt: 2, opacity: 0.7 }}
                    >
                      Click to start validation
                    </Typography>
                  </Box>
                  {/* Decorative circle */}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: -20,
                      right: -20,
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      bgcolor: "rgba(255,255,255,0.1)",
                    }}
                  />
                  {/* Second Decorative circle */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: -10,
                      right: 40,
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: "rgba(255,255,255,0.05)",
                    }}
                  />
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </Container>

        {/* Floating Action Button */}
        <Fab
          aria-label="Select equipment"
          sx={{
            position: "fixed",
            bottom: 30,
            right: 30,
            bgcolor: PRIMARY_BRAND,
            color: "white",
            width: 60,
            height: 60,
            borderRadius: "14px",
            "&:hover": {
              bgcolor: HEADER_GRADIENT_START,
              transform: "scale(1.1)",
            },
            transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
          onClick={() => navigate("/survey/select-equipment")}
        >
          <Icons.Add />
        </Fab>

        {/* Support Action Button */}
        <IconButton
          aria-label="Add ticket"
          onClick={() => handleOpen("help & support")}
          sx={{
            position: "fixed",
            bottom: 30,
            left: 30,
            bgcolor: "white",
            border: `1px solid ${CARD_BORDER}`,
            color: PRIMARY_BRAND,
            p: 1.5,
            borderRadius: "14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            "&:hover": { bgcolor: "#f8fafc" },
          }}
        >
          <Icons.Support />
        </IconButton>
      </Box>
    </>
  );
}
