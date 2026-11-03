import { usePdfExports } from "../../utils/pdfExportContext";


import { calculatePlottingQuantityReport } from "../../utils/plottingQuantityReport.js";
import { reportDeductions } from "../../utils/surveyDeductions";
import { splitLongitudinalSections } from "../../utils/longitudinalPagination";
import { withSectionBandLabelMargin } from "../../utils/sectionLevelBands";
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import { getFieldBook, getSurvey } from "../../services/surveyServices";
import { handleFormError } from "../../utils/handleFormError";
import {
  Box,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { MdDownload, MdOutlineAssessment } from "react-icons/md";


import ExcelJS from "exceljs";
import BasicMenu from "../../components/BasicMenu";
import { BsThreeDots } from "react-icons/bs";
import FieldBookTable from "./components/FieldBookTable";
import { calculateTableData } from "./components/calculateTableData";
import CrossSectionChartV2 from "./components/CrossSectionChartV2";
import { v1ChartOptions } from "../../constants";
import CrossSectionChart from "./components/CrossSectionChart";


import { formatReportNumber } from "../../utils/reportNumber";


import SmallHeader from "../../components/SmallHeader";
import PageHeroHeader from "../../components/PageHeroHeader";

const LEVEL_ORDER = [
  "Initial Level",
  "Proposed Level",
  "Final Earth Work",
  "Proposed Earth Work",
  "Final Quarry Muck",
  "Proposed Quarry Muck",
  "Final GSB",
  "Proposed GSB",
  "Final WMM",
  "Proposed WMM",
  "Final BM",
  "Proposed BM",
  "Final BC",
  "Proposed BC",
  "Final Tile Top",
  "Proposed Tile Top",
  "Final Level",
];

const colors = {
  Initial: "green",
  Proposed: "blue",
  Final: "red",
};


const getColor = (type) => {
  if (type.includes("Initial")) return colors.Initial;
  if (type.includes("Proposed")) return colors.Proposed;
  return colors.Final;
};

const menuItems = [
  {
    label: (
      <Stack direction={"row"} alignItems={"center"} gap={0.5}>
        PDF
        <MdDownload />
      </Stack>
    ),
    value: "pdf download",
  },
];

const reportTableSx = {
  minWidth: 780,
  borderCollapse: "separate",
  borderSpacing: 0,
  "& .MuiTableCell-root": {
    px: 1.5,
    py: 1,
    borderBottom: "1px solid #e5eaf3",
    color: "#34436b",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  },
  "& .report-data-row:hover": { bgcolor: "#f5f6ff" },
  "& .report-data-row .MuiTableCell-root": { textAlign: "center" },
  "& .report-section-row .MuiTableCell-root": {
    bgcolor: "#eff0ff",
    color: "#211bb5",
    fontWeight: 800,
    borderTop: "10px solid white",
    borderBottom: 0,
    py: 1.05,
  },
  "& .report-total-row .MuiTableCell-root": {
    bgcolor: "#eff0ff",
    color: "#211bb5",
    fontWeight: 800,
    borderTop: "1px solid #d6ddf4",
    borderBottom: 0,
    py: 1.15,
  },
  "& .report-total-row .report-total-value": {
    bgcolor: "#dfdfff",
    textAlign: "right",
    fontWeight: 900,
  },
};

const reportHeadSx = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  "& .MuiTableCell-root": {
    bgcolor: "#f0f2fa",
    color: "#34436b",
    fontWeight: 800,
    fontSize: "0.78rem",
    borderBottom: "1px solid #dce2f0",
    borderRight: "1px solid #e4e8f2",
    textAlign: "center",
    whiteSpace: "normal",
  },
  "& tr:first-of-type .MuiTableCell-root[colspan]": {
    bgcolor: "#dedfff",
    color: "#211bb5",
  },
  "& tr:nth-of-type(2) .MuiTableCell-root": {
    bgcolor: "#f0f1ff",
    color: "#34436b",
    fontSize: "0.73rem",
  },
};

// Match the chart width used before the report card became full width.
// The PDF exporter captures .pdf-chart-item elements from the page.
const chartCaptureWidth = "calc(210mm - 32px)";

const initialDetails = {
  initialEntry: "",
  secondaryEntry: "",
};

const PlottingAndQuantityReport = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const reportDetails = useRef(initialDetails);


  const tableDataRef = useRef([]);

  const { state } = useLocation();

  const dispatch = useDispatch();

  const { global } = useSelector((state) => state.loading);

  const [survey, setSurvey] = useState([]);

  const [purpose, setPurpose] = useState(null);


  const [selectedLs, setSelectedLs] = useState(null);
  const lsPages = useMemo(() => selectedLs ? splitLongitudinalSections(selectedLs) : [], [selectedLs]);

  const [lsTableData, setLsTableData] = useState([]);

  const [csTableData, setCsTableData] = useState([]);

  const [chartOptions, setChartOptions] = useState(v1ChartOptions);


  const [allCs, setAllCs] = useState(null);
  const { startExport } = usePdfExports();

  const handleMenuSelect = async (item) => {
    if (item.value !== "pdf download") return;
    try {
      if (!tableData || !lsPages.length || !allCs?.length) throw new Error("Wait for the report graphs to finish loading.");
      await startExport(id, {
        tableData, reportDetails: reportDetails.current, surveyInfo: survey, showArea,
        lsPages, allCs, chartOptions,
        chartWidth: document.querySelector(".pdf-chart-item")?.getBoundingClientRect().width || 760,
      });
    } catch (error) { handleFormError(error, null, dispatch, navigate); }
  };

  const getSafeChainage = (chainage) => {
    return Number(chainage?.split(survey.separator || "/")[1]);
  };

  const buildCsData = (row) => {
    if (!row) return null;

    const initialEntry = csTableData[0];
    if (!initialEntry?.rows?.length) return null;

    const rawOffsets = row.offsets || [];
    const safeInitial = row.reducedLevels || [];

    const numericOffsets = rawOffsets.map(Number);
    const uniqueOffsets = [...new Set(numericOffsets)].sort((a, b) => a - b);

    const data = {
      id,
      type: "cs",
      offsets: [...uniqueOffsets], // Store as Numbers
      chainage: row.chainage,
      series: [],
      allRl: [],
    };

    const makeSeries = (offsets, levels) =>
      offsets.map((o, i) => {
        const valY = Number(levels?.[i] ?? 0);
        data.allRl.push(valY);
        return {
          x: Number(o), // NO .toFixed() here; keep as Number
          y: valY,
        };
      });

    data.series.push({
      _id: row._id,
      purpose: initialEntry._id,
      name: initialEntry.type,
      color: getColor(initialEntry.type),
      data: makeSeries(rawOffsets, safeInitial),
    });

    if (csTableData.length > 1) {
      for (let i = 1; i < csTableData.length; i++) {
        const table = csTableData[i];
        const newRow = table?.rows?.find((r) => r.chainage === row.chainage);
        if (!newRow) continue;

        const rawProposalOffsets = newRow.offsets || [];
        const safeProposalLevels = newRow.reducedLevels || [];

        rawProposalOffsets.forEach((o) => {
          const num = Number(o);
          if (!data.offsets.includes(num)) data.offsets.push(num);
        });

        data.series.push({
          _id: newRow._id,
          purpose: table._id,
          name: table.type,
          color: getColor(table.type),
          data: makeSeries(rawProposalOffsets, safeProposalLevels),
        });
      }
    }

    data.offsets.sort((a, b) => a - b);

    const minY = Math.min(...data.allRl);
    const maxY = Math.max(...data.allRl);
    const minX = Math.min(...data.offsets);
    const maxX = Math.max(...data.offsets);

    const padY = (maxY - minY) * 0.1;

    const xaxis = {
      autorange: false,
      range: [minX, maxX], // Snap range exactly to data bounds
      tickformat: ".3f",
      dtick: maxX - minX <= 10 ? 1 : 2, // Clean integer intervals
      zeroline: false,
      showline: false,
      mirror: true,
      padding: 0,
      constrain: "domain",
    };

    data.specificOptions = {
      ...v1ChartOptions,
      config: {
        ...v1ChartOptions.config,
        displayModeBar: false,
      },
      layout: {
        ...v1ChartOptions.layout,
        margin: { t: 40, r: 30, l: 50, b: 40 }, // Ensure enough space for labels
        yaxis: {
          zeroline: false,
          autorange: false,
          range: [Math.floor(minY) - 1, maxY + padY],
        },
        xaxis,
      },
    };

    data.datum = Math.floor(minY) - 1;
    return data;
  };

  const handleDownloadAllChainage = async () => {
    try {
      const initialEntry = csTableData[0];
      if (!initialEntry?.rows?.length) return;

      const allFormattedData = initialEntry.rows
        ?.filter((row) => row.type === "Chainage")
        .map((row) => buildCsData(row))
        .filter(Boolean);

      setAllCs(allFormattedData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateLs = () => {
    const initialEntry = lsTableData[0];
    if (!initialEntry?.rows?.length) return;

    const row = initialEntry.rows.filter((row) => row.type === "Chainage");
    if (!row.length) return;

    const pls = Number(initialEntry.pls || 0);
    const safeChainages = row.map((r) => getSafeChainage(r.chainage)) || [];
    const safeInitial = row.map((r) => {
      const offsetPointIndex = r.offsets?.findIndex((o) => Number(o) === pls);

      const safeOffsetPointIndex =
        offsetPointIndex === -1
          ? Math.round(r.offsets.length / 2)
          : offsetPointIndex;

      return r.reducedLevels[safeOffsetPointIndex];
    });

    const data = {
      id,
      type: "ls",
      datum: 9.4,
      chainages: safeChainages,
      series: [],
      allRl: [],
    };

    const makeSeries = (offsets, levels) =>
      offsets.map((o, i) => ({
        x: Number(Number(o).toFixed(3)), // NUMERIC X (IMPORTANT)
        y: Number(Number(levels?.[i] ?? 0).toFixed(3)),
      }));

    // Add the Initial Entry at the end
    data.series.push({
      name: initialEntry.type,
      color: getColor(initialEntry.type),
      data: makeSeries(safeChainages, safeInitial),
    });

    // Add all additional tableData (Proposed, Level 2, etc.)
    if (lsTableData.length > 1) {
      for (let i = 1; i < lsTableData.length; i++) {
        const table = lsTableData[i];

        const newRow = table?.rows?.filter((r) => r.type === "Chainage") || [];
        if (!newRow.length) continue;

        const safeProposal = newRow.map((r) => {
          const offsetPointIndex = r.offsets?.findIndex(
            (o) => Number(o) === pls,
          );
          const safeOffsetPointIndex =
            offsetPointIndex === -1
              ? Math.round(r.offsets.length / 2)
              : offsetPointIndex;

          return r.reducedLevels[safeOffsetPointIndex];
        });

        data.allRl.push(...safeProposal);

        data.series.push({
          name: table.type,
          color: getColor(table.type),
          data: makeSeries(safeChainages, safeProposal),
        });
      }
    }

    data.allRl.push(...safeInitial);

    // Compute bounds
    const minY = Math.min(...data.allRl);
    const maxY = Math.max(...data.allRl);

    const pad = (maxY - minY) * 0.1;

    const minX = Math.min(...data.chainages);
    const maxX = Math.max(...data.chainages);

    const xaxis = {
      autorange: false,
      range: [minX, maxX],
      tickformat: ".3f",
      dtick: (maxX - minX) / 4,
      zeroline: false,
      showline: false,
      mirror: true,
    };

    setChartOptions(() => ({
      ...v1ChartOptions,
      layout: {
        ...v1ChartOptions.layout,
        yaxis: {
          zeroline: false,
          autorange: false,
          range: [minY - 2, maxY + pad],
        },

        xaxis,
      },
    }));

    data.datum = Math.round(minY - 2);
    setSelectedLs(data);
  };

  const handleSetTableData = (survey) => {
    let data = [];

    if (state && state?.selectedPurposeIds?.length) {
      state.selectedPurposeIds.forEach((entry) => {
        const purpose = survey?.purposes?.find(
          (p) => String(p._id) === String(entry),
        );

        if (purpose) data.push(purpose);
      });
    } else {
      const initial = survey?.purposes?.find((p) => p.type === "Initial Level");
      const proposal = survey?.purposes?.find(
        (p) => p.type === "Proposed Level",
      );
      if (initial) data.push(initial);
      if (proposal) data.push(proposal);
    }

    data.sort(
      (a, b) => LEVEL_ORDER.indexOf(a.type) - LEVEL_ORDER.indexOf(b.type),
    );

    setCsTableData(data);
    setLsTableData(data);
  };

  const fetchSurvey = async () => {
    try {
      if (!global) {
        dispatch(startLoading());
      }

      const { data } = await getSurvey(id);

      const level = data.survey?.purposes?.find(
        (p) => p.type === "Initial Level",
      );

      const response = await getFieldBook(level._id);

      setSurvey(data?.survey || []);
      setPurpose(response?.data?.survey);
      handleSetTableData(data.survey);
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  const shortType = (type) => {
    if (!type) return type;
    return type.replace(/^Proposed\s+/i, "Prop. ");
  };

  const tableData = useMemo(() => {
    let initialEntry = null;
    let secondaryEntry = null;
    const deductions = reportDeductions(survey, state?.deductionId);

    if (state && state?.selectedPurposeIds?.length) {
      initialEntry = survey?.purposes?.find(
        (p) => String(p._id) === String(state.selectedPurposeIds[0]),
      );
      secondaryEntry = survey?.purposes?.find(
        (p) => String(p._id) === String(state.selectedPurposeIds[1]),
      );
    } else {
      initialEntry = survey?.purposes?.find((p) => p.type === "Initial Level");
      secondaryEntry = survey?.purposes?.find(
        (p) => p.type === "Proposed Level",
      );
    }

    if (!survey || !initialEntry || !secondaryEntry) return null;

    if (LEVEL_ORDER.indexOf(initialEntry.type) > LEVEL_ORDER.indexOf(secondaryEntry.type)) {
      [initialEntry, secondaryEntry] = [secondaryEntry, initialEntry];
    }

    reportDetails.current = {
      initialEntry: shortType(initialEntry.type),
      secondaryEntry: shortType(secondaryEntry.type),
    };

    return calculatePlottingQuantityReport(survey, initialEntry, secondaryEntry, deductions);
  }, [survey, state]);

  const showArea = useMemo(() => ({
    cutting: Boolean(tableData?.areaReport?.some((section) => Number(section.totalCuttingAreaSqMtr) > 0)),
    filling: Boolean(tableData?.areaReport?.some((section) => Number(section.totalFillingAreaSqMtr) > 0)),
  }), [tableData]);

  const fieldBookData = useMemo(() => {
    if (!purpose) return [];
    return calculateTableData(purpose);
  }, [purpose]);

  useEffect(() => {
    tableDataRef.current = tableData;
  }, [tableData]);

  useEffect(() => {
    if (csTableData.length) {
      handleDownloadAllChainage();
    }
  }, [csTableData]);

  useEffect(() => {
    if (lsTableData.length) {
      handleGenerateLs();
    }
  }, [lsTableData]);

  useEffect(() => {
    fetchSurvey();
  }, []);

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 8 }}>
    <SmallHeader />
    <PageHeroHeader
      icon={MdOutlineAssessment}
      title="Plotting and Quantity Report"
      subtitle="Review field readings, quantities, sections, and plots."
      action={
        <BasicMenu
          label={<BsThreeDots />}
          items={menuItems}
          onSelect={handleMenuSelect}
          sx={{
            width: 44,
            height: 44,
            minWidth: 44,
            p: 1,
            color: "white",
            borderColor: "rgba(255, 255, 255, 0.45)",
            bgcolor: "rgba(255, 255, 255, 0.16)",
            "&:hover": { bgcolor: "rgba(255, 255, 255, 0.26)", borderColor: "white" },
          }}
        />
      }
    />
    <Box sx={{ px: 0.875, py: 2, mx: 1, mt: -8, position: "relative", bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: "20px", background: "linear-gradient(to right, #6366f1 0 6px, #ffffff 6px)" }}>

      {/* Premium Official Field Book Header Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 4 },
          mb: 4,
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          fontFamily: "'Outfit', 'Inter', sans-serif",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
          "@media print": {
            border: "none",
            boxShadow: "none",
            p: 0,
            mb: 2,
          },
        }}
      >
        {/* Centered Layer Name */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: reportDetails?.current?.initialEntry?.toLowerCase().includes("initial") ? "green" : "red",
              fontSize: { xs: "1.2rem", sm: "1.5rem" },
              mb: 1,
              textTransform: "uppercase",
            }}
          >
            {reportDetails?.current?.initialEntry || "INITIAL LEVEL"} - PROFILE, SECTIONS & QUANTITY
          </Typography>

          {survey?.projectType !== "None" && <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: "#334155",
              fontSize: { xs: "1rem", sm: "1.1rem" },
              mb: 3,
              textTransform: "uppercase",
            }}
          >
            {survey?.projectType !== "Private" && survey?.projectType !== "private"
              ? (survey?.department || "IRRIGATION DEPARTMENT")
              : (survey?.client || "CLIENT DETAILS")}
          </Typography>}
        </Box>

        {/* Instrument Details */}
        {survey?.projectType !== "None" && <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#475569" }}>
              INSTRUMENT MODEL: <span style={{ fontWeight: 400, color: "#334155" }}>{survey?.instrumentModel || survey?.instrumentNo || "—"}</span>
            </Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: "right" }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#475569" }}>
              SERIAL NO: <span style={{ fontWeight: 400, color: "#334155" }}>{survey?.serialNo || "122240174"}</span>
            </Typography>
          </Grid>
        </Grid>}

        {/* Name of Work */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#1e293b",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              textTransform: "uppercase",
            }}
          >
            {survey?.project || "NAME OF WORK"}
          </Typography>
        </Box>

        {/* LF Book & Agreement No */}
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#475569" }}>LF Book Registered No:</Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Typography variant="body2" sx={{ color: "#334155" }}>__________________________________________________</Typography>
            </Grid>
          </Grid>
          {survey?.projectType !== "None" && <Grid container alignItems="center" spacing={1}>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#475569" }}>Agreement No:</Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Typography variant="body2" sx={{ color: "#334155" }}>{survey?.agreementNo || "__________________________________________________"}</Typography>
            </Grid>
          </Grid>}
        </Stack>

        {/* Client Management / Hierarchy */}
        {survey?.projectType !== "None" && <Stack spacing={2} sx={{ mb: 5 }}>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs={12} sm={3}><Typography variant="body2" sx={{ fontWeight: 700, color: "#475569" }}>Division:</Typography></Grid>
            <Grid item xs={12} sm={9}><Typography variant="body2" sx={{ color: "#334155" }}>{survey?.division || "________________________________"}</Typography></Grid>
          </Grid>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs={12} sm={3}><Typography variant="body2" sx={{ fontWeight: 700, color: "#475569" }}>Sub-Division:</Typography></Grid>
            <Grid item xs={12} sm={9}><Typography variant="body2" sx={{ color: "#334155" }}>{survey?.subDivision || "________________________________"}</Typography></Grid>
          </Grid>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs={12} sm={3}><Typography variant="body2" sx={{ fontWeight: 700, color: "#475569" }}>Section:</Typography></Grid>
            <Grid item xs={12} sm={9}><Typography variant="body2" sx={{ color: "#334155" }}>{survey?.section || "________________________________"}</Typography></Grid>
          </Grid>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs={12} sm={3}><Typography variant="body2" sx={{ fontWeight: 700, color: "#475569" }}>Contractor:</Typography></Grid>
            <Grid item xs={12} sm={9}><Typography variant="body2" sx={{ color: "#334155" }}>{survey?.contractor || "________________________________"}</Typography></Grid>
          </Grid>
        </Stack>}

        {/* QUANTITY STATEMENT / ABSTRACT Table */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b", textAlign: "center", mb: 2 }}>
            QUANTITY STATEMENT / ABSTRACT
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "12px" }}>
            <Table size="small" sx={{ "& .MuiTableCell-root": { px: 1.5, py: 1.25, color: "#34436b", borderBottom: "1px solid #e5eaf3" } }}>
              <TableHead sx={{ "& .MuiTableCell-root": { bgcolor: "#f0f2fa", color: "#34436b", fontWeight: 800 } }}>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>SL. No.</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Page No.</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Layers / Profiles</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Quantity / QTY</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Units</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell align="center">1</TableCell>
                  <TableCell align="center"></TableCell>
                  <TableCell align="center">{reportDetails?.current?.initialEntry || "INITIAL LEVEL"}</TableCell>
                  <TableCell align="center">
                    {(() => {
                      const cut = Number(tableData?.totalCuttingVolume || 0);
                      const fill = Number(tableData?.totalFillingVolume || 0);
                      if (cut > 0 && fill > 0) return `Cut: ${cut.toFixed(3)}, Fill: ${fill.toFixed(3)}`;
                      if (cut > 0) return `${cut.toFixed(3)}`;
                      if (fill > 0) return `${fill.toFixed(3)}`;
                      return "0.000";
                    })()}
                  </TableCell>
                  <TableCell align="center">Cubic Meters</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Signatory Box */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 6, pt: 4 }}>
          <Stack spacing={0.5} sx={{ textAlign: "center" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155" }}>
              Assistant Engineer
            </Typography>
          </Stack>
          <Stack spacing={0.5} sx={{ textAlign: "center" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155" }}>
              Assistant Executive Engineer
            </Typography>
          </Stack>
          <Stack spacing={0.5} sx={{ textAlign: "center" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155" }}>
              Executive Engineer
            </Typography>
          </Stack>
        </Box>
      </Paper>

      <Typography
        variant="h6"
        sx={{ mt: 4, mb: 2, px: 2, py: 2, bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: "16px", color: "#1e293b", fontWeight: 800 }}
      >
        Field Book {reportDetails.current.initialEntry}
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 2, border: "1px solid #e2e8f0", borderRadius: "16px", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)" }}>
        <FieldBookTable
          tableData={fieldBookData}
          isEditing={false}
          onFieldChange={() => {}}
          onRLChange={() => {}}
          themed
        />
      </TableContainer>

      <Typography
        variant="h6"
        sx={{ mt: 4, mb: 2, px: 2, py: 2, bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: "16px", color: "#1e293b", fontWeight: 800 }}
      >
        Volume Report {reportDetails.current.initialEntry} and{" "}
        {reportDetails.current.secondaryEntry}
      </Typography>

      <TableContainer component={Paper} sx={{ maxHeight: "min(75vh, 760px)", border: "1px solid #e2e8f0", borderRadius: "16px", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)" }}>
        <Table sx={{ ...reportTableSx, minWidth: showArea?.cutting && showArea?.filling ? 1250 : 860 }} size="small">
          <TableHead sx={reportHeadSx}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                No.
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Section from
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Previous section
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Difference (m)
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Width (m)
              </TableCell>

              {showArea?.cutting && (
                <TableCell sx={{ fontWeight: 700 }} colSpan={4} align="center">
                  Cutting volume
                </TableCell>
              )}

              {showArea?.filling && (
                <TableCell sx={{ fontWeight: 700 }} colSpan={4} align="center">
                  Filling volume
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              {showArea?.cutting && (
                <>
                  <TableCell sx={{ fontWeight: 700 }}>Area (m²)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Previous area (m²)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Average (m²)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Volume (m³)
                  </TableCell>
                </>
              )}

              {showArea?.filling && (
                <>
                  <TableCell sx={{ fontWeight: 700 }}>Area (m²)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Previous area (m²)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Average (m²)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Volume (m³)
                  </TableCell>
                </>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {tableData?.rows?.map((row, index) => (
              <React.Fragment key={index}>
                {row.isDeductionRow && (
                  <TableRow className="report-section-row">
                    <TableCell colSpan={5 + (showArea?.cutting ? 4 : 0) + (showArea?.filling ? 4 : 0)}>{row.deductionMessage}</TableCell>
                  </TableRow>
                )}
                {row.isBreak && (
                  <TableRow className="report-section-row">
                    <TableCell colSpan={5 + (showArea?.cutting ? 4 : 0) + (showArea?.filling ? 4 : 0)}>{row.message}</TableCell>
                  </TableRow>
                )}

                <TableRow className="report-data-row">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.section}</TableCell>
                  <TableCell>{row.prevSection}</TableCell>
                  <TableCell>{row.difference}</TableCell>
                  <TableCell>{row.width}</TableCell>
                  {showArea?.cutting && (
                    <>
                      <TableCell>{row.cuttingAreaSqMtr}</TableCell>
                      <TableCell>{row.cuttingPrevArea}</TableCell>
                      <TableCell>{row.cuttingAvgSqrMtr}</TableCell>
                      <TableCell>{row.cuttingVolumeCubicMtr}</TableCell>
                    </>
                  )}
                  {showArea?.filling && (
                    <>
                      <TableCell>{row.fillingAreaSqMtr}</TableCell>
                      <TableCell>{row.fillingPrevArea}</TableCell>
                      <TableCell>{row.fillingAvgSqrMtr}</TableCell>
                      <TableCell>{row.fillingVolumeCubicMtr}</TableCell>
                    </>
                  )}
                </TableRow>
              </React.Fragment>
            ))}

            <TableRow className="report-total-row">
              <TableCell colSpan={showArea?.cutting ? 8 : 5}>Total volume</TableCell>

              {showArea?.cutting && (
                <>
                  <TableCell className="report-total-value">
                    {Number(tableData?.totalCuttingVolume)?.toFixed(3)}
                  </TableCell>
                </>
              )}

              {showArea?.filling && (
                <>
                  <TableCell colSpan={3}></TableCell>

                  <TableCell className="report-total-value">
                    {Number(tableData?.totalFillingVolume)?.toFixed(3)}
                  </TableCell>
                </>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box id="area-report" mt={4}>
        <Typography
          variant="h6"
          sx={{ mb: 2, px: 2, py: 2, bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: "16px", color: "#1e293b", fontWeight: 800 }}
        >
          Area Report Between {reportDetails.current.initialEntry} and{" "}
          {reportDetails.current.secondaryEntry}
        </Typography>

        {tableData?.areaReport?.length > 0 ? (
          <TableContainer component={Paper} sx={{ maxHeight: "min(75vh, 760px)", border: "1px solid #e2e8f0", borderRadius: "16px", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)" }}>
            <Table sx={{ ...reportTableSx, minWidth: showArea?.cutting && showArea?.filling ? 1180 : 800 }} size="small">
              <TableHead sx={reportHeadSx}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                    No.
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                    Distance (m)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                    {reportDetails?.current?.initialEntry || "Initial level"} (m)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                    {reportDetails?.current?.secondaryEntry || "Proposed level"} (m)
                  </TableCell>
                  {showArea?.cutting && (
                    <TableCell
                      sx={{ fontWeight: 700 }}
                      colSpan={4}
                      align="center"
                    >
                      Cutting area
                    </TableCell>
                  )}
                  {showArea?.filling && (
                    <TableCell
                      sx={{ fontWeight: 700 }}
                      colSpan={4}
                      align="center"
                    >
                      Filling area
                    </TableCell>
                  )}
                </TableRow>
                <TableRow>
                  {showArea?.cutting && (
                    <>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Cut depth (m)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Average (m)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Width (m)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Area (m²)
                      </TableCell>
                    </>
                  )}

                  {showArea?.filling && (
                    <>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Fill depth (m)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Average (m)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Width (m)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Area (m²)
                      </TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {tableData?.areaReport.map((row, index) => (
                  <Fragment key={index}>
                    {row.type === "Break" ? (
                      <TableRow className="report-section-row">
                        <TableCell colSpan={4 + (showArea?.cutting ? 4 : 0) + (showArea?.filling ? 4 : 0)}>{row.message}</TableCell>
                      </TableRow>
                    ) : (
                    <>
                    <TableRow className="report-section-row">
                      <TableCell colSpan={4 + (showArea?.cutting ? 4 : 0) + (showArea?.filling ? 4 : 0)}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>Section {row.section}</Box>
                          <Typography variant="caption" sx={{ color: "#687594", fontWeight: 500 }}>
                            {row?.data?.length || 0} measurements
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {row?.data?.map((entry, idx) => (
                      <TableRow className="report-data-row" key={`${index}-${idx}`}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{formatReportNumber(entry.offset)}</TableCell>
                        <TableCell>{formatReportNumber(entry.initialEntryRL)}</TableCell>
                        <TableCell>{formatReportNumber(entry.secondaryEntryRL)}</TableCell>

                        {showArea?.cutting && (
                          <>
                            <TableCell>{formatReportNumber(entry.cuttingMtr)}</TableCell>
                            <TableCell>{formatReportNumber(entry.cuttingAvgMtr)}</TableCell>
                            <TableCell>{formatReportNumber(entry.cuttingWMtr)}</TableCell>
                            <TableCell>{formatReportNumber(entry.cuttingAreaSqMtr)}</TableCell>
                          </>
                        )}

                        {showArea?.filling && (
                          <>
                            <TableCell>{formatReportNumber(entry.fillingMtr)}</TableCell>
                            <TableCell>{formatReportNumber(entry.fillingAvgMtr)}</TableCell>
                            <TableCell>{formatReportNumber(entry.fillingWMtr)}</TableCell>
                            <TableCell>{formatReportNumber(entry.fillingAreaSqMtr)}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}

                    <TableRow className="report-total-row">
                      <TableCell colSpan={showArea?.cutting ? 7 : 4}>Section total</TableCell>
                      {showArea?.cutting && (
                        <>
                          <TableCell className="report-total-value">
                            {Number(row?.totalCuttingAreaSqMtr)?.toFixed(3)}
                          </TableCell>
                        </>
                      )}
                      {showArea?.filling && (
                        <>
                          <TableCell colSpan={3}></TableCell>
                          <TableCell className="report-total-value">
                            {Number(row?.totalFillingAreaSqMtr)?.toFixed(3)}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                    </>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>Loading ...</Typography>
        )}
      </Box>

      <Box
        sx={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: chartCaptureWidth,
          mx: "auto",
        }}
        mt={2}
      >
        <Typography fontSize="12px" textAlign={"center"} mb={2}>
          L.S
        </Typography>
        {lsPages.map((page, index) => (
          <Box key={`${page.start}-${page.end}`} className="pdf-chart-item" sx={{ width: "100%", mb: 2 }}>
            {lsPages.length > 1 && <Typography fontSize="12px" textAlign="center" sx={{ mb: 1 }}>L.S · Chainage {page.start.toFixed(3)} – {page.end.toFixed(3)} · Part {index + 1} of {lsPages.length}</Typography>}
            <CrossSectionChart
              showLevelBands
              selectedCs={page.section}
              chartOptions={withSectionBandLabelMargin({ ...chartOptions, layout: { ...chartOptions.layout, xaxis: { ...chartOptions.layout.xaxis, autorange: false, range: page.range, dtick: undefined, nticks: 8 } } }, page.section)}
              drawingScales={{ horizontal: 2400, vertical: 300 }}
            />
          </Box>
        ))}

        {/* Footer */}
        <Typography
          variant="caption"
          sx={{ mt: 1, fontStyle: "italic", color: "text.secondary" }}
        >
          [Hor Scale – 1 in 150 : Ver Scale – 1 in 150]
        </Typography>
      </Box>

      <Box
        sx={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          minWidth: 0,
          maxWidth: chartCaptureWidth,
          mx: "auto",
        }}
        mt={2}
      >
        {allCs?.length > 0 &&
          allCs.map((cs, key) => (
            <Box key={key} className="pdf-chart-item" sx={{ mb: 4, width: "100%", maxWidth: "100%", minWidth: 0 }}>
              <CrossSectionChartV2
                showLevelBands
                selectedCs={cs}
                chartOptions={withSectionBandLabelMargin(cs.specificOptions || chartOptions, cs)}
              />
            </Box>
          ))}
      </Box>
    </Box>
    </Box>
  );
};

export default PlottingAndQuantityReport;
