import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  TextField,
  Paper,
  Button,
  LinearProgress,
} from "@mui/material";
import IOSegmentedTabs from "../../components/IOSegmentedTabs";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
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
import { ProjectListCardSkeleton } from "./components/ProjectListCardSkeleton";
import { highlightText } from "../../internals";
import AlertDialogSlide from "../../components/AlertDialogSlide";
import { showAlert } from "../../redux/alertSlice";
import BasicButton from "../../components/BasicButton";
import SmallHeader from "../../components/SmallHeader";
import { CgGoogleTasks } from "react-icons/cg";
import { GoClock } from "react-icons/go";
import {
  FiBookOpen,
  FiFileText,
  FiPlay,
  FiEdit3,
  FiFlag,
  FiTrash2,
  FiCalendar,
  FiLayers,
} from "react-icons/fi";
import { SiGooglecalendar } from "react-icons/si";
import { PiMicrosoftOutlookLogoFill } from "react-icons/pi";
import { axiosInstance } from "../../utils/config";

const WEATHER_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  95: "Thunderstorm",
};

const forecastCache = new Map();

const getForecast = async (location, date) => {
  const key = `${location}|${date}`;
  const cached = forecastCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.request;
  const request = (async () => {
    const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geoUrl.search = new URLSearchParams({ name: location, count: "1" });
    let place;
    try {
      const geoResponse = await fetch(geoUrl);
      if (geoResponse.ok) place = (await geoResponse.json()).results?.[0];
    } catch {
      // The fallback also handles a temporary location-service failure.
    }
    if (!place) {
      const { data } = await axiosInstance.get("surveys/weather-location", {
        params: { name: location },
      });
      place = data;
    }
    if (!place) throw new Error("Location not found");

    const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
    weatherUrl.search = new URLSearchParams({
      latitude: place.latitude,
      longitude: place.longitude,
      daily: "temperature_2m_max,uv_index_max,weather_code",
      timezone: "auto",
      forecast_days: "16",
    });
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) throw new Error("Forecast unavailable");
    const daily = (await weatherResponse.json()).daily;
    const index = daily?.time?.indexOf(date) ?? -1;
    if (index < 0) return null;
    return {
      temperature: daily.temperature_2m_max?.[index],
      uv: daily.uv_index_max?.[index],
      condition:
        WEATHER_CODES[daily.weather_code?.[index]] || "Variable conditions",
      locationSource: place.source,
      locationName: place.displayName,
    };
  })();
  forecastCache.set(key, { request, expiresAt: Date.now() + 30 * 60 * 1000 });
  request.catch(() => forecastCache.delete(key));
  return request;
};

const QueuedWeather = ({ location, scheduledDate }) => {
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState("idle");
  const date = scheduledDate?.slice(0, 10);

  useEffect(() => {
    if (!date || !location) return;
    const daysAway = Math.round(
      (new Date(`${date}T12:00:00Z`) - new Date()) / 86400000,
    );
    if (daysAway < 0 || daysAway > 15) return;
    let active = true;
    getForecast(location, date)
      .then((result) => {
        if (!active) return;
        setWeather(result);
        setStatus(result ? "ready" : "unavailable");
      })
      .catch(() => {
        if (active) setStatus("unavailable");
      });
    return () => {
      active = false;
    };
  }, [location, date]);

  if (!date || !location)
    return (
      <Typography variant="body2" color="text.secondary">
        Add a date and location to see the forecast.
      </Typography>
    );
  const daysAway = Math.round(
    (new Date(`${date}T12:00:00Z`) - new Date()) / 86400000,
  );
  if (daysAway > 15)
    return (
      <Typography variant="body2" color="text.secondary">
        Forecast available within 16 days of the scheduled date.
      </Typography>
    );
  if (daysAway < 0)
    return (
      <Typography variant="body2" color="text.secondary">
        Scheduled date has passed.
      </Typography>
    );
  if (status === "unavailable")
    return (
      <Typography variant="body2" color="text.secondary">
        Forecast unavailable for this location or date.
      </Typography>
    );
  if (!weather)
    return (
      <Typography variant="body2" color="text.secondary">
        Loading forecast…
      </Typography>
    );
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        <Typography variant="body2">
          Temperature:{" "}
          <strong>
            {weather.temperature == null
              ? "N/A"
              : `${Math.round(weather.temperature)}°C`}
          </strong>
        </Typography>
        <Typography variant="body2">
          UV index: <strong>{weather.uv?.toFixed(1) ?? "N/A"}</strong>
        </Typography>
        <Typography variant="body2">
          Conditions: <strong>{weather.condition}</strong>
        </Typography>
      </Stack>
      {weather.locationSource === "OpenStreetMap" && (
        <Typography variant="caption" color="text.secondary">
          Location: {weather.locationName} · © OpenStreetMap contributors
        </Typography>
      )}
    </Stack>
  );
};

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

const PRIMARY_BRAND = "#6366f1";
const HEADER_GRADIENT_START = "#4f46e5";
const HEADER_GRADIENT_END = "#6366f1";
const BG_COLOR = "#f8fafc";
const CARD_BORDER = "#e2e8f0";
const PROJECT_CARD_SX = {
  borderRadius: "24px",
  border: "1px solid #dfe5ff",
  bgcolor: "#fff",
  boxShadow: "0 10px 28px rgba(38, 58, 110, 0.06)",
  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  "&:hover": {
    borderColor: "#c7d2fe",
    boxShadow: "0 16px 32px rgba(38, 58, 110, 0.1)",
  },
};
const PROJECT_ACCORDION_SX = {
  boxShadow: "none",
  bgcolor: "transparent",
  "&:before": { display: "none" },
  "& .MuiAccordionSummary-root": { minHeight: 0 },
  "& .MuiAccordionSummary-content": { my: 0, py: 0.5 },
  "& .MuiAccordionSummary-expandIconWrapper": { color: "#667795" },
  "& .MuiAccordionDetails-root": { pt: 2 },
};
const PROJECT_ACTION_SX = {
  minHeight: { xs: 50, sm: 48 },
  minWidth: 0,
  width: "100%",
  px: { xs: 0.5, sm: 1.5 },
  borderRadius: "11px",
  borderColor: "#cfd8ff",
  color: HEADER_GRADIENT_START,
  bgcolor: "#f8faff",
  fontSize: { xs: "0.75rem", sm: "0.8125rem" },
  fontWeight: 700,
  textTransform: "none",
  justifyContent: "center",
  whiteSpace: "nowrap",
  "&:hover": { borderColor: PRIMARY_BRAND, bgcolor: "#eef2ff" },
  "& .MuiButton-startIcon": { mr: { xs: 0.5, sm: 0.9 }, fontSize: { xs: 15, sm: 17 } },
};
const PROJECT_ACTION_GRID = {
  Resume: { column: "1 / 4", row: 1 },
  "Field Book": { column: "4 / 7", row: 1 },
  "Reports / Library": { column: "1 / 4", row: 2 },
  "Final Level": { column: "1 / 3", row: 3 },
  "Proposed Level": { column: "3 / 5", row: 3 },
  Delete: { column: "5 / 7", row: 3 },
  "Branch Reports": { column: "1 / 4", row: 4 },
};

const ProjectCardHeader = ({ survey, search, status, progress }) => (
  <Stack spacing={{ xs: 2, md: 1.5 }} width="100%" sx={{ minWidth: 0, py: 0.5 }}>
    <Stack
      direction="row"
      spacing={{ xs: 1.25, sm: 2 }}
      alignItems="center"
      sx={{ minWidth: 0 }}
    >
      <Box
        sx={{
          flex: "0 0 auto",
          width: { xs: 54, sm: 56 },
          height: { xs: 54, sm: 56 },
          display: "grid",
          placeItems: "center",
          bgcolor: "#f0f3ff",
          borderRadius: "18px",
        }}
        title="Auto Level"
      >
        <Lottie
          animationData={autoLevelIcon}
          style={{ width: "82%", height: "82%" }}
          aria-label="Auto Level"
        />
      </Box>
      <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={0.9}
          alignItems="center"
          sx={{ minWidth: 0 }}
        >
          <Typography
            fontSize={{ xs: 12, sm: 13 }}
            fontWeight={800}
            color={HEADER_GRADIENT_START}
            noWrap
          >
            {survey.type || "Survey"}
          </Typography>
          <Typography color="#94a3b8">•</Typography>
          <Typography fontSize={{ xs: 11, sm: 12 }} color="#64748b" noWrap>
            Edited {formatProjectDate(getLastEditedAt(survey))}
          </Typography>
        </Stack>
        <Typography
          fontSize={{ xs: 17, sm: 18 }}
          fontWeight={800}
          color="#17233d"
          noWrap
          title={survey.project}
          sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {highlightText(survey.project, search)}
        </Typography>
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ flexShrink: 0, alignSelf: "flex-start", pt: 0.5 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.85,
            px: { xs: 1, sm: 1.75 },
            py: 0.8,
            borderRadius: 10,
            bgcolor: status === "Queued" ? "#fff7e5" : "#eafaf2",
            color: status === "Queued" ? "#946200" : "#176b47",
          }}
        >
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              bgcolor: status === "Queued" ? "#dfa400" : "#269a67",
              ...(status === "Active"
                ? {
                    animation: "projectPulse 1.8s ease-in-out infinite",
                    "@keyframes projectPulse": {
                      "50%": { opacity: 0.35, boxShadow: "0 0 0 5px #b7eacf" },
                    },
                  }
                : {}),
            }}
          />
          <Typography fontSize={{ xs: 11, sm: 12 }} fontWeight={700}>
            {status}
          </Typography>
        </Box>
      </Stack>
    </Stack>
    {progress != null && (
      <Stack
        direction="row"
        spacing={1.75}
        alignItems="center"
        sx={{ pr: { xs: 0, sm: 1 }, minHeight: 24 }}
      >
        <Typography
          fontSize={{ xs: 18, sm: 19 }}
          fontWeight={800}
          color={HEADER_GRADIENT_START}
          sx={{ width: 48, flexShrink: 0, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {progress}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          aria-label="Project progress"
          sx={{
            flex: 1,
            height: 11,
            borderRadius: 10,
            bgcolor: "#e7ecfc",
            "& .MuiLinearProgress-bar": {
              borderRadius: 10,
              background: `linear-gradient(90deg, ${HEADER_GRADIENT_START}, ${PRIMARY_BRAND})`,
            },
          }}
        />
      </Stack>
    )}
  </Stack>
);

const ProjectDetail = ({ icon: Icon, label, children }) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start">
    <Box sx={{ color: "#50617f", pt: 0.3, flexShrink: 0 }}>
      <Icon size={19} />
    </Box>
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Typography fontSize={12} fontWeight={600} color="#64748b">
        {label}
      </Typography>
      <Typography
        fontSize={{ xs: 14, sm: 14 }}
        fontWeight={700}
        color="#1b2945"
      >
        {children}
      </Typography>
    </Stack>
  </Stack>
);

const formatProjectDate = (value) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleDateString("en-IN")
    : "N/A";

const getLastEditedAt = (survey) => {
  const dates = [survey.updatedAt, survey.createdAt];
  for (const purpose of survey.purposes || []) {
    dates.push(purpose.updatedAt, purpose.purposeFinishDate);
    for (const row of purpose.rows || [])
      dates.push(row.updatedAt, row.createdAt);
  }
  return dates
    .filter(Boolean)
    .reduce(
      (latest, date) => (new Date(date) > new Date(latest) ? date : latest),
      survey.createdAt,
    );
};

const getProjectProgress = (survey) => {
  const finished = (survey.purposes || []).filter(
    (purpose) => purpose.isPurposeFinish,
  );
  if (
    finished.some(
      (purpose) => purpose.type === "Final Level" && purpose.phase === "Actual",
    )
  )
    return 80;
  if (
    finished.some(
      (purpose) =>
        purpose.phase === "Proposal" && purpose.type?.includes("Proposed"),
    )
  )
    return 50;
  if (
    finished.some(
      (purpose) =>
        purpose.type === "Initial Level" && purpose.phase === "Actual",
    )
  )
    return 30;
  return 0;
};

const getCurrentPurpose = (survey) => {
  const purposes = survey.purposes || [];
  const current =
    purposes.find((purpose) => !purpose.isPurposeFinish) ||
    [...purposes].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt),
    )[0];
  return current
    ? `${current.type} · ${current.status || (current.isPurposeFinish ? "Finished" : "Active")}`
    : "Initial Level · Active";
};

const calendarEventUrl = (survey, provider) => {
  const date = survey.proposalScheduleDate?.slice(0, 10);
  if (!date) return null;
  const nextDate = new Date(`${date}T12:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const endDate = nextDate.toISOString().slice(0, 10);
  const description = [
    survey.type,
    survey.engineerSurveyor && `Assignee: ${survey.engineerSurveyor}`,
    survey.client && `Client: ${survey.client}`,
    survey.proposalDeadline &&
      `Deadline: ${formatProjectDate(survey.proposalDeadline)}`,
  ]
    .filter(Boolean)
    .join("\n");
  if (provider === "google") {
    const url = new URL("https://calendar.google.com/calendar/render");
    url.search = new URLSearchParams({
      action: "TEMPLATE",
      text: survey.project,
      dates: `${date.replaceAll("-", "")}/${endDate.replaceAll("-", "")}`,
      details: description,
      location: survey.location || "",
    });
    return url.toString();
  }
  const url = new URL("https://outlook.office.com/calendar/0/deeplink/compose");
  url.search = new URLSearchParams({
    subject: survey.project,
    body: description,
    location: survey.location || "",
    startdt: `${date}T00:00:00`,
    enddt: `${endDate}T00:00:00`,
    isallday: "true",
  });
  return url.toString();
};

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
  const [totals, setTotals] = useState({
    queue: 0,
    in_progress: 0,
    wrapped: 0,
  });

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
        const fetched =
          data?.surveys?.map((survey) => {
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
            const uniqueNew = fetched.filter(
              (s) => !existingIds.has(String(s._id)),
            );
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
              <Typography
                variant="caption"
                sx={{ opacity: 0.7, fontWeight: 700 }}
              >
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
            },
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
    const activeFinal = survey.purposes?.find(
      (purpose) => purpose.type === "Final Level" && !purpose.isPurposeFinish,
    );
    navigate(
      activeFinal
        ? `/survey/road-survey/${activeFinal._id}/rows`
        : `/survey/road-survey/continue-survey/${survey._id}`,
    );
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
            {list?.todo?.map((survey) => (
              <BasicCard
                key={survey._id}
                contentSx={{
                  p: { xs: "12px !important", sm: "21px !important" },
                }}
                content={
                  <Box sx={{ minWidth: 0 }}>
                    <BasicAccordion
                      summary={
                        <ProjectCardHeader
                          survey={survey}
                          search={search}
                          status="Queued"
                        />
                      }
                      details={
                        <Stack
                          spacing={2.25}
                          sx={{ borderTop: "1px solid #dce4ff" }}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            gap={{ xs: 1.5, sm: 4 }}
                            pt={2}
                          >
                            <ProjectDetail icon={FiCalendar} label="Scheduled">
                              {formatProjectDate(survey.proposalScheduleDate)}
                            </ProjectDetail>
                            <ProjectDetail icon={FiLayers} label="Location">
                              {survey.location || "N/A"}
                            </ProjectDetail>
                          </Stack>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: "#f8fafc",
                              border: `1px solid ${CARD_BORDER}`,
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={800}
                              mb={0.5}
                            >
                              Scheduled day forecast
                            </Typography>
                            <QueuedWeather
                              location={survey.location}
                              scheduledDate={survey.proposalScheduleDate}
                            />
                            <Typography
                              component="a"
                              href="https://open-meteo.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="caption"
                              sx={{
                                display: "inline-block",
                                mt: 0.75,
                                color: PRIMARY_BRAND,
                              }}
                            >
                              Weather data: Open-Meteo
                            </Typography>
                          </Box>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            flexWrap="wrap"
                            gap={1}
                          >
                            {survey.engineerSurveyor && (
                              <Typography variant="body2">
                                <strong>Assignee:</strong>{" "}
                                {survey.engineerSurveyor}
                              </Typography>
                            )}
                            {survey.client && (
                              <Typography variant="body2">
                                <strong>Client:</strong> {survey.client}
                              </Typography>
                            )}
                            {survey.proposalDeadline && (
                              <Typography variant="body2">
                                <strong>Deadline:</strong>{" "}
                                {formatProjectDate(survey.proposalDeadline)}
                              </Typography>
                            )}
                            {survey.finalScheduleDate && (
                              <Typography variant="body2">
                                <strong>Final schedule:</strong>{" "}
                                {formatProjectDate(survey.finalScheduleDate)}
                              </Typography>
                            )}
                            {survey.finalDeadline && (
                              <Typography variant="body2">
                                <strong>Final deadline:</strong>{" "}
                                {formatProjectDate(survey.finalDeadline)}
                              </Typography>
                            )}
                          </Stack>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: "#fffbeb",
                              border: "1px solid #fde68a",
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={800}
                              mb={0.75}
                            >
                              ⚠️ Site & Environmental Factors
                            </Typography>
                            <Stack spacing={0.5}>
                              <Typography variant="body2">
                                <strong>Weather and visibility:</strong> Rain,
                                fog, and wind can affect tripod stability and
                                rod visibility.
                              </Typography>
                              <Typography variant="body2">
                                <strong>Terrain and obstructions:</strong>{" "}
                                Vegetation, embankments, and buildings may block
                                sight lines and require more change points.
                              </Typography>
                              <Typography variant="body2">
                                <strong>Ground stability:</strong> Soft ground
                                can let the instrument settle between readings.
                              </Typography>
                            </Stack>
                          </Box>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "repeat(3, minmax(0, 1fr))",
                              },
                              gap: { xs: 0.75, sm: 1.25 },
                              borderTop: "1px solid #dce4ff",
                              pt: 2,
                            }}
                          >
                            <Button
                              variant="contained"
                              startIcon={<FiPlay />}
                              onClick={() => handleContinueSurvey(survey._id)}
                              sx={{
                                ...PROJECT_ACTION_SX,
                                bgcolor: PRIMARY_BRAND,
                                color: "#fff",
                                justifyContent: "center",
                                "&:hover": { bgcolor: HEADER_GRADIENT_START },
                              }}
                            >
                              Resume
                            </Button>
                            {[
                              {
                                provider: "google",
                                label: "Google Calendar",
                                icon: <SiGooglecalendar />,
                              },
                              {
                                provider: "outlook",
                                label: "Outlook Calendar",
                                icon: <PiMicrosoftOutlookLogoFill />,
                              },
                            ].map(({ provider, label, icon }) => (
                              <Button
                                key={provider}
                                component="a"
                                href={calendarEventUrl(survey, provider)}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="outlined"
                                startIcon={icon}
                                aria-label={label}
                                sx={PROJECT_ACTION_SX}
                              >
                                {provider === "google" ? "Google" : "Outlook"}
                                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>&nbsp;Calendar</Box>
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
                      sx={PROJECT_ACCORDION_SX}
                    />
                  </Box>
                }
                sx={PROJECT_CARD_SX}
              />
            ))}
            {renderLoadMoreButton(totals.queue, list?.todo?.length || 0, () =>
              fetchSurveysForTab("queue", pages.queue + 1, true),
            )}
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
                contentSx={{
                  p: { xs: "12px !important", sm: "21px !important" },
                }}
                content={
                  <Box sx={{ minWidth: 0 }}>
                    <BasicAccordion
                      summary={
                        <ProjectCardHeader
                          survey={survey}
                          search={search}
                          status="Active"
                          progress={getProjectProgress(survey)}
                        />
                      }
                      details={
                        <Stack
                          spacing={2.25}
                          sx={{ borderTop: "1px solid #dce4ff" }}
                        >
                          <Stack spacing={2} pt={2}>
                            <ProjectDetail
                              icon={FiLayers}
                              label="Iteration / status / purpose"
                            >
                              {getCurrentPurpose(survey)}
                            </ProjectDetail>
                            <ProjectDetail icon={FiCalendar} label="Started">
                              {formatProjectDate(survey.createdAt)}
                            </ProjectDetail>
                          </Stack>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(6, minmax(0, 1fr))",
                              },
                              "@media (min-width: 360px)": {
                                gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                              },
                              gap: { xs: 1, sm: 1.25 },
                              borderTop: "1px solid #dce4ff",
                              pt: 2,
                            }}
                          >
                            {[
                              {
                                label: "Resume",
                                icon: <FiPlay />,
                                onClick: () => handleContinueSurvey(survey._id),
                              },
                              {
                                label: "Field Book",
                                icon: <FiBookOpen />,
                                onClick: () => handleClickFiledBook(survey._id),
                              },
                              {
                                label: "Reports / Library",
                                icon: <FiFileText />,
                                onClick: () =>
                                  navigate(getLink(survey, "reports")),
                              },
                              {
                                label: "Final Level",
                                icon: <FiFlag />,
                                onClick: () => handleFinalLevel(survey),
                                disabled:
                                  getProjectProgress(survey) < 50 ||
                                  getProjectProgress(survey) >= 80 ||
                                  Boolean(
                                    survey.purposes?.some(
                                      (purpose) =>
                                        !purpose.isPurposeFinish &&
                                        purpose.type !== "Final Level",
                                    ),
                                  ),
                              },
                              {
                                label: "Proposed Level",
                                icon: <FiEdit3 />,
                                onClick: () =>
                                  navigate(getLink(survey, "Propose Level")),
                              },
                              {
                                label: "Delete",
                                icon: <FiTrash2 />,
                                onClick: () =>
                                  handleOpenDeleteProjectAlert(survey._id),
                                color: "error",
                              },
                              ...(survey.branchDetails?.hasBranching
                                ? [
                                    {
                                      label: "Branch Reports",
                                      icon: <FiFileText />,
                                      onClick: () =>
                                        navigate("/survey/report", {
                                          state: {
                                            getBranchReport: true,
                                            surveyId: survey._id,
                                          },
                                        }),
                                    },
                                  ]
                                : []),
                            ].map((action) => (
                              <Button
                                key={action.label}
                                variant={
                                  action.label === "Resume"
                                    ? "contained"
                                    : "outlined"
                                }
                                color={action.color || "primary"}
                                startIcon={action.icon}
                                onClick={action.onClick}
                                disabled={action.disabled}
                                sx={{
                                  ...PROJECT_ACTION_SX,
                                  "@media (min-width: 360px)": {
                                    gridColumn: PROJECT_ACTION_GRID[action.label].column,
                                    gridRow: PROJECT_ACTION_GRID[action.label].row,
                                  },
                                  ...(action.label === "Resume"
                                    ? {
                                        bgcolor: PRIMARY_BRAND,
                                        color: "#fff",
                                        "&:hover": {
                                          bgcolor: HEADER_GRADIENT_START,
                                        },
                                      }
                                    : {}),
                                  ...(action.color === "error"
                                    ? {
                                        color: "#c81e3a",
                                        bgcolor: "#fff7f8",
                                        borderColor: "#ffc6d0",
                                      }
                                    : {}),
                                }}
                              >
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
                      sx={PROJECT_ACCORDION_SX}
                    />
                  </Box>
                }
                sx={PROJECT_CARD_SX}
              />
            ))}
            {renderLoadMoreButton(
              totals.in_progress,
              filteredSurveys?.length || 0,
              () =>
                fetchSurveysForTab("in_progress", pages.in_progress + 1, true),
            )}
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
            {list?.finished?.map((survey) => (
              <BasicCard
                key={survey._id}
                contentSx={{
                  p: { xs: "12px !important", sm: "21px !important" },
                }}
                content={
                  <Box sx={{ minWidth: 0 }}>
                    <BasicAccordion
                      summary={
                        <ProjectCardHeader
                          survey={survey}
                          search={search}
                          status="Wrapped"
                        />
                      }
                      details={
                        <Stack
                          spacing={2.25}
                          sx={{ borderTop: "1px solid #dce4ff" }}
                        >
                          <Stack spacing={2} pt={2}>
                            <ProjectDetail icon={FiLayers} label="Last purpose">
                              {getCurrentPurpose(survey)}
                            </ProjectDetail>
                            <ProjectDetail icon={FiCalendar} label="Started">
                              {formatProjectDate(survey.createdAt)}
                            </ProjectDetail>
                            <ProjectDetail icon={FiCalendar} label="Completed">
                              {formatProjectDate(
                                survey.surveyFinishDate || survey.updatedAt,
                              )}
                            </ProjectDetail>
                          </Stack>
                          {(survey.engineerSurveyor || survey.client) && (
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              gap={1}
                            >
                              {survey.engineerSurveyor && (
                                <Typography variant="body2">
                                  <strong>Engineer / Surveyor:</strong>{" "}
                                  {survey.engineerSurveyor}
                                </Typography>
                              )}
                              {survey.client && (
                                <Typography variant="body2">
                                  <strong>Client:</strong> {survey.client}
                                </Typography>
                              )}
                            </Stack>
                          )}
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: survey.branchDetails?.hasBranching
                                  ? "repeat(3, minmax(0, 1fr))"
                                  : "repeat(2, minmax(0, 1fr))",
                              },
                              gap: { xs: 0.75, sm: 1.25 },
                              borderTop: "1px solid #dce4ff",
                              pt: 2,
                            }}
                          >
                            {[
                              {
                                label: "Field Book",
                                icon: <FiBookOpen />,
                                onClick: () => handleClickFiledBook(survey._id),
                              },
                              {
                                label: "Reports / Library",
                                icon: <FiFileText />,
                                onClick: () =>
                                  navigate(getLink(survey, "reports")),
                              },
                              ...(survey.branchDetails?.hasBranching
                                ? [
                                    {
                                      label: "Branch Reports",
                                      icon: <FiFileText />,
                                      onClick: () =>
                                        navigate("/survey/report", {
                                          state: {
                                            getBranchReport: true,
                                            surveyId: survey._id,
                                          },
                                        }),
                                    },
                                  ]
                                : []),
                            ].map((action) => (
                              <Button
                                key={action.label}
                                variant="outlined"
                                startIcon={action.icon}
                                onClick={action.onClick}
                                aria-label={action.label}
                                sx={PROJECT_ACTION_SX}
                              >
                                <Box component="span" sx={{ display: { xs: survey.branchDetails?.hasBranching ? "inline" : "none", sm: "none" } }}>
                                  {action.label === "Reports / Library" ? "Reports" : action.label === "Branch Reports" ? "Branch" : action.label}
                                </Box>
                                <Box component="span" sx={{ display: { xs: survey.branchDetails?.hasBranching ? "none" : "inline", sm: "inline" } }}>
                                  {action.label}
                                </Box>
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
                      sx={PROJECT_ACCORDION_SX}
                    />
                  </Box>
                }
                sx={PROJECT_CARD_SX}
              />
            ))}
            {renderLoadMoreButton(
              totals.wrapped,
              list?.finished?.length || 0,
              () => fetchSurveysForTab("wrapped", pages.wrapped + 1, true),
            )}
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
      <Box
        sx={{
          width: "100%",
          maxWidth: 980,
          mx: "auto",
          px: { xs: 1.25, sm: 3 },
          pt: 3,
          mb: "82px",
          boxSizing: "border-box",
        }}
      >
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
