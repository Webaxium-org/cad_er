import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  styled,
  IconButton,
  TextField,
  Paper,
  Button,
  LinearProgress,
} from "@mui/material";
import IOSegmentedTabs from "../../components/IOSegmentedTabs";
import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { stopLoading } from "../../redux/loadingSlice";
import { handleFormError } from "../../utils/handleFormError";
import { deleteSurvey, getAllSurvey } from "../../services/surveyServices";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import autoLevelIcon from "../../assets/icons/compass.json";
import BasicAccordion from "../../components/BasicAccordion";
import { MdOutlineExpandMore, MdOutlineSearch } from "react-icons/md";
import { MdSort } from "react-icons/md";
import BasicCard from "../../components/BasicCard";
import StatusChip from "../../components/StatusChip";
import { IoIosArrowForward } from "react-icons/io";
import { ProjectListCardSkeleton } from "./components/ProjectListCardSkeleton";
import { highlightText } from "../../internals";
import AlertDialogSlide from "../../components/AlertDialogSlide";
import { showAlert } from "../../redux/alertSlice";
import BasicButton from "../../components/BasicButton";
import { MdDelete } from "react-icons/md";
import SmallHeader from "../../components/SmallHeader";
import BasicDivider from "../../components/BasicDevider";
import { CgGoogleTasks } from "react-icons/cg";
import { GoClock } from "react-icons/go";
import { FiBookOpen, FiFileText, FiPlay, FiEdit3, FiFlag, FiTrash2 } from "react-icons/fi";

const alertDetails = {
  title: "Field Book",
  description: "Please select the level to go to the field book",
  content: "",
  cancelButtonText: "Cancel",
  submitButtonText: "View",
};

const deleteProjectAlertDetails = {
  title: "Delete Project",
  description: "Are you sure you want to delete this project?",
  content: "",
  cancelButtonText: "Cancel",
  submitButtonText: "Delete",
};

const colors = {
  Initial: "green",
  Proposed: "blue",
  Final: "red",
};

const PRIMARY_BRAND = "#6366f1";
const HEADER_GRADIENT_START = "#4f46e5";
const HEADER_GRADIENT_END = "#6366f1";
const BG_COLOR = "#f8fafc";
const CARD_BORDER = "#e2e8f0";

const formatProjectDate = (value) => value && !Number.isNaN(new Date(value).getTime())
  ? new Date(value).toLocaleDateString("en-IN")
  : "N/A";

const getLastEditedAt = (survey) => {
  const dates = [survey.updatedAt, survey.createdAt];
  for (const purpose of survey.purposes || []) {
    dates.push(purpose.updatedAt, purpose.purposeFinishDate);
    for (const row of purpose.rows || []) dates.push(row.updatedAt, row.createdAt);
  }
  return dates.filter(Boolean).reduce((latest, date) =>
    new Date(date) > new Date(latest) ? date : latest, survey.createdAt);
};

const getProjectProgress = (survey) => {
  const finished = (survey.purposes || []).filter((purpose) => purpose.isPurposeFinish);
  if (finished.some((purpose) => purpose.type === "Final Level" && purpose.phase === "Actual")) return 80;
  if (finished.some((purpose) => purpose.phase === "Proposal" && purpose.type?.includes("Proposed"))) return 50;
  if (finished.some((purpose) => purpose.type === "Initial Level" && purpose.phase === "Actual")) return 30;
  return 0;
};

const getCurrentPurpose = (survey) => {
  const purposes = survey.purposes || [];
  const current = purposes.find((purpose) => !purpose.isPurposeFinish)
    || [...purposes].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))[0];
  return current ? `${current.type} · ${current.status || (current.isPurposeFinish ? "Finished" : "Active")}` : "Initial Level · Active";
};

const Item = styled(Box)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(0.5),
  marginBottom: 0,
  color: "rgba(0, 0, 0, 0.74)",
  fontSize: "14px",
  display: "flex",
  justifyContent: "space-between",
}));

const fieldsToMap = [
  {
    key: "Auto Level",
    value: "Equipment",
    type: "constant",
  },
  {
    key: "type",
    value: "Type",
  },
  {
    key: "lastPurpose",
    value: "Purpose",
  },
  {
    key: "updatedAt",
    value: "Last Edited",
    type: "Date",
  },
  {
    key: "scheduledDate",
    value: "Scheduled Date",
    type: "Date",
  },
  {
    key: <IoIosArrowForward fontSize={20} color="rgba(0, 111, 253, 1)" />,
    value: "Field Book",
    type: "Icon",
  },
  {
    key: <IoIosArrowForward fontSize={20} color="rgba(0, 111, 253, 1)" />,
    value: "Propose Level",
    type: "Icon",
  },
  {
    key: <IoIosArrowForward fontSize={20} color="rgba(0, 111, 253, 1)" />,
    value: "Reports",
    type: "Icon",
  },
];

const getLink = (survey, target, type) => {
  if (target === "reports") {
    return `/survey/${survey._id}/report`;
  }

  if (target === "Propose Level") {
    return `/survey/${survey._id}/propose-level`;
  }

  const level = survey?.purposes?.find(
    (p) => p.type === (type || "Initial Level"),
  );

  if (target === "Field Book") {
    if (level?.isPurposeFinish) {
      return `/survey/road-survey/${level._id}/field-book`;
    } else {
      return "#";
    }
  } else {
    return `/survey/${survey._id}/report`;
  }
};

export default function ProjectsList() {
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { state } = useLocation();

  const [tab, setTab] = useState("in_progress");

  const [loading, setLoading] = useState(true);

  const [surveys, setSurveys] = useState([]);

  const [list, setList] = useState({
    todo: [],
    in_progress: [],
    finished: [],
  });

  const [searchMode, setSearchMode] = useState(false);

  const [alertData, setAlertData] = useState(alertDetails);

  const [open, setOpen] = useState(false);

  const [link, setLink] = useState("");

  const [search, setSearch] = useState("");

  const [deleteProjectAlert, setDeleteProjectAlert] = useState(false);

  const [deleteId, setDeleteId] = useState("");

  const [pages, setPages] = useState({ queue: 1, in_progress: 1, wrapped: 1 });
  const [totals, setTotals] = useState({ queue: 0, in_progress: 0, wrapped: 0 });

  const handleChange = (newValue) => {
    setTab(newValue);
  };

  const filteredSurveys = list?.in_progress;

  const fetchSurveysForTab = async (tabName, pageToFetch, isAppend = false) => {
    try {
      if (pageToFetch === 1) {
        setLoading(true);
      }

      const statusMap = {
        queue: "Scheduled",
        in_progress: "Active",
        wrapped: "Completed",
      };

      const params = {
        status: statusMap[tabName],
        page: pageToFetch,
        limit: 10,
      };

      if (search && tabName === "in_progress") {
        params.project = search;
      }

      const { data } = await getAllSurvey(params);
      if (data.success) {
        const fetched = data?.surveys?.map((survey) => {
          const lastPurposeDoc = [...(survey?.purposes || [])]
            .reverse()
            .find((p) => p.phase === "Actual");

          return {
            ...survey,
            lastPurpose: lastPurposeDoc?.type || "N/A",
          };
        }) || [];

        // Update list
        setList((prev) => {
          const keyMap = {
            queue: "todo",
            in_progress: "in_progress",
            wrapped: "finished",
          };
          const key = keyMap[tabName];
          return {
            ...prev,
            [key]: isAppend ? [...prev[key], ...fetched] : fetched,
          };
        });

        // Update surveys state for navigation/actions
        setSurveys((prev) => {
          if (isAppend) {
            const existingIds = new Set(prev.map((s) => String(s._id)));
            const uniqueNew = fetched.filter((s) => !existingIds.has(String(s._id)));
            return [...prev, ...uniqueNew];
          } else {
            return fetched;
          }
        });

        setTotals((prev) => ({
          ...prev,
          [tabName]: data.total || 0,
        }));

        setPages((prev) => ({
          ...prev,
          [tabName]: pageToFetch,
        }));
      } else {
        throw Error("Failed to fetch surveys");
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      setLoading(false);
      dispatch(stopLoading());
    }
  };

  const renderLoadMoreButton = (totalCount, visibleCount, onLoadMore) => {
    if (totalCount <= visibleCount) return null;
    const remaining = totalCount - visibleCount;
    const nextCount = Math.min(10, remaining);
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mt={4}
        mb={2}
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <BasicButton
          variant="outlined"
          onClick={onLoadMore}
          value={
            <Stack direction="row" alignItems="center" spacing={1}>
              <span>Show {nextCount} more surveys</span>
              <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 700 }}>
                ({remaining} remaining)
              </Typography>
            </Stack>
          }
          sx={{
            borderRadius: "14px",
            px: 4,
            py: 1.5,
            borderColor: "rgba(99, 102, 241, 0.3)",
            color: PRIMARY_BRAND,
            background: "rgba(99, 102, 241, 0.04)",
            fontWeight: 700,
            fontSize: "14px",
            boxShadow: "0 4px 12px -5px rgba(99, 102, 241, 0.1)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              background: "rgba(99, 102, 241, 0.1)",
              borderColor: PRIMARY_BRAND,
              transform: "translateY(-1px)",
              boxShadow: "0 6px 16px -4px rgba(99, 102, 241, 0.2)",
            },
            "&:active": {
              transform: "translateY(1px)",
            }
          }}
        />
      </Box>
    );
  };

  const handleContinueSurvey = async (id) => {
    try {
      const survey = surveys.find((s) => String(s._id) === id);

      if (!survey) throw Error("Something went wrong");
      if (survey.isSurveyFinish) throw Error("The survey already finished");

      // Scheduled survey → open Create Project form at Step 2
      if (survey.status === "Scheduled") {
        navigate("/survey/road-survey", {
          state: { surveyId: survey._id, step: 2 },
        });
        return;
      }

      const activePurpose = survey.purposes?.find((p) => !p.isPurposeFinish);

      if (activePurpose) {
        navigate(`/survey/road-survey/${activePurpose._id}/rows`);
      } else {
        navigate(`/survey/road-survey/continue-survey/${survey._id}`);
      }
    } catch (err) {
      dispatch(
        showAlert({
          type: "error",
          message: "Something went wrong",
        }),
      );
    }
  };


  const handleClose = () => {
    setLink("");

    setOpen(false);
  };

  const handleOpenDeleteProjectAlert = (id) => {
    setDeleteId(id);
    setDeleteProjectAlert(true);
  };

  const handleCloseDeleteProjectAlert = () => {
    setDeleteId("");
    setDeleteProjectAlert(false);
  };

  const handleDeleteProject = async () => {
    try {
      const { data } = await deleteSurvey(deleteId);

      const updatedList = list.in_progress.filter(
        (s) => String(s._id) !== deleteId,
      );

      setList((prev) => ({
        ...prev,
        in_progress: updatedList,
      }));

      setTotals((prev) => ({
        ...prev,
        in_progress: Math.max(0, prev.in_progress - 1),
      }));

      if (data.success) {
        dispatch(
          showAlert({
            type: "success",
            message: "Project deleted successfully",
          }),
        );
      } else {
        throw Error("Something went wrong");
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      setDeleteProjectAlert(false);
    }
  };

  const handleFinalLevel = (survey) => {
    const activeFinal = survey.purposes?.find((purpose) => purpose.type === "Final Level" && !purpose.isPurposeFinish);
    navigate(activeFinal
      ? `/survey/road-survey/${activeFinal._id}/rows`
      : `/survey/road-survey/continue-survey/${survey._id}`);
  };

  const handleClickFiledBook = (surveyId) => {
    const survey = surveys.find((s) => String(s._id) === surveyId);
    if (!survey) return;

    const fieldBooks = survey.purposes.filter(
      (p) => p.phase === "Actual" && p.isPurposeFinish,
    );

    if (!fieldBooks.length) {
      return dispatch(
        showAlert({
          type: "warning",
          message: "Please complete the Initial Level",
        }),
      );
    }

    if (fieldBooks.length === 1) {
      const link = getLink(survey, "Field Book");

      return navigate(link);
    }

    setAlertData((prev) => ({
      ...prev,
      content: (
        <Box mt={2}>
          {fieldBooks.map((fieldBook, idx) => (
            <BasicButton
              key={idx}
              sx={{
                width: "100%",
                borderRadius: 1.5,
                p: 1.5,
                mb: 1,
                justifyContent: "space-between",
                textAlign: "left",
                border: "1px solid #e0e0e0",
              }}
              variant="outlined"
              onClick={() =>
                setLink(getLink(survey, "Field Book", fieldBook?.type))
              }
              value={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    variant="body2"
                    fontSize="16px"
                    fontWeight={600}
                    color="black"
                  >
                    {fieldBook?.type}
                  </Typography>
                </Stack>
              }
            />
          ))}
        </Box>
      ),
    }));

    setOpen(true);
  };

  const handleViewFieldBook = () => {
    if (!link) {
      return dispatch(
        showAlert({
          type: "warning",
          message: "Please select a level to view the field book.",
        }),
      );
    }

    navigate(link);
  };

  useEffect(() => {
    const searchText = state?.search?.trim() || "";
    const selectedTab = state?.tab;

    if (searchText) {
      setSearchMode(true);
      setSearch(searchText);
    }

    if (selectedTab) {
      setTab(selectedTab);
    }
  }, [state]);

  useEffect(() => {
    fetchSurveysForTab(tab, 1, false);
  }, [tab, search]);

  // 🔥 Reusable motion variants
  const fadeSlide = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
  };

  const tabContent = {
    queue: (
      <motion.div {...fadeSlide}>
        {list?.todo?.length ? (
          <Stack spacing={2}>
            {list?.todo?.map((survey, idx) => (
              <BasicCard
                key={idx}
                content={
                  <Box>
                    <BasicAccordion
                      summary={
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          width="100%"
                          pr={1}
                          sx={{ minWidth: 0, overflow: "hidden" }}
                        >
                          {/* Modern Avatar */}
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContinueSurvey(survey._id);
                            }}
                            sx={{
                              minWidth: 50,
                              height: 50,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: `${PRIMARY_BRAND}15`,
                              borderRadius: "14px",
                              color: PRIMARY_BRAND,
                              fontWeight: 800,
                              fontSize: "1.2rem",
                              cursor: "pointer",
                            }}
                          >
                            {survey.project.slice(0, 1).toUpperCase()}
                          </Box>

                          {/* Main Info */}
                          <Stack
                            spacing={0.5}
                            sx={{ flexGrow: 1, minWidth: 0 }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Typography
                                variant="caption"
                                fontWeight={800}
                                sx={{
                                  color: PRIMARY_BRAND,
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {survey.type?.toUpperCase() || "SURVEY"}
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
                                color="#94a3b8"
                              >
                                {new Date(survey.createdAt)?.toLocaleDateString(
                                  "en-IN",
                                )}
                              </Typography>
                            </Stack>

                            <Typography
                              variant="body2"
                              fontWeight={800}
                              fontSize="13px"
                              color="#1e293b"
                              sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                ".MuiAccordionSummary-root.Mui-expanded &": {
                                  whiteSpace: "normal",
                                  textOverflow: "clip",
                                  overflowWrap: "anywhere",
                                },
                              }}
                            >
                              {highlightText(survey.project, search)}
                            </Typography>
                          </Stack>

                          {/* Status */}
                          <Box onClick={(e) => e.stopPropagation()}>
                            <StatusChip status={survey.status} />
                          </Box>
                        </Stack>
                      }
                      details={
                        <Stack>
                          <Item>
                            <Typography fontSize={14} fontWeight={600} color="rgba(0, 0, 0, 0.54)">
                              Proposal Schedule Date
                            </Typography>
                            <Typography fontSize={14} fontWeight={700}>
                              {survey.proposalScheduleDate
                                ? new Date(survey.proposalScheduleDate).toLocaleDateString("en-IN")
                                : "N/A"}
                            </Typography>
                          </Item>
                          <Item>
                            <Typography fontSize={14} fontWeight={600} color="rgba(0, 0, 0, 0.54)">
                              Deadline
                            </Typography>
                            <Typography fontSize={14} fontWeight={700}>
                              {survey.proposalDeadline
                                ? new Date(survey.proposalDeadline).toLocaleDateString("en-IN")
                                : "N/A"}
                            </Typography>
                          </Item>
                          <Item>
                            <Typography fontSize={14} fontWeight={600} color="rgba(0, 0, 0, 0.54)">
                              Location
                            </Typography>
                            <Typography fontSize={14} fontWeight={700}>
                              {survey.location || "N/A"}
                            </Typography>
                          </Item>
                          {survey.finalScheduleDate && (
                            <Item>
                              <Typography fontSize={14} fontWeight={600} color="rgba(0, 0, 0, 0.54)">
                                Final Schedule Date
                              </Typography>
                              <Typography fontSize={14} fontWeight={700}>
                                {new Date(survey.finalScheduleDate).toLocaleDateString("en-IN")}
                              </Typography>
                            </Item>
                          )}
                          {survey.finalDeadline && (
                            <Item>
                              <Typography fontSize={14} fontWeight={600} color="rgba(0, 0, 0, 0.54)">
                                Final Deadline
                              </Typography>
                              <Typography fontSize={14} fontWeight={700}>
                                {new Date(survey.finalDeadline).toLocaleDateString("en-IN")}
                              </Typography>
                            </Item>
                          )}
                        </Stack>
                      }
                      expandIcon={
                        <MdOutlineExpandMore
                          color="rgba(161, 161, 170, 1)"
                          fontSize={28}
                        />
                      }
                      sx={{ boxShadow: "none" }}
                    />

                    {/* Bottom row removed for modern look */}
                  </Box>
                }
                sx={{
                  borderRadius: "20px",
                  border: `1px solid ${CARD_BORDER}`,
                  background: "#fff",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 24px -10px rgba(99, 102, 241, 0.15)",
                    borderColor: PRIMARY_BRAND,
                  },
                }}
              />
            ))}
            {renderLoadMoreButton(totals.queue, list?.todo?.length || 0, () => fetchSurveysForTab("queue", pages.queue + 1, true))}
          </Stack>
        ) : (
          <Box textAlign="center" mt={6}>
            <Typography fontSize="20px" fontWeight={600}>
              Todo Items
            </Typography>
            <Typography fontSize="14px" color="gray" mt={1}>
              Your scheduled projects will appear here.
            </Typography>
          </Box>
        )}
      </motion.div>
    ),
    in_progress: (
      <motion.div {...fadeSlide}>
        {filteredSurveys?.length ? (
          <Stack spacing={2}>
            {filteredSurveys?.map((survey) => (
              <BasicCard
                key={survey._id}
                contentSx={{ p: "16px !important" }}
                content={
                  <Box sx={{ minWidth: 0 }}>
                    <BasicAccordion
                      summary={
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                          width="100%"
                          sx={{ minWidth: 0, overflow: "hidden", pr: 0.5 }}
                        >
                          <Box
                            sx={{
                              flex: "0 0 48px",
                              height: 48,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: "#eef2ff",
                              borderRadius: "14px",
                              color: PRIMARY_BRAND,
                            }}
                            title="Auto Level"
                          >
                            <Lottie animationData={autoLevelIcon} style={{ width: 40, height: 40 }} aria-label="Auto Level" />
                          </Box>
                          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                              <Typography variant="caption" fontWeight={800} color={PRIMARY_BRAND} noWrap>
                                {survey.type || "Survey"}
                              </Typography>
                              <Typography variant="caption" color="#94a3b8">•</Typography>
                              <Typography variant="caption" fontWeight={600} color="#64748b" noWrap>
                                Edited {formatProjectDate(getLastEditedAt(survey))}
                              </Typography>
                            </Stack>
                            <Typography
                              variant="body2"
                              fontWeight={800}
                              fontSize="15px"
                              color="#1e293b"
                              sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={survey.project}
                            >
                              {highlightText(survey.project, search)}
                            </Typography>
                          </Stack>
                          <Stack alignItems="flex-end" spacing={0.5} sx={{ flexShrink: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#16a34a", boxShadow: "0 0 0 3px #dcfce7", animation: "pulse 1.8s ease-in-out infinite", "@keyframes pulse": { "50%": { opacity: 0.45, boxShadow: "0 0 0 6px #dcfce7" } } }} />
                              <Typography variant="caption" fontWeight={800} color="#15803d">Active</Typography>
                            </Stack>
                            <Typography variant="caption" fontWeight={800} color={PRIMARY_BRAND}>{getProjectProgress(survey)}%</Typography>
                          </Stack>
                        </Stack>
                      }
                      details={
                        <Stack spacing={2} sx={{ pt: 1.5 }}>
                          <LinearProgress variant="determinate" value={getProjectProgress(survey)} aria-label="Project progress" sx={{ height: 8, borderRadius: 5, bgcolor: "#e0e7ff", "& .MuiLinearProgress-bar": { bgcolor: PRIMARY_BRAND, borderRadius: 5 } }} />
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                            <Typography variant="body2"><strong>Iteration / status / purpose:</strong> {getCurrentPurpose(survey)}</Typography>
                            <Typography variant="body2"><strong>Started:</strong> {formatProjectDate(survey.createdAt)}</Typography>
                          </Stack>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, p: 1.5, borderRadius: 3, bgcolor: "#f8fafc", border: `1px solid ${CARD_BORDER}` }}>
                            {[
                              { label: "Resume", icon: <FiPlay />, onClick: () => handleContinueSurvey(survey._id) },
                              { label: "Field Book", icon: <FiBookOpen />, onClick: () => handleClickFiledBook(survey._id) },
                              { label: "Reports / Library", icon: <FiFileText />, onClick: () => navigate(getLink(survey, "reports")) },
                              { label: "Final Level", icon: <FiFlag />, onClick: () => handleFinalLevel(survey), disabled: getProjectProgress(survey) < 50 || getProjectProgress(survey) >= 80 || Boolean(survey.purposes?.some((purpose) => !purpose.isPurposeFinish && purpose.type !== "Final Level")) },
                              { label: "Proposed Level", icon: <FiEdit3 />, onClick: () => navigate(getLink(survey, "Propose Level")) },
                              { label: "Delete", icon: <FiTrash2 />, onClick: () => handleOpenDeleteProjectAlert(survey._id), color: "error" },
                              ...(survey.branchDetails?.hasBranching ? [{ label: "Branch Reports", icon: <FiFileText />, onClick: () => navigate("/survey/report", { state: { getBranchReport: true, surveyId: survey._id } }) }] : []),
                            ].map((action) => (
                              <Button key={action.label} size="small" variant="outlined" color={action.color || "inherit"} startIcon={action.icon} onClick={action.onClick} disabled={action.disabled} sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700, whiteSpace: "nowrap", ...(action.color ? {} : { color: PRIMARY_BRAND, borderColor: PRIMARY_BRAND, "&:hover": { borderColor: HEADER_GRADIENT_START, bgcolor: `${PRIMARY_BRAND}0d` } }) }}>
                                {action.label}
                              </Button>
                            ))}
                          </Box>
                        </Stack>
                      }
                      expandIcon={
                        <MdOutlineExpandMore
                          color="rgba(161, 161, 170, 1)"
                          fontSize={28}
                        />
                      }
                      sx={{ boxShadow: "none", "&:before": { display: "none" } }}
                    />
                  </Box>
                }
                sx={{
                  borderRadius: "18px",
                  border: `1px solid ${CARD_BORDER}`,
                  boxShadow: "0 6px 20px -12px rgba(30, 41, 59, 0.28)",
                }}
              />
            ))}
            {renderLoadMoreButton(totals.in_progress, filteredSurveys?.length || 0, () => fetchSurveysForTab("in_progress", pages.in_progress + 1, true))}
          </Stack>
        ) : (
          <Box textAlign="center" mt={6}>
            <Typography fontSize="20px" fontWeight={600}>
              In Progress
            </Typography>
            <Typography fontSize="14px" color="gray" mt={1}>
              Your ongoing projects will appear here.
            </Typography>
          </Box>
        )}
      </motion.div>
    ),
    wrapped: (
      <motion.div {...fadeSlide}>
        {list?.finished?.length ? (
          <Stack spacing={2}>
            {list?.finished?.map((survey, idx) => (
              <BasicCard
                key={idx}
                content={
                  <Box>
                    <BasicAccordion
                      summary={
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          width="100%"
                          pr={1}
                          sx={{ minWidth: 0, overflow: "hidden" }}
                        >
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContinueSurvey(survey._id);
                            }}
                            sx={{
                              minWidth: 50,
                              height: 50,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: `${PRIMARY_BRAND}15`,
                              borderRadius: "14px",
                              color: PRIMARY_BRAND,
                              fontWeight: 800,
                              fontSize: "1.2rem",
                              cursor: "pointer",
                            }}
                          >
                            {survey.project.slice(0, 1).toUpperCase()}
                          </Box>
                          <Stack
                            spacing={0.5}
                            sx={{ flexGrow: 1, minWidth: 0 }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Typography
                                variant="caption"
                                fontWeight={800}
                                sx={{
                                  color: PRIMARY_BRAND,
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {survey.type?.toUpperCase() || "SURVEY"}
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
                                color="#94a3b8"
                              >
                                {new Date(survey.createdAt)?.toLocaleDateString(
                                  "en-IN",
                                )}
                              </Typography>
                            </Stack>
                            <Typography
                              variant="body2"
                              fontWeight={800}
                              fontSize="13px"
                              color="#1e293b"
                              sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                ".MuiAccordionSummary-root.Mui-expanded &": {
                                  whiteSpace: "normal",
                                  textOverflow: "clip",
                                  overflowWrap: "anywhere",
                                },
                              }}
                            >
                              {highlightText(survey.project, search)}
                            </Typography>
                          </Stack>
                        </Stack>
                      }
                      details={
                        <Stack>
                          {fieldsToMap
                            ?.filter((item) => item.value !== "Scheduled Date")
                            .map(({ key, value, type }, idx) => (
                              <Item key={idx}>
                                {value}

                                {type === "Icon" ? (
                                  value === "Field Book" ? (
                                    <Box
                                      onClick={() =>
                                        handleClickFiledBook(survey._id)
                                      }
                                    >
                                      {key}
                                    </Box>
                                  ) : (
                                    <Link to={getLink(survey, value)}>
                                      {key}
                                    </Link>
                                  )
                                ) : (
                                  <Typography
                                    color={
                                      key === "lastPurpose"
                                        ? colors[
                                            survey[key]?.includes("Initial")
                                              ? "Initial"
                                              : survey[key]?.includes("Final")
                                                ? "Final"
                                                : ""
                                          ]
                                        : ""
                                    }
                                    fontSize={14}
                                    fontWeight={700}
                                  >
                                    {type === "Date"
                                      ? new Date(
                                          survey[key],
                                        )?.toLocaleDateString("en-IN")
                                      : type === "constant"
                                        ? key
                                        : survey[key]}
                                  </Typography>
                                )}
                              </Item>
                            ))}

                          {survey?.branchDetails?.hasBranching && (
                            <Item>
                              Branch Reports
                              <Typography fontSize={14} fontWeight={700}>
                                <IoIosArrowForward
                                  fontSize={20}
                                  color="rgba(0, 111, 253, 1)"
                                  onClick={() =>
                                    navigate(`/survey/report`, {
                                      state: {
                                        getBranchReport: true,
                                        surveyId: survey._id,
                                      },
                                    })
                                  }
                                />
                              </Typography>
                            </Item>
                          )}
                        </Stack>
                      }
                      expandIcon={
                        <MdOutlineExpandMore
                          color="rgba(161, 161, 170, 1)"
                          fontSize={28}
                        />
                      }
                      sx={{ boxShadow: "none" }}
                    />

                    <BasicDivider borderBottomWidth={0.5} color="#d9d9d9" />

                    <Stack
                      direction={"row"}
                      justifyContent={"space-between"}
                      alignItems={"center"}
                      px={1}
                    >
                      <Typography
                        fontWeight={600}
                        fontSize="14px"
                        color="rgba(0, 0, 0, 0.74)"
                      >
                        Status
                      </Typography>

                      <StatusChip status={survey.status} />
                    </Stack>
                  </Box>
                }
                sx={{
                  borderRadius: "12px",
                  boxShadow: "0px 4px 8px 0px #1c252c2a",
                }}
              />
            ))}
            {renderLoadMoreButton(totals.wrapped, list?.finished?.length || 0, () => fetchSurveysForTab("wrapped", pages.wrapped + 1, true))}
          </Stack>
        ) : (
          <Box textAlign="center" mt={6}>
            <Typography fontSize="20px" fontWeight={600}>
              Finished Projects
            </Typography>
            <Typography fontSize="14px" color="gray" mt={1}>
              Your finished projects will appear here.
            </Typography>
          </Box>
        )}
      </motion.div>
    ),
  };

  return (
    <Box
      overflow={"hidden"}
      sx={{ bgcolor: BG_COLOR, minHeight: "100vh", pb: 5 }}
    >
      <SmallHeader />

      <AlertDialogSlide
        {...alertData}
        open={open}
        onCancel={handleClose}
        onSubmit={handleViewFieldBook}
      />

      <AlertDialogSlide
        {...deleteProjectAlertDetails}
        open={deleteProjectAlert}
        onCancel={handleCloseDeleteProjectAlert}
        onSubmit={handleDeleteProject}
      />

      <Box
        className="overlapping-header"
        position={"sticky"}
        p={2}
        top={0}
        zIndex={10}
        sx={{
          background: `linear-gradient(135deg, ${HEADER_GRADIENT_START} 0%, ${HEADER_GRADIENT_END} 100%)`,
          color: "white",
          borderRadius: "0 0 20px 20px",
          boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.3)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* 🔍 Left Icon */}
          {/* <IconButton
            onClick={() => setSearchMode(true)}
            sx={{ color: "white" }}
          >
            <MdOutlineSearch size={26} />
          </IconButton> */}

          <div></div>

          <motion.div
            key="title"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
          >
            <Typography
              fontWeight={900}
              fontSize="24px"
              letterSpacing="-0.5px"
              mb={0}
            >
              Explore your projects!
            </Typography>
          </motion.div>

          {/* ↕ Sort Icon */}
          <IconButton sx={{ color: "white" }}>
            <MdSort size={26} />
          </IconButton>
        </Box>

        {/* iOS Tabs display: 'flex', justifyContent: 'center', */}
        {/* <Box>
          <IOSegmentedTabs
            value={tab}
            onChange={handleChange}
            tabs={[
              { label: "To do", value: "todo" },
              { label: "In progress", value: "in_progress" },
              { label: "Finished", value: "finished" },
            ]}
          />
        </Box> */}
      </Box>

      <Box
        component={motion.div}
        initial={{ y: 100, opacity: 0, x: "-50%" }}
        animate={{ y: 0, opacity: 1, x: "-50%" }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 100,
          delay: 0.2,
        }}
        sx={{
          position: "fixed",
          bottom: { xs: 24, md: 32 },
          left: "50%",
          zIndex: 1000,
          width: "max-content",
          maxWidth: "90vw",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: "8px",
            borderRadius: "24px",
            display: "inline-flex",
            alignItems: "center",
            gap: { xs: 1, md: 1.5 },
            background: "rgba(99, 102, 241, 0.15)", // Transparent indigo
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            boxShadow: "0 20px 40px -10px rgba(99, 102, 241, 0.2)",
            height: { xs: "50px", md: "60px" },
            maxWidth: "stretch",
            overflowX: "auto",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {[
            {
              label: "QUEUED",
              value: "queue",
              icon: <CgGoogleTasks fontSize="20px" />,
              onClick: () => handleChange("queue"),
            },
            {
              label: "UNDERWAY",
              value: "in_progress",
              icon: <GoClock fontSize="20px" />,
              onClick: () => handleChange("in_progress"),
            },
            {
              label: "WRAPPED",
              value: "wrapped",
              icon: (
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
              onClick: () => handleChange("wrapped"),
            },
          ].map((type, i) => (
            <Box
              key={i}
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: { xs: 2, md: 6 },
                height: "100%",
                borderRadius: "16px",
                cursor: "pointer",
                minWidth: "70px",
                whiteSpace: "nowrap",
                flexShrink: 0,
                bgcolor: "white",
                color: tab === type.value ? "white" : "#6366f1",
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: tab === type.value ? "white" : "#f8fafc",
                },
              }}
              onClick={type.onClick}
            >
              {tab === type.value && (
                <Box
                  component={motion.div}
                  layoutId="activeReportType"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 25,
                  }}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: "#6366f1", // similar tone color for selected
                    borderRadius: "16px",
                    zIndex: 0,
                    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
                  }}
                />
              )}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={900}
                  sx={{
                    lineHeight: 1,
                    position: "relative",
                    zIndex: 1,
                    color: "inherit",
                    display: "flex",
                    alignItems: "center",
                    transition: "color 0.3s ease",
                  }}
                >
                  {type.icon}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={900}
                  letterSpacing="0.05em"
                  sx={{
                    lineHeight: 1,
                    position: "relative",
                    zIndex: 1,
                    color: "inherit",
                    fontSize: { xs: "0.8rem", md: "1rem" },
                    transition: "color 0.3s ease",
                  }}
                >
                  {type.label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      </Box>

      {/* Animate tab content */}
      <Box px={2} pt={3} mb={"82px"}>
        {loading ? (
          <Stack spacing={2}>
            {Array.from({ length: 7 }).map((_, idx) => (
              <ProjectListCardSkeleton key={idx} />
            ))}
          </Stack>
        ) : (
          <AnimatePresence mode="popLayout">{tabContent[tab]}</AnimatePresence>
        )}
      </Box>
    </Box>
  );
}
