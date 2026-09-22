import { Activity, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import { handleFormError } from "../../utils/handleFormError";
import {
  deleteSurveyPurpose,
  getAllSurvey,
  getSurvey,
} from "../../services/surveyServices";

// MUI
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Chip,
  Stack,
} from "@mui/material";

import { MdDelete } from "react-icons/md";
import BasicAutocomplete from "../../components/BasicAutocomplete";
import BasicButton from "../../components/BasicButton";
import SmallHeader from "../../components/SmallHeader";
import DeductionContent from "./components/DeductionContent";
import AlertDialogSlide from "../../components/AlertDialogSlide";
import StyledTextLink from "../../components/StyledTextLink";
import { showAlert } from "../../redux/alertSlice";

import { VscGraphLine } from "react-icons/vsc";
import { SlGraph } from "react-icons/sl";
import { BiSolidReport } from "react-icons/bi";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { FaFileExport } from "react-icons/fa6";

const Report = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { state } = useLocation();

  const { global } = useSelector((state) => state.loading);

  const [survey, setSurvey] = useState(null);

  const [surveys, setSurveys] = useState(null);

  const [inputValue, setInputValue] = useState("");

  const [selectedPurposes, setSelectedPurposes] = useState([]);

  const [reportType, setReportType] = useState(null);

  const [open, setOpen] = useState(null);

  const [deletePurpose, setDeletePurpose] = useState(null);

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const handleInputChange = (e, newValue) => {
    const surveyId = newValue.value;

    setInputValue(newValue);
    setSurvey(surveys.find((s) => String(s._id) === String(surveyId)));
  };

  const fetchData = async () => {
    try {
      if (!global) dispatch(startLoading());
      const { data } = id
        ? await getSurvey(id)
        : await getAllSurvey(
            state?.getBranchReport ? { rootBranch: state?.surveyId } : {},
          );

      id ? setSurvey(data.survey) : setSurveys(data.surveys);
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const togglePurpose = (purpose) => {
    setSelectedPurposes((prev) =>
      prev.find((p) => p._id === purpose._id)
        ? prev.filter((p) => p._id !== purpose._id)
        : [...prev, purpose],
    );
  };

  const isSelected = (id) => selectedPurposes.some((p) => p._id === id);

  // ----- Select All Logic -----
  const allSelected =
    survey?.purposes?.length > 0 &&
    selectedPurposes.length === survey?.purposes?.length;

  const partiallySelected =
    selectedPurposes.length > 0 &&
    selectedPurposes.length < survey?.purposes?.length;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedPurposes([]);
    else setSelectedPurposes(survey?.purposes || []);
  };

  const getLink = () => {
    let link = `/survey/road-survey/${survey._id}/`;

    if (reportType === "cross") {
      link += "report";
    }
    if (reportType === "longitudinal") {
      link += "longitudinal-report";
    }
    if (reportType === "area") {
      link += "area-report";
    }
    if (reportType === "volume") {
      link += "volume-report";
    }

    if (reportType === "batch-plotting") {
      link += "plotting-and-quantity-report";
    }

    return link;
  };

  const generateReport = (rows) => {
    try {
      if (
        (reportType === "area" || reportType === "volume") &&
        selectedPurposes.length > 2
      ) {
        throw Error(
          `Only two surveys can be selected for the ${reportType} report.`,
        );
      }

      const link = getLink();
      const selectedIds = selectedPurposes.map((p) => p._id);

      navigate(link, {
        state: {
          selectedPurposeIds: selectedIds,
          rows: rows ? structuredClone(rows) : null,
        },
      });
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    }
  };

  const generateDeductionReport = (rows) => {
    generateReport(rows);
  };

  const getFLBLink = (survey, type) => {
    const level = survey?.purposes?.find(
      (p) => p.type === (type || "Initial Level"),
    );

    if (level?.isPurposeFinish) {
      return `/survey/road-survey/${level._id}/field-book`;
    } else {
      return "#";
    }
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

    if (fieldBooks.length) {
      const link = getFLBLink(survey);

      return navigate(link);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const alertData = {
    title: "",
    description: "",
    content: (
      <DeductionContent
        purpose={selectedPurposes[0]}
        onCancel={handleClose}
        onSubmit={generateDeductionReport}
      />
    ),
    onCancel: handleClose,
  };

  const handleClickDelete = (p) => {
    if (p.type === "Initial Level") {
      return dispatch(
        showAlert({
          type: "warning",
          message: "You cannot delete Initial Level",
        }),
      );
    }

    setDeletePurpose(p);
    setDeleteAlertOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteAlertOpen(false);
    setDeletePurpose(null);
  };

  const deleteAlertData = {
    title: "Delete Purpose",
    description: `Are you sure you want to delete "${deletePurpose?.type}" purpose?`,
    onCancel: handleCloseDelete,
    onSubmit: () => handleDeletePurpose(deletePurpose._id),
    cancelButtonText: "Cancel",
    submitButtonText: "Delete",
  };

  const handleDeletePurpose = async (id) => {
    try {
      await deleteSurveyPurpose(id);
      setSelectedPurposes((prev) => prev.filter((p) => p._id !== id));
      setSurvey((prev) => ({
        ...prev,
        purposes: prev.purposes.filter((p) => p._id !== id),
      }));
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      handleCloseDelete();
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <SmallHeader />
      <AlertDialogSlide {...deleteAlertData} open={deleteAlertOpen} />
      <AlertDialogSlide {...alertData} open={open} />

      <Box pt={{ xs: 3, md: 5 }} pb={2}>
        <Typography
          variant="h4"
          fontWeight={900}
          align="center"
          color="#1e293b"
          sx={{
            letterSpacing: "-0.02em",
            fontSize: { xs: "1.5rem", md: "2rem" },
          }}
        >
          Explore your library!
        </Typography>
        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          fontWeight={600}
          mt={1}
        >
          Hey, designate a category from the footer navigation island to advance.
        </Typography>
      </Box>

      {/* Select Report Type Island */}
      <Box
        component={motion.div}
        initial={{ y: 100, opacity: 0, x: "-50%" }}
        animate={{ y: 0, opacity: 1, x: "-50%" }}
        transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.2 }}
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
              label: "CS",
              value: "cross",
              icon: <VscGraphLine fontSize="20px" />,
            },
            {
              label: "LS",
              value: "longitudinal",
              icon: <SlGraph fontSize="20px" />,
            },
            {
              label: "Area",
              value: "area",
              icon: <BiSolidReport fontSize="20px" />,
            },
            {
              label: "Volume",
              value: "volume",
              icon: <HiOutlineDocumentReport fontSize="20px" />,
            },
            {
              label: "Export",
              value: "batch-plotting",
              icon: <FaFileExport fontSize="20px" />,
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
                color: reportType === type.value ? "white" : "#6366f1",
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: reportType === type.value ? "white" : "#f8fafc",
                },
              }}
              onClick={() => setReportType(type.value)}
            >
              {reportType === type.value && (
                <Box
                  component={motion.div}
                  layoutId="activeReportType"
                  initial={false}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
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

      {/* Main Content Card with Animation */}
      <AnimatePresence mode="wait">
        {reportType && (
          <motion.div
            key={reportType}
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              // width: "100%",
              maxWidth: "900px",
              margin: "0 auto",
              padding: "0 16px",
              paddingBottom: "100px",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: "28px",
                bgcolor: "#ffffff",
                boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
                border: "1px solid rgba(226, 232, 240, 0.8)",
                position: "relative",
                overflow: "hidden",
                mt: 3,
              }}
            >
              {/* Decorative Header Line */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "6px",
                  background:
                    "linear-gradient(90deg, #4f46e5 0%, #0ea5e9 100%)",
                }}
              />

              <Stack spacing={4}>
                {!id ? (
                  <Box>
                    <BasicAutocomplete
                      label={
                        state?.getBranchReport
                          ? "Select Branch"
                          : "Select Survey"
                      }
                      options={
                        surveys?.length
                          ? surveys?.map((s) => ({
                              label: s.project,
                              value: s._id,
                            }))
                          : []
                      }
                      value={inputValue}
                      onChange={(e, newValue) => handleInputChange(e, newValue)}
                      placeholder={"Select..."}
                    />
                  </Box>
                ) : (
                  <Typography
                    variant="h6"
                    fontWeight="800"
                    color="#334155"
                    noWrap={true}
                  >
                    Project Name:{" "}
                    <span style={{ fontWeight: "600", color: "#6366f1" }}>
                      {survey?.project}
                    </span>
                  </Typography>
                )}

                {state?.getBranchReport && survey && (
                  <Box display={"flex"} justifyContent={"start"}>
                    <StyledTextLink
                      onClick={() => handleClickFiledBook(survey._id)}
                      children={"Generate FLB"}
                    />
                  </Box>
                )}

                <Activity
                  mode={
                    survey &&
                    reportType === "volume" &&
                    selectedPurposes.length === 2
                      ? "visible"
                      : "hidden"
                  }
                >
                  <Box display={"flex"} justifyContent={"center"}>
                    <BasicButton
                      value={"DEDUCTION"}
                      variant="outlined"
                      sx={{
                        fontSize: "12px",
                        padding: "5.6px 11px",
                        minWidth: "200px",
                      }}
                      onClick={handleOpen}
                    />
                  </Box>
                </Activity>

                <Activity mode={survey ? "visible" : "hidden"}>
                  <TableContainer
                    component={Box}
                    sx={{
                      borderRadius: 3,
                      overflow: "hidden",
                      border: "1px solid rgba(226, 232, 240, 0.8)",
                    }}
                  >
                    <Table>
                      <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                        <TableRow>
                          <TableCell></TableCell>
                          <TableCell
                            sx={{
                              fontWeight: "bold",
                              fontSize: { xs: 12, sm: 14 },
                              color: "#475569",
                            }}
                          >
                            Purpose
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: "bold",
                              fontSize: { xs: 12, sm: 14 },
                              color: "#475569",
                              textAlign: "center",
                            }}
                          >
                            Description
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: "bold",
                              fontSize: { xs: 12, sm: 14 },
                              color: "#475569",
                              textAlign: "end",
                              paddingRight: 4,
                            }}
                          >
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {survey?.purposes?.map((purpose) => (
                          <TableRow
                            key={purpose._id}
                            hover
                            onClick={() => togglePurpose(purpose)}
                            sx={{
                              cursor: "pointer",
                              background: isSelected(purpose._id)
                                ? "rgba(99, 102, 241, 0.08)"
                                : "inherit",
                              transition: "background 0.2s",
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                color="primary"
                                checked={isSelected(purpose._id)}
                              />
                            </TableCell>

                            <TableCell sx={{ fontSize: { xs: 12, sm: 14 } }}>
                              {purpose.type}
                            </TableCell>

                            <TableCell
                              sx={{
                                fontSize: { xs: 12, sm: 14 },
                                textAlign: "center",
                              }}
                            >
                              {purpose.description || "No description"}
                            </TableCell>
                            <TableCell
                              sx={{
                                fontSize: { xs: 12, sm: 14 },
                              }}
                            >
                              <Box display={"flex"} justifyContent={"end"}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleClickDelete(purpose)}
                                  disabled={purpose.type === "Initial Level"}
                                  sx={{
                                    background:
                                      "linear-gradient(135deg, #e54646ff 0%, #e54646ff 100%)",
                                    color: "white",
                                    height: "30px",
                                    borderRadius: "8px",
                                    border: "none",
                                    fontWeight: 800,
                                    letterSpacing: "0.05em",
                                    boxShadow:
                                      "0 10px 25px -5px rgba(99, 102, 241, 0.4)",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                      background:
                                        "linear-gradient(135deg, #ca3838ff 0%, #e54646ff 100%)",
                                      boxShadow:
                                        "0 15px 30px -5px rgba(202, 56, 56, 0.5)",
                                    },
                                    "&:disabled": {
                                      background: "#e2e8f0",
                                      color: "#94a3b8",
                                      boxShadow: "none",
                                    },
                                  }}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Activity
                    mode={selectedPurposes.length > 0 ? "visible" : "hidden"}
                  >
                    <Box mt={4}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        mb={2}
                        color="#334155"
                      >
                        Selected Purposes
                      </Typography>

                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {selectedPurposes.map((p) => (
                          <Chip
                            key={p._id}
                            label={p.type}
                            onDelete={() =>
                              setSelectedPurposes((prev) =>
                                prev.filter((x) => x._id !== p._id),
                              )
                            }
                            deleteIcon={<MdDelete />}
                            sx={{
                              fontSize: { xs: 11, sm: 13 },
                              fontWeight: 600,
                              bgcolor: "#f1f5f9",
                              color: "#1e293b",
                              "& .MuiChip-deleteIcon": {
                                color: "#ef4444",
                              },
                            }}
                          />
                        ))}
                      </Box>

                      <Divider sx={{ my: 3 }} />

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="contained"
                          fullWidth
                          size="large"
                          disabled={
                            !reportType || selectedPurposes.length === 0
                          }
                          onClick={() => generateReport()}
                          sx={{
                            background:
                              "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                            color: "white",
                            height: "50px",
                            borderRadius: "16px",
                            border: "none",
                            fontWeight: 800,
                            letterSpacing: "0.05em",
                            boxShadow:
                              "0 10px 25px -5px rgba(99, 102, 241, 0.4)",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              background:
                                "linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)",
                              boxShadow:
                                "0 15px 30px -5px rgba(99, 102, 241, 0.5)",
                            },
                            "&:disabled": {
                              background: "#e2e8f0",
                              color: "#94a3b8",
                              boxShadow: "none",
                            },
                          }}
                        >
                          GENERATE REPORT
                        </Button>
                      </motion.div>
                    </Box>
                  </Activity>
                </Activity>
              </Stack>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default Report;
