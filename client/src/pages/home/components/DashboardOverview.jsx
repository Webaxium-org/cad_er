import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Fab,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCheckCircle,
  FiChevronRight,
  FiExternalLink,
  FiFileText,
  FiLayers,
  FiHelpCircle,
  FiPlay,
  FiPlus,
  FiRefreshCw,
  FiSettings,
} from "react-icons/fi";
import AppHeader from "../../../components/AppHeader";
import { APP_VERSION } from "../../../constants/appVersion";
import { compactTitleSx, heroTitleSx } from "../../../components/pageHeaderStyles";
import { getAllSurvey } from "../../../services/surveyServices";
import AlertDialogSlide from "../../../components/AlertDialogSlide";
import CreateTicket from "../../tickets/components/CreateTicket";
import ProfessionalTrialCountdown from "./ProfessionalTrialCountdown";
import { ISLAND_BUTTON_RADIUS } from "../../../components/bottomIslandStyles";
import { DASHBOARD_CARD_RADIUS } from "./dashboardStyles";

const BRAND = "#595cf2";
const PRIMARY_BRAND = "#6366f1";
const Icons = {
  Files: FiLayers,
  Pending: FiAlertCircle,
  Ongoing: FiRefreshCw,
  Completed: FiCheckCircle,
};
const BORDER = "#e2e8f5";
const HEADER_GRADIENT_START = "#4f46e5";
const HEADER_GRADIENT_END = "#6366f1";
const SUCCESS_COLOR = "#10b981";
const fUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const PulseDot = () => (
  <Box component={motion.span} sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#F2F2F2", display: "inline-block", mr: 1 }}
    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />
);
const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "Date not set";

const isPastSchedule = (value) => {
  if (!value) return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return value.slice(0, 10) < today;
};

const getProgress = (survey) => {
  const finished = (survey.purposes || []).filter((purpose) => purpose.isPurposeFinish);
  if (finished.some((purpose) => purpose.type === "Final Level" && purpose.phase === "Actual")) return 80;
  if (finished.some((purpose) => purpose.phase === "Proposal" && purpose.type?.includes("Proposed"))) return 50;
  if (finished.some((purpose) => purpose.type === "Initial Level" && purpose.phase === "Actual")) return 30;
  return 0;
};

const panelSx = {
  border: `1px solid ${BORDER}`,
  borderRadius: DASHBOARD_CARD_RADIUS,
  bgcolor: "white",
  boxShadow: "0 6px 24px rgba(52, 70, 129, 0.04)",
};

function QueuedCard({ survey, onOpen }) {
  const overdue = isPastSchedule(survey.proposalScheduleDate);
  return (
    <Paper elevation={0} sx={{ ...panelSx, p: 1.25 }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} spacing={1.75}>
        <Box sx={{ width: 78, minHeight: 62, bgcolor: "#f5f6ff", borderRadius: "10px", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Typography fontWeight={800} color={BRAND} textAlign="center" lineHeight={1.1}>
            {formatDate(survey.proposalScheduleDate).replace(/\s\d{4}$/, "")}
            <Typography component="span" display="block" variant="caption" fontWeight={600}>
              {survey.proposalScheduleDate?.slice(0, 4) || ""}
            </Typography>
          </Typography>
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" color="#7886a4" fontWeight={700} noWrap>
            {(survey.type || "Survey").toUpperCase()} · {survey.location || "Location not set"}
          </Typography>
          <Typography fontWeight={800} color="#152047" noWrap>{survey.project}</Typography>
          <Typography variant="caption" color="#667795" noWrap display="block">
            {survey.department || survey.division || "Queued for survey"}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1} flexShrink={0}>
          <Chip label="Queued" size="small" sx={{ bgcolor: "#eeeeff", color: BRAND, fontWeight: 700 }} />
          {overdue && <Chip label="Overdue" size="small" sx={{ bgcolor: "#ffeaec", color: "#c3303b", fontWeight: 700 }} />}
          <Button size="small" variant="outlined" startIcon={<FiExternalLink />} onClick={onOpen}
            sx={{ color: BRAND, borderColor: "#b9bbff", textTransform: "none", whiteSpace: "nowrap" }}>
            Open survey
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function ActiveCard({ survey, onResume, onFieldBook, onOpen }) {
  const progress = getProgress(survey);
  const finishedBook = survey.purposes?.find((purpose) => purpose.phase === "Actual" && purpose.isPurposeFinish);
  const current = survey.purposes?.find((purpose) => !purpose.isPurposeFinish);
  return (
    <Paper elevation={0} sx={{ ...panelSx, p: 1.5 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography fontWeight={800} color="#152047" noWrap>{survey.project}</Typography>
            <Chip label="Active" size="small" sx={{ bgcolor: "#e3f8f0", color: "#118461", fontWeight: 700 }} />
          </Stack>
          <Typography variant="caption" color="#667795" display="block">{survey.type || "Survey"}</Typography>
          <Typography variant="caption" color="#667795" display="block" sx={{ mt: 0.75 }}>
            {current ? `${current.type} · In progress` : "Survey in progress"} · Started {formatDate(survey.createdAt)}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ width: { xs: "100%", md: 155 } }}>
          <Typography variant="caption" color={BRAND} fontWeight={800}>{progress}%</Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: "#e9ecfc", "& .MuiLinearProgress-bar": { bgcolor: BRAND, borderRadius: 4 } }} />
        </Stack>
        <Stack direction={{ xs: "row", md: "column" }} spacing={0.75}
          sx={{ minWidth: { md: 132 }, "& > .MuiButton-root": { flex: { xs: 1, md: "initial" }, minHeight: { xs: 50, sm: 48, md: "auto" }, whiteSpace: "nowrap" } }}>
          <Button size="small" variant="contained" startIcon={<FiPlay />} onClick={onResume}
            sx={{ bgcolor: BRAND, textTransform: "none", "&:hover": { bgcolor: "#494bd2" } }}>Resume</Button>
          {finishedBook ? (
            <Button size="small" variant="outlined" startIcon={<FiBookOpen />} onClick={() => onFieldBook(finishedBook)}
              sx={{ color: BRAND, borderColor: "#b9bbff", textTransform: "none" }}>Field book</Button>
          ) : (
            <Button size="small" variant="outlined" startIcon={<FiExternalLink />} onClick={onOpen}
              sx={{ color: BRAND, borderColor: "#b9bbff", textTransform: "none" }}>Open survey</Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function DashboardOverview({ data }) {
  const [ticketOpen, setTicketOpen] = useState(false);
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [compactHeaderVisible, setCompactHeaderVisible] = useState(false);
  const [counts, setCounts] = useState(null);
  const [queue, setQueue] = useState([]);
  const [active, setActive] = useState([]);
  const [overdueTotal, setOverdueTotal] = useState(0);
  const [proposalMetrics, setProposalMetrics] = useState(null);
  const [error, setError] = useState(false);

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
    if (!data?.subscription?.hasAccess) return;
    let mounted = true;
    Promise.all([
      getAllSurvey({ page: 1, limit: 1, metrics: true }),
      getAllSurvey({ status: "Scheduled", page: 1, limit: 1 }),
      getAllSurvey({ status: "Active", page: 1, limit: 2 }),
      getAllSurvey({ status: "Completed", page: 1, limit: 1 }),
      getAllSurvey({ upcoming: true, page: 1, limit: 5 }),
    ]).then(([all, queued, underway, wrapped, scheduled]) => {
      if (!mounted) return;
      setCounts({ total: all.data.total, queued: queued.data.total, underway: underway.data.total, wrapped: wrapped.data.total });
      setProposalMetrics(all.data.proposalMetrics || null);
      setQueue(scheduled.data.surveys || []);
      setActive(underway.data.surveys || []);
      setOverdueTotal(scheduled.data.overdueTotal || 0);
    }).catch(() => { if (mounted) setError(true); });
    return () => { mounted = false; };
  }, [data?.subscription?.hasAccess]);

  const statusItems = [
    { label: "Queued", value: counts?.queued || 0, color: "#f5a100" },
    { label: "Underway", value: counts?.underway || 0, color: BRAND },
    { label: "Wrapped", value: counts?.wrapped || 0, color: "#0ab889" },
  ];
  const total = statusItems.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;
  const gradient = total
    ? `conic-gradient(${statusItems.map((item) => {
      const start = offset;
      offset += item.value / total * 100;
      return `${item.color} ${start}% ${offset}%`;
    }).join(", ")})`
    : "#e9ecf5";
  const openList = (tab) => navigate("/survey", { state: { tab } });
  const openQueued = (survey) => navigate("/survey/road-survey", { state: { surveyId: survey._id, step: 2 } });
  const resume = (survey) => {
    const purpose = survey.purposes?.find((item) => !item.isPurposeFinish);
    navigate(purpose ? `/survey/road-survey/${purpose._id}/rows` : `/survey/road-survey/continue-survey/${survey._id}`);
  };

  return (
    <>
      <AlertDialogSlide
        open={ticketOpen}
        onCancel={() => setTicketOpen(false)}
        title="Help & Support"
        description="If you have any questions or need assistance, describe your issue below and our support team will get back to you as soon as possible."
        content={ticketOpen && <CreateTicket onClose={() => setTicketOpen(false)} />}
      />
      <AppHeader />
      <Box sx={{ minHeight: "100vh", bgcolor: "#f7f9fd", pb: { xs: 3, md: 4 }, "& .MuiButton-root": { borderRadius: ISLAND_BUTTON_RADIUS } }}>
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
            minHeight: 248,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
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
                    <Box>
                      <Typography
                        variant="h5"
                        fontWeight={900}
                        textAlign={"end"}
                      >
                        {counts?.total ?? "—"}
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
                        {counts?.queued ?? "—"}
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
                        {counts?.wrapped ?? "—"}
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
                  borderRadius: DASHBOARD_CARD_RADIUS,
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
                    count: counts ? `${counts.total} Total` : "—",
                    tab: "in_progress",
                  },
                  {
                    label: "Pending",
                    icon: <Icons.Pending />,
                    count: counts ? `${counts.queued} Total` : "—",
                    tab: "queue",
                  },
                  {
                    label: "Ongoing",
                    icon: <Icons.Ongoing />,
                    count: counts ? `${counts.underway} Total` : "—",
                    tab: "in_progress",
                  },
                  {
                    label: "Completed",
                    icon: <Icons.Completed />,
                    count: counts ? `${counts.wrapped} Total` : "—",
                    tab: "wrapped",
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
                      borderRadius: ISLAND_BUTTON_RADIUS,
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
                    onClick={() => openList(action.tab)}
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
        <Container maxWidth="lg">

          {data?.subscription?.kind === "trial" && <ProfessionalTrialCountdown subscription={data.subscription} />}
          {data?.subscription?.kind === "paid" && (
            <Paper elevation={0} sx={{ border: "1px solid #c7d2fe", borderRadius: DASHBOARD_CARD_RADIUS, bgcolor: "#eef2ff", px: 2, py: 1.5, mb: 1.25 }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
                <Box>
                  <Typography fontWeight={800} color="#312e81">{data.subscription.planCode.replaceAll("_", " ")}</Typography>
                  <Typography variant="caption" color="#4338ca">{data.subscription.projectCount} of {data.subscription.projectLimit} new projects used this period</Typography>
                </Box>
                <Button onClick={() => navigate("/subscription")} sx={{ color: "#4f46e5" }}>Manage subscription</Button>
              </Stack>
            </Paper>
          )}

          {overdueTotal > 0 && (
            <Paper elevation={0} sx={{ border: "1px solid #ffd4a0", bgcolor: "#fff7ed", borderRadius: DASHBOARD_CARD_RADIUS, px: 2, py: 1.25, mb: 1.25 }}>
              <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={1.5}>
                <FiAlertCircle size={23} color="#ec8000" />
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={800} color="#a44708" variant="body2">{overdueTotal} queued {overdueTotal === 1 ? "survey needs" : "surveys need"} attention.</Typography>
                  <Typography variant="caption" color="#a44708">Their scheduled dates have passed.</Typography>
                </Box>
                <Button size="small" variant="outlined" onClick={() => openList("queue")}
                  sx={{ borderColor: "#f2a43f", color: "#bc5d00", textTransform: "none", bgcolor: "white" }}>Review queue</Button>
              </Stack>
            </Paper>
          )}

          {error && <Typography color="error" sx={{ mb: 2 }}>Dashboard data could not be loaded. Please refresh the page.</Typography>}
          <Grid container spacing={1.25}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={1.25}>
                <Paper elevation={0} sx={{ ...panelSx, p: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
                    <Typography fontWeight={800} color="#142048">Scheduled surveys</Typography>
                    <Chip label={`${counts?.queued ?? 0} queued`} size="small" sx={{ bgcolor: "#fff0df", color: "#bb6100", fontWeight: 700 }} />
                    <Typography variant="caption" color="#7180a1" sx={{ ml: "auto !important", display: { xs: "none", sm: "block" } }}>Next 5 queued surveys</Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {queue.length ? queue.map((survey) => <QueuedCard key={survey._id} survey={survey} onOpen={() => openQueued(survey)} />)
                      : <Typography variant="body2" color="text.secondary">No queued surveys.</Typography>}
                  </Stack>
                </Paper>
                <Paper elevation={0} sx={{ ...panelSx, p: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                    <Typography fontWeight={800} color="#142048">Continue your surveys</Typography>
                    <Typography variant="caption" color="#7180a1" sx={{ display: { xs: "none", sm: "block" } }}>Your active and in-progress surveys</Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {active.length ? active.map((survey) => (
                      <ActiveCard key={survey._id} survey={survey} onResume={() => resume(survey)}
                        onFieldBook={(purpose) => navigate(`/survey/road-survey/${purpose._id}/field-book`)}
                        onOpen={() => navigate(`/survey/${survey._id}/report`)} />
                    )) : <Typography variant="body2" color="text.secondary">No active surveys.</Typography>}
                  </Stack>
                </Paper>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={1.25}>
                <Paper elevation={0} sx={{ ...panelSx, p: 2 }}>
                  <Typography fontWeight={800} color="#142048" sx={{ mb: 1.5 }}>Project status</Typography>
                  <Box role="img" aria-label={statusItems.map((item) => `${item.label}: ${item.value}`).join(", ")}
                    sx={{ width: 180, height: 180, borderRadius: "50%", background: gradient, mx: "auto", mb: 1.5, display: "grid", placeItems: "center" }}>
                    <Box sx={{ width: 120, height: 120, borderRadius: "50%", bgcolor: "white", display: "grid", placeContent: "center", textAlign: "center" }}>
                      <Typography variant="h5" fontWeight={800} color="#111a43">{counts?.total ?? "—"}</Typography>
                      <Typography variant="caption" color="#667795">Projects</Typography>
                    </Box>
                  </Box>
                  {statusItems.map((item) => (
                    <Stack key={item.label} direction="row" alignItems="center" spacing={1} sx={{ mt: 0.75 }}>
                      <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: item.color }} />
                      <Typography variant="caption" color="#52617f" sx={{ flex: 1 }}>{item.label}</Typography>
                      <Typography variant="caption" color="#111a43" fontWeight={800}>{counts ? item.value : "—"}</Typography>
                    </Stack>
                  ))}
                </Paper>
                <Paper elevation={0} sx={{ ...panelSx, p: 2 }}>
                  <Typography fontWeight={800} color="#142048" sx={{ mb: 1.25 }}>Quick access</Typography>
                  {[
                    { label: "Survey list", detail: "View and manage all projects and surveys", icon: FiLayers, action: () => openList("in_progress") },
                    { label: "Tickets", detail: "View and manage support tickets", icon: FiFileText, action: () => navigate("/tickets") },
                    { label: "Settings", detail: "Manage your preferences", icon: FiSettings, action: () => navigate("/settings") },
                  ].map(({ label, detail, icon: Icon, action }) => (
                    <Button key={label} fullWidth onClick={action} sx={{ border: `1px solid ${BORDER}`, borderRadius: ISLAND_BUTTON_RADIUS, mb: 0.75, p: 1, textAlign: "left", textTransform: "none", color: "#17234d", justifyContent: "flex-start" }}>
                      <Icon size={20} color={BRAND} style={{ marginRight: 12, flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={800}>{label}</Typography>
                        <Typography variant="caption" color="#7583a0" display="block" noWrap>{detail}</Typography>
                      </Box>
                      <FiChevronRight size={17} />
                    </Button>
                  ))}
                </Paper>
                <Paper elevation={0} sx={{ ...panelSx, p: 2 }}>
                  <Typography fontWeight={800} color="#142048" sx={{ mb: 2 }}>Project Milestones</Typography>
                  {[
                    { label: "SURVEY COMPLETION", value: counts?.total ? Math.round((counts.wrapped / counts.total) * 100) : 0, detail: counts ? `${counts.wrapped} of ${counts.total} projects wrapped` : "" },
                    { label: "PROPOSAL GENERATION", value: proposalMetrics?.eligible ? Math.round((proposalMetrics.generated / proposalMetrics.eligible) * 100) : 0, detail: proposalMetrics ? `${proposalMetrics.generated} of ${proposalMetrics.eligible} started projects` : "" },
                  ].map(({ label, value, detail }) => (
                    <Box key={label} sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                        <Typography variant="caption" color="#64748b" fontWeight={800}>{label}</Typography>
                        <Typography variant="caption" color={BRAND} fontWeight={800}>{counts ? `${value}%` : "—"}</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={value} sx={{ height: 7, borderRadius: 4, bgcolor: "#edf0fa", "& .MuiLinearProgress-bar": { bgcolor: BRAND, borderRadius: 4 } }} />
                      <Typography variant="caption" color="#7b87a0">{detail}</Typography>
                    </Box>
                  ))}
                </Paper>
                <Paper
                  elevation={0}
                  component={motion.div}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/survey/add-survey", { state: { openCalibration: true } })}
                  sx={{ p: 3, borderRadius: DASHBOARD_CARD_RADIUS, bgcolor: PRIMARY_BRAND, color: "white", cursor: "pointer", position: "relative", overflow: "hidden", boxShadow: "0 10px 20px -5px rgba(99, 102, 241, 0.3)" }}
                >
                  <Box sx={{ position: "relative", zIndex: 1 }}>
                    <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.8, letterSpacing: "0.1em" }}>CALIBRATION ALERT</Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ mt: 1 }}>Two-Peg Test</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>Check your equipment calibration</Typography>
                    <Typography variant="caption" sx={{ display: "block", mt: 2, opacity: 0.8 }}>Click to start validation</Typography>
                  </Box>
                  <Box sx={{ position: "absolute", bottom: -20, right: -20, width: 100, height: 100, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.1)" }} />
                  <Box sx={{ position: "absolute", top: -10, right: 40, width: 40, height: 40, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)" }} />
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </Container>
        <Fab
          aria-label="Select equipment"
          onClick={() => navigate("/survey/select-equipment")}
          sx={{
            position: "fixed", bottom: 30, right: 30, zIndex: 1100,
            bgcolor: PRIMARY_BRAND, color: "white", width: 60, height: 60,
            borderRadius: ISLAND_BUTTON_RADIUS,
            transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            "&:hover": { bgcolor: HEADER_GRADIENT_START, transform: "scale(1.1)" },
          }}
        >
          <FiPlus size={28} strokeWidth={2.5} />
        </Fab>
        <IconButton
          aria-label="Add ticket"
          onClick={() => setTicketOpen(true)}
          sx={{
            position: "fixed", bottom: 30, left: 30, zIndex: 1100,
            bgcolor: "white", border: `1px solid ${BORDER}`, color: PRIMARY_BRAND,
            p: 1.5, borderRadius: ISLAND_BUTTON_RADIUS, boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            "&:hover": { bgcolor: "#f8fafc" },
          }}
        >
          <FiHelpCircle size={22} />
        </IconButton>
      </Box>
    </>
  );
}
