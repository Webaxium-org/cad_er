import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  styled,
  IconButton,
  TextField,
} from "@mui/material";
import IOSegmentedTabs from "../../components/IOSegmentedTabs";
import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { stopLoading } from "../../redux/loadingSlice";
import { handleFormError } from "../../utils/handleFormError";
import { getAllSurvey } from "../../services/surveyServices";
import { motion, AnimatePresence } from "framer-motion";
import BasicAccordion from "../../components/BasicAccordion";
import LetterAvatar from "../../components/LetterAvatar";
import BasicDivider from "../../components/BasicDevider";
import { MdOutlineExpandMore, MdOutlineSearch } from "react-icons/md";
import { MdSort } from "react-icons/md";
import BasicCard from "../../components/BasicCard";
import StatusChip from "../../components/StatusChip";
import { TiEye } from "react-icons/ti";
import { ProjectListCardSkeleton } from "./components/ProjectListCardSkeleton";
import { highlightText } from "../../internals";
import AlertDialogSlide from "../../components/AlertDialogSlide";
import { showAlert } from "../../redux/alertSlice";
import BasicButton from "../../components/BasicButton";

const alertDetails = {
  title: "Field Book",
  description: "Please select the level to go to the field book",
  content: "",
  cancelButtonText: "Cancel",
  submitButtonText: "View",
};

const colors = {
  Initial: "green",
  Proposed: "blue",
  Final: "red",
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
    key: <TiEye fontSize={20} color="rgba(0, 111, 253, 1)" />,
    value: "Field Book",
    type: "Icon",
  },
  {
    key: <TiEye fontSize={20} color="rgba(0, 111, 253, 1)" />,
    value: "Reports",
    type: "Icon",
  },
];

const getLink = (survey, target, type) => {
  if (target === "reports") {
    return `/survey/${survey._id}/report`;
  }

  const level = survey?.purposes?.find(
    (p) => p.type === (type || "Initial Level")
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

  const [tab, setTab] = useState("two");

  const [loading, setLoading] = useState(true);

  const [surveys, setSurveys] = useState([]);

  const [searchMode, setSearchMode] = useState(false);

  const [alertData, setAlertData] = useState(alertDetails);

  const [open, setOpen] = useState(false);

  const [link, setLink] = useState("");

  const [search, setSearch] = useState("");

  const handleChange = (e, newValue) => setTab(newValue);

  const filteredSurveys = surveys.filter((s) =>
    s.project.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinueSurvey = async (id) => {
    try {
      const survey = surveys.find((s) => String(s._id) === id);

      if (!survey) throw Error("Something went wrong");
      if (survey.isSurveyFinish) throw Error("The survey already finished");

      const activePurpose = survey.purposes?.find((p) => !p.isPurposeFinish);

      if (activePurpose) {
        navigate(`/survey/road-survey/${activePurpose._id}/rows`);
      } else {
        navigate(`/survey/road-survey/${survey._id}`);
      }
    } catch (err) {
      dispatch(
        showAlert({
          type: "error",
          message: "Something went wrong",
        })
      );
    }
  };

  const handleClose = () => {
    setLink("");

    setOpen(false);
  };

  const handleClickFiledBook = (surveyId) => {
    const survey = surveys.find((s) => String(s._id) === surveyId);
    if (!survey) return;

    const fieldBooks = survey.purposes.filter(
      (p) => p.phase === "Actual" && p.isPurposeFinish
    );

    if (!fieldBooks.length) {
      return dispatch(
        showAlert({
          type: "warning",
          message: "Please complete the Initial Level",
        })
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
        })
      );
    }

    navigate(link);
  };

  const fetchSurveys = async () => {
    try {
      const { data } = await getAllSurvey();
      if (data.success) {
        const updatedSurveys =
          data?.surveys?.map((survey) => {
            const lastPurposeDoc = survey?.purposes
              ?.reverse()
              ?.find((p) => p.phase === "Actual");

            return {
              ...survey,
              lastPurpose: lastPurposeDoc?.type || "N/A",
            };
          }) || [];

        setSurveys(updatedSurveys);
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

  useEffect(() => {
    const searchText = state?.search?.trim() || "";

    if (searchText) {
      setSearchMode(true);
      setSearch(searchText);
    }
  }, [state]);

  useEffect(() => {
    fetchSurveys();
  }, []);

  // 🔥 Reusable motion variants
  const fadeSlide = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
  };

  const tabContent = {
    one: (
      <motion.div {...fadeSlide}>
        <Box textAlign="center" mt={6}>
          <Typography fontSize="20px" fontWeight={600}>
            To Do Items
          </Typography>
          <Typography fontSize="14px" color="gray" mt={1}>
            Your scheduled projects will appear here.
          </Typography>
        </Box>
      </motion.div>
    ),
    two: (
      <motion.div {...fadeSlide}>
        {filteredSurveys?.length ? (
          <Stack spacing={2}>
            {filteredSurveys?.map((survey, idx) => (
              <BasicCard
                key={idx}
                content={
                  <Box>
                    <BasicAccordion
                      summary={
                        <Stack
                          direction={"row"}
                          alignItems={"center"}
                          spacing={1}
                        >
                          <LetterAvatar
                            letter={survey.project.slice(0, 1)}
                            bgcolor={"rgba(0, 111, 253, 1)"}
                            onClick={() => handleContinueSurvey(survey._id)}
                          />

                          <Box>
                            <Typography fontWeight={600} fontSize="14px">
                              {highlightText(survey.project, search)}
                            </Typography>
                            <Typography
                              fontWeight={500}
                              color="rgba(161, 161, 170, 1)"
                              fontSize="14px"
                            >
                              {new Date(survey.createdAt)?.toLocaleDateString(
                                "en-IN"
                              )}
                            </Typography>
                          </Box>
                        </Stack>
                      }
                      details={
                        <Stack>
                          {fieldsToMap.map(({ key, value, type }, idx) => (
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
                                  <Link to={getLink(survey, value)}>{key}</Link>
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
                                    ? new Date(survey[key])?.toLocaleDateString(
                                        "en-IN"
                                      )
                                    : type === 'constant' ? key: survey[key]}
                                </Typography>
                              )}
                            </Item>
                          ))}
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
    three: (
      <motion.div {...fadeSlide}>
        <Box textAlign="center" mt={6}>
          <Typography fontSize="20px" fontWeight={600}>
            Finished Projects
          </Typography>
          <Typography fontSize="14px" color="gray" mt={1}>
            Completed projects will appear here.
          </Typography>
        </Box>
      </motion.div>
    ),
  };

  return (
    <Box>
      <AlertDialogSlide
        {...alertData}
        open={open}
        onCancel={handleClose}
        onSubmit={handleViewFieldBook}
      />

      <Box position={"sticky"} p={2} top={0} bgcolor={"white"} zIndex={1}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          {/* 🔍 Left Icon */}
          <IconButton onClick={() => setSearchMode(true)}>
            <MdOutlineSearch size={26} />
          </IconButton>

          {/* 🔄 Title / Search Input with Animation */}
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <AnimatePresence mode="wait">
              {!searchMode ? (
                // 🏷️ Projects Title
                <motion.div
                  key="title"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                >
                  <Typography fontWeight={700} fontSize="20px">
                    Projects
                  </Typography>
                </motion.div>
              ) : (
                // 🔍 Search Input
                <motion.div
                  key="searchInput"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                  style={{ width: "100%" }}
                >
                  <TextField
                    autoFocus
                    size="small"
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{
                      width: "85%",
                      background: "#F3F3F3",
                      borderRadius: "8px",
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                    }}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => {
                            setSearch("");
                            setSearchMode(false);
                          }}
                        >
                          ❌
                        </IconButton>
                      ),
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Box>

          {/* ↕ Sort Icon */}
          <IconButton>
            <MdSort size={26} />
          </IconButton>
        </Box>

        {/* iOS Tabs display: 'flex', justifyContent: 'center', */}
        <Box>
          <IOSegmentedTabs
            value={tab}
            onChange={handleChange}
            tabs={[
              { label: "To do", value: "one" },
              { label: "In progress", value: "two" },
              { label: "Finished", value: "three" },
            ]}
          />
        </Box>
      </Box>

      {/* Animate tab content */}
      <Box px={2} mb={"82px"}>
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
