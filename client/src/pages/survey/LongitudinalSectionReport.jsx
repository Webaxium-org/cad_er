import WaterWayProposalNotice from "./components/WaterWayProposalNotice";
import { createSectionPdf } from "../../utils/sectionPdf";
import SectionScaleInputs from "./components/SectionScaleInputs";
import { profilePoints, profileLevel, chainageValue } from "../../utils/surveyGeometry";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { handleFormError } from "../../utils/handleFormError";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import { getSurvey } from "../../services/surveyServices";
import { Box, Stack, Typography, Paper } from "@mui/material";
import CrossSectionChart from "./components/CrossSectionChart";
import { v1ChartOptions, v2ChartOptions } from "../../constants";
import BasicMenu from "../../components/BasicMenu";
import { BsThreeDots } from "react-icons/bs";
import { MdDownload } from "react-icons/md";
import SmallHeader from "../../components/SmallHeader";

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

const menuItems = [
  // { label: "v1", value: "v1" },
  // { label: "v2", value: "v2" },
  {
    label: (
      <Stack direction={"row"} alignItems={"center"} gap={0.5}>
        PDF
        <MdDownload />
      </Stack>
    ),
    value: "download",
  },
];

const colors = {
  Initial: "green",
  Proposed: "blue",
  Final: "red",
};

const LongitudinalSectionReport = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const dispatch = useDispatch();

  const { state } = useLocation();

  const { global } = useSelector((state) => state.loading);

  const pdfRef = useRef();

  const [chartOptions, setChartOptions] = useState(v1ChartOptions);

  const [survey, setSurvey] = useState(null);

  const [tableData, setTableData] = useState([]);

  const [selectedCs, setSelectedCs] = useState(null);
  const [drawingScales, setDrawingScales] = useState({ horizontal: 2400, vertical: 300 });

  const downloadPDF = async () => {
    if (!selectedCs) return;
    try {
      createSectionPdf([selectedCs], drawingScales).save("longitudinal-section.pdf");
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    }
  };

  const handleMenuSelect = (item) => {
    if (item.value === "download") return downloadPDF();

    if (!selectedCs) return;

    // Compute bounds
    const minY = Math.min(...selectedCs.allRl);
    const maxY = Math.max(...selectedCs.allRl);

    // Padding - you can tweak the factor
    const pad = (maxY - minY) * 0.1;

    const minX = Math.min(...selectedCs.chainages);
    const maxX = Math.max(...selectedCs.chainages);

    const xaxis = {
      autorange: false,
      range: [minX, maxX], // No padding, start exactly at the first x
      tickformat: ".3f", // 3 decimals always
      dtick: (maxX - minX) / 4, // Generates: min → -2 → 0 → 2 → max
      zeroline: false,
      showline: false,
      mirror: true,
    };

    if (item.value === "v1") {
      setChartOptions((_) => ({
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
    }
    if (item.value === "v2") {
      setChartOptions((_) => ({
        ...v2ChartOptions,
        layout: {
          ...v2ChartOptions.layout,
          yaxis: {
            ...v2ChartOptions.layout.yaxis,
            zeroline: false,
            autorange: false,
            range: [minY - 2, maxY + pad],
          },

          xaxis: {
            ...v2ChartOptions.layout.xaxis,
            ...xaxis,
          },
        },
      }));
    }
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
      if (initial) data.push(initial);
    }

    data.sort(
      (a, b) => LEVEL_ORDER.indexOf(a.type) - LEVEL_ORDER.indexOf(b.type),
    );

    setTableData(data);
  };

  const getSafeChainage = (chainage) => {
    return chainageValue(chainage, survey.separator || "/");
  };

  const getColor = (type) => {
    if (type.includes("Initial")) return colors.Initial;
    if (type.includes("Proposed")) return colors.Proposed;
    return colors.Final;
  };

  const handleGenerateLs = () => {
    const initialEntry = tableData[0];
    if (!initialEntry?.rows?.length) return;

    const row = initialEntry.rows.filter(
      (r) => r.type === "Chainage" || r.type === "Break",
    );
    if (!row.length) return;

    const filteredRow = row.filter((r) => r.type === "Chainage").sort((a, b) => getSafeChainage(a.chainage) - getSafeChainage(b.chainage));

    const pls = Number(initialEntry.pls || 0);
    const safeChainages =
      filteredRow.map((r) => getSafeChainage(r.chainage)) || [];

    const breakBeforeChainages = new Set();
    let pendingBreak = false;
    row.forEach((r) => {
      if (r.type === "Break") pendingBreak = true;
      else if (r.type === "Chainage" && pendingBreak) {
        breakBeforeChainages.add(getSafeChainage(r.chainage)); pendingBreak = false;
      }
    });

    // Helper to extract numeric RL
    const getRlValue = (r) => r
      ? profileLevel(profilePoints(r.offsets, r.reducedLevels), pls)
      : null;

    // 1. Get clean numeric arrays for the data
    const initialLevels = filteredRow.map(getRlValue);

    // 2. Updated makeSeries: Injects a break WITHOUT corrupting math
    const makeSeries = (offsets, levels) => {
      const result = [];
      offsets.forEach((o, i) => {
        const yVal = levels[i];

        // BREAK LOGIC: Lift the pen after index 1
        if (breakBeforeChainages.has(o)) {
          result.push({ x: Number(Number(o).toFixed(3)), y: null });
        }

        // Add the actual point
        result.push({
          x: Number(Number(o).toFixed(3)),
          y: yVal !== null ? Number(yVal.toFixed(3)) : null,
        });
      });
      return result;
    };

    const data = {
      id,
      type: "ls",
      chainages: safeChainages,
      series: [],
      allRl: [], // We will only store NUMBERS here
    };

    // Add Initial Series
    data.series.push({
      name: initialEntry.type,
      color: getColor(initialEntry.type),
      connectgaps: false,
      data: makeSeries(safeChainages, initialLevels),
    });

    // Add initial levels to our math array (filter out nulls)
    data.allRl.push(...initialLevels.filter((v) => v !== null));

    // Add additional tables (Proposed, etc.)
    if (tableData.length > 1) {
      for (let i = 1; i < tableData.length; i++) {
        const table = tableData[i];
        const newRows = table?.rows?.filter((r) => r.type === "Chainage") || [];
        if (!newRows.length) continue;

        const proposalLevels = filteredRow.map((r) => getRlValue(newRows.find((p) => p.chainage === r.chainage)));
        data.allRl.push(...proposalLevels.filter((v) => v !== null));

        data.series.push({
          name: table.type,
          color: getColor(table.type),
          connectgaps: false,
          data: makeSeries(safeChainages, proposalLevels),
        });
      }
    }

    // 3. Robust Bounds Calculation
    const minY = data.allRl.length ? Math.min(...data.allRl) : 0;
    const maxY = data.allRl.length ? Math.max(...data.allRl) : 10;
    const pad = (maxY - minY) * 0.2 || 2;

    const minX = Math.min(...safeChainages);
    const maxX = Math.max(...safeChainages);

    setChartOptions((prev) => ({
      ...v1ChartOptions,
      layout: {
        ...v1ChartOptions.layout,
        yaxis: {
          ...v1ChartOptions.layout?.yaxis,
          autorange: false,
          range: [minY - 1, maxY + pad],
        },
        xaxis: {
          ...v1ChartOptions.layout?.xaxis,
          zeroline: false,
          showline: false,
          autorange: false,
          range: [minX, maxX],
          tickformat: ".3f",
        },
      },
    }));

    data.datum = Math.round(minY - 1);
    setSelectedCs(data);
  };

  const fetchSurvey = async () => {
    try {
      if (!global) dispatch(startLoading());
      const { data } = await getSurvey(id);

      if (data.success) {
        handleSetTableData(data.survey);

        setSurvey(data.survey);
      } else {
        throw Error("Failed to fetch survey");
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  useEffect(() => {
    fetchSurvey();
  }, []);

  useEffect(() => {
    if (tableData.length) {
      handleGenerateLs();
    }
  }, [tableData]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <SmallHeader />
      <Box sx={{ maxWidth: "1200px", margin: "0 auto", p: { xs: 2, md: 4 } }}>
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
              background: "linear-gradient(90deg, #4f46e5 0%, #0ea5e9 100%)",
            }}
          />

          <Stack
            direction={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
            spacing={2}
            mb={4}
          >
            <Typography
              variant="h6"
              fontSize={20}
              fontWeight={800}
              color="#1e293b"
            >
              LONGITUDINAL SECTION
            </Typography>
            <Box textAlign={"end"}>
              <BasicMenu
                label={<BsThreeDots />}
                items={menuItems}
                onSelect={handleMenuSelect}
                sx={{ minWidth: "fit-content", p: 1 }}
              />
            </Box>
          </Stack>
          <Box
            sx={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {selectedCs && selectedCs?.series?.length && (
              <>
              <WaterWayProposalNotice purposes={tableData} />
              <SectionScaleInputs scales={drawingScales} onChange={setDrawingScales} />
              <CrossSectionChart
              drawingScales={drawingScales}
                selectedCs={selectedCs}
                chartOptions={chartOptions}
                pdfRef={pdfRef}
              />
            </>
            )}

            {/* Footer */}
            <Typography
              variant="caption"
              sx={{ mt: 1, fontStyle: "italic", color: "text.secondary" }}
            >
              [Hor Scale – 1 in 150 : Ver Scale – 1 in 150]
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default LongitudinalSectionReport;
