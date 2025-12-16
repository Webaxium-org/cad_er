import { Activity, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import { handleFormError } from "../../utils/handleFormError";
import { getAllSurvey, getSurvey } from "../../services/surveyServices";

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
} from "@mui/material";

import { MdDelete } from "react-icons/md";
import BasicAutocomplete from "../../components/BasicAutocomplete";
import BasicButton from "../../components/BasicButton";

const toggleButtonSx = {
  flex: 1,
  fontSize: { xs: "0.75rem", sm: "0.9rem" },
  py: { xs: 0.7, sm: 1 },
  border: "2px solid #1976d2 !important",
  borderRadius: "10px !important",
  boxShadow:
    "0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12) !important",
  "&.Mui-selected": {
    backgroundColor: "#1976d2",
    color: "#fff",
  },
  "&.Mui-selected:hover": {
    backgroundColor: "#1565c0",
    fontWeight: "600",
  },
};

const Report = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { global } = useSelector((state) => state.loading);

  const [survey, setSurvey] = useState(null);

  const [surveys, setSurveys] = useState(null);

  const [inputValue, setInputValue] = useState("");

  const [selectedPurposes, setSelectedPurposes] = useState([]);

  const [reportType, setReportType] = useState(null);

  const handleInputChange = (e, newValue) => {
    const surveyId = newValue.value;

    setInputValue(newValue);
    setSurvey(surveys.find((s) => String(s._id) === String(surveyId)));
  };

  const fetchData = async () => {
    try {
      if (!global) dispatch(startLoading());
      const { data } = id ? await getSurvey(id) : await getAllSurvey();

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
        : [...prev, purpose]
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

    return link;
  };

  const generateReport = () => {
    try {
      if (
        (reportType === "area" || reportType === "volume") &&
        selectedPurposes.length > 2
      ) {
        throw Error(
          `Only two surveys can be selected for the ${reportType} report.`
        );
      }

      const link = getLink();
      const selectedIds = selectedPurposes.map((p) => p._id);

      navigate(link, { state: { selectedPurposeIds: selectedIds } });
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    }
  };

  return (
    <Box p={2} sx={{ maxWidth: 900, mx: "auto" }}>
      <Typography
        variant="h6"
        fontSize={18}
        fontWeight={700}
        align="center"
        mb={2}
      >
        Generate Survey Report
      </Typography>

      {/* Report Type Selector */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
        }}
      >
        {!id ? (
          <Box mb={2}>
            <BasicAutocomplete
              label={"Select Survey"}
              options={
                surveys?.length
                  ? surveys?.map((s) => ({ label: s.project, value: s._id }))
                  : []
              }
              value={inputValue}
              onChange={(e, newValue) => handleInputChange(e, newValue)}
              placeholder={"Select..."}
            />
          </Box>
        ) : (
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            sx={{ mb: 1, fontSize: { xs: "0.85rem", sm: "1rem" } }}
          >
            Project Name:{" "}
            <span style={{ fontWeight: "500" }}>{survey?.project}</span>
          </Typography>
        )}

        <Typography
          variant="subtitle1"
          fontWeight="bold"
          sx={{ mb: 1, fontSize: { xs: "0.85rem", sm: "1rem" } }}
        >
          Select Report Type
        </Typography>

        <ToggleButtonGroup
          value={reportType}
          exclusive
          fullWidth
          onChange={(e, value) => setReportType(value)}
          sx={{ display: "flex", gap: 2 }}
        >
          <ToggleButton value="cross" sx={toggleButtonSx}>
            CS
          </ToggleButton>
          <ToggleButton value="longitudinal" sx={toggleButtonSx}>
            LS
          </ToggleButton>
          <ToggleButton value="area" sx={toggleButtonSx}>
            Area Report
          </ToggleButton>
          <ToggleButton value="volume" sx={toggleButtonSx}>
            Volume Report
          </ToggleButton>
        </ToggleButtonGroup>

        <Box display={"flex"} justifyContent={"center"} mt={2}>
          <BasicButton value={"Deduction"} sx={{ minWidth: "250px" }} />
        </Box>
      </Paper>

      <Activity mode={reportType ? "visible" : "hidden"}>
        {/* Purpose Table */}
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, overflow: "hidden" }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {/* <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  checked={allSelected}
                  indeterminate={partiallySelected}
                  onChange={toggleSelectAll}
                />
              </TableCell> */}
                <TableCell></TableCell>

                <TableCell
                  sx={{ fontWeight: "bold", fontSize: { xs: 12, sm: 14 } }}
                >
                  Purpose
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold", fontSize: { xs: 12, sm: 14 } }}
                >
                  Description
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
                      ? "rgba(25,118,210,0.08)"
                      : "inherit",
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

                  <TableCell sx={{ fontSize: { xs: 12, sm: 14 } }}>
                    {purpose.description || "No description"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Selected Purposes */}
        <Activity mode={selectedPurposes.length > 0 ? "visible" : "hidden"}>
          <Paper
            elevation={2}
            sx={{
              mt: 4,
              p: 2,
              borderRadius: 3,
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              mb={1}
              sx={{ fontSize: { xs: "0.85rem", sm: "1rem" } }}
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
                      prev.filter((x) => x._id !== p._id)
                    )
                  }
                  deleteIcon={<MdDelete />}
                  sx={{
                    fontSize: { xs: 10, sm: 12 },
                    height: { xs: 24, sm: 28 },
                  }}
                />
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={!reportType || selectedPurposes.length === 0}
              onClick={generateReport}
              sx={{
                py: { xs: 1, sm: 1.5 },
                borderRadius: 2,
                fontSize: { xs: "0.75rem", sm: "0.9rem" },
              }}
            >
              Generate Report
            </Button>
          </Paper>
        </Activity>
      </Activity>
    </Box>
  );
};

export default Report;
