import WaterWayProposalNotice from "./components/WaterWayProposalNotice";
import SectionScaleInputs from "./components/SectionScaleInputs";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { handleFormError } from "../../utils/handleFormError";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import { getSurvey, updateReducedLevels } from "../../services/surveyServices";
import {
  Box,
  Collapse,
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
import CrossSectionChart from "./components/CrossSectionChart";
import { v1ChartOptions, v2ChartOptions } from "../../constants";
import { BsThreeDots } from "react-icons/bs";
import BasicMenu from "../../components/BasicMenu";
import BasicInput from "../../components/BasicInput";
import BasicButton from "../../components/BasicButton";
import { MdArrowBackIosNew, MdDownload } from "react-icons/md";
import { showAlert } from "../../redux/alertSlice";
import { DxfWriter, Units, point2d, point3d } from "@tarikjabiri/dxf";
import { saveAs } from "file-saver";
import Plotly from "plotly.js/dist/plotly";
import { addGraphPage, capturePlotImage, createGraphPdf } from "../../utils/graphPdf";
import ExportLoader from "../../components/ExportLoader";
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
  {
    label: (
      <Stack direction={"row"} alignItems={"center"} gap={0.5}>
        All Chainage Report
        <MdDownload />
      </Stack>
    ),
    value: "downloadAllChainage",
  },
  {
    label: (
      <Stack direction={"row"} alignItems={"center"} gap={0.5}>
        Export to DXF
        <MdDownload />
      </Stack>
    ),
    value: "exportToDXF",
  },
];

const colors = {
  Initial: "green",
  Proposed: "blue",
  Final: "red",
};

const shortLabel = (name) => {
  if (!name) return name;
  return name
    .replace("Initial Level", "INITIAL RL")
    .replace("Proposed Level", "PL")
    .replace("Final Earth Work", "FL EW")
    .replace("Proposed Earth Work", "PL EW")
    .replace("Final Quarry Muck", "FL QM")
    .replace("Proposed Quarry Muck", "PL QM")
    .replace("Final GSB", "FL GSB")
    .replace("Proposed GSB", "PL GSB")
    .replace("Final WMM", "FL WMM")
    .replace("Proposed WMM", "PL WMM")
    .replace("Final BM", "FL BM")
    .replace("Proposed BM", "PL BM")
    .replace("Final BC", "FL BC")
    .replace("Proposed BC", "PL BC")
    .replace("Final Tile Top", "FL TILE")
    .replace("Proposed Tile Top", "PL TILE")
    .replace("Final Level", "FL");
};

const inputColors = {
  green: { borderColor: "#00800081", color: "#008000" },
  blue: { borderColor: "#0000ff8a", color: "#0000FF" },
  red: { borderColor: "#ff000085", color: "#FF0000" },
};

const scaledRange = (range, scale) => {
  const start = Number(range?.[0]);
  const end = Number(range?.[1]);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return range;
  const center = (start + end) / 2;
  const halfSpan = Math.max(Math.abs(end - start), 0.001) * Number(scale) / 150 / 2;
  return [center - halfSpan, center + halfSpan];
};

const CrossSectionReport = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const dispatch = useDispatch();

  const { state } = useLocation();

  const { global } = useSelector((state) => state.loading);

  const pdfRef = useRef();

  const [chartOptions, setChartOptions] = useState(null);

  const [survey, setSurvey] = useState([]);

  const [maxValue, setMaxValue] = useState("");

  const [tableData, setTableData] = useState([]);

  const [selectedCs, setSelectedCs] = useState(null);
  const [drawingScales, setDrawingScales] = useState({
    horizontal: 150,
    vertical: 150,
  });

  const [openRowId, setOpenRowId] = useState(null);

  const [selectedMenu, setSelectedMenu] = useState("v1");

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);

  const interactiveChartOptions = useMemo(() => {
    if (!chartOptions) return null;

    return {
      ...chartOptions,
      config: {
        ...chartOptions.config,
        displayModeBar: true,
        scrollZoom: true,
        doubleClick: "reset",
        modeBarButtonsToRemove: [
          "select2d",
          "lasso2d",
          "toggleSpikelines",
          "toImage",
        ],
      },
      layout: {
        ...chartOptions.layout,
        dragmode: "pan",
      },
    };
  }, [chartOptions]);

  const handleToggle = (rowId) => {
    setOpenRowId((prev) => (prev === rowId ? null : rowId));
  };

  const downloadPDF = async () => {
    if (!selectedCs) return;
    try {
      const plot = pdfRef.current?.querySelector(".js-plotly-plot");
      const { image, width, height } = await capturePlotImage(plot);
      const pdf = createGraphPdf();
      addGraphPage(pdf, image, selectedCs, drawingScales, width, height);

      pdf.save("cross-section.pdf");
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    }
  };

  const exportToDXF = () => {
    try {
      if (!selectedCs?.series?.length) {
        throw new Error("No cross-section data is available to export");
      }

      const dxf = new DxfWriter();
      dxf.setUnits(Units.Meters);
      let exportedSeries = 0;

      const allXValues = selectedCs.series
        .flatMap((series) => series.data || [])
        .map((point) => Number(point.x))
        .filter(Number.isFinite);
      const xSpan = allXValues.length
        ? Math.max(...allXValues) - Math.min(...allXValues)
        : 1;
      const textHeight = Math.max(0.1, Math.min(xSpan / 25, 0.3));

      selectedCs.series.forEach((series, index) => {
        const validPoints = (series.data || [])
          .map((point) => ({ x: Number(point.x), y: Number(point.y) }))
          .filter(
            (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
          );
        const vertices = validPoints.map((point) => ({
          point: point2d(point.x, point.y),
        }));

        if (vertices.length < 2) return;

        const layerName =
          series.name?.replace(/[<>/\\":;?*|=,]/g, "_").trim() ||
          `Series_${index + 1}`;
        const readingsLayerName = `${layerName}_Readings`;
        const colorNumber = (index % 7) + 1;

        dxf.addLayer(layerName, colorNumber);
        dxf.addLayer(readingsLayerName, colorNumber);
        dxf.addLWPolyline(vertices, { layerName });

        validPoints.forEach((point) => {
          dxf.addText(
            point3d(point.x + textHeight * 0.15, point.y + textHeight * 0.35),
            textHeight,
            point.y.toFixed(3),
            { layerName: readingsLayerName },
          );
        });

        exportedSeries += 1;
      });

      if (!exportedSeries) {
        throw new Error(
          "The cross-section does not contain enough valid points",
        );
      }

      const chainage = String(selectedCs.chainage || "cross-section").replace(
        /[^a-zA-Z0-9_-]+/g,
        "-",
      );
      const blob = new Blob([dxf.stringify()], {
        type: "application/dxf;charset=utf-8",
      });

      saveAs(blob, `cross-section-${chainage}.dxf`);
    } catch (error) {
      dispatch(
        showAlert({
          type: "error",
          message: error.message || "Failed to export the cross-section",
        }),
      );
    }
  };

  const buildCsData = (row) => {
    if (!row) return null;

    const initialEntry = tableData[0];
    if (!initialEntry?.rows?.length) return null;

    const rawOffsets = row.offsets || [];
    const safeInitial = row.reducedLevels || [];

    const uniqueOffsets = [...new Set(rawOffsets.map((n) => Number(n)))]
      .sort((a, b) => a - b)
      .map((n) => Number(n).toFixed(6));

    const data = {
      id: row._id,
      type: "cs",
      offsets: [...uniqueOffsets],
      chainage: row.chainage,
      series: [],
      allRl: [],
    };

    const makeSeries = (offsets, levels) =>
      offsets.map((o, i) => {
        const level = levels?.[i];
        const y =
          level !== null &&
          level !== undefined &&
          level !== "" &&
          Number.isFinite(Number(level))
            ? Number(level).toFixed(3)
            : null;
        if (y !== null) data.allRl.push(Number(y));

        return {
          x: Number(o).toFixed(6),
          y,
        };
      });

    // Initial table
    data.series.push({
      _id: row._id,
      purpose: initialEntry._id,
      name: initialEntry.type,
      color: getColor(initialEntry.type),
      data: makeSeries(rawOffsets, safeInitial),
    });

    // Additional tables
    if (tableData.length > 1) {
      for (let i = 1; i < tableData.length; i++) {
        const table = tableData[i];

        const newRow = table?.rows?.find((r) => r.chainage === row.chainage);
        if (!newRow) continue;

        const rawProposalOffsets = newRow.offsets || [];
        const safeProposalLevels = newRow.reducedLevels || [];

        rawProposalOffsets.forEach((o) => {
          const num = Number(o).toFixed(6);
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
    const pad = (maxY - minY) * 0.1;

    data.xaxis = {
      min: Math.min(...data.offsets),
      max: Math.max(...data.offsets),
    };

    data.datum = Math.round(minY - 2);
    data.yRange = [minY - 2, maxY + pad];

    return data;
  };

  const handleDownloadAllChainage = async () => {
    try {
      const initialEntry = tableData[0];
      if (!initialEntry?.rows?.length) return;

      setLoading(true);
      setProgress({
        percent: 0,
        message: "Preparing report data...",
        estimatedTimeLeft: null,
      });

      const allFormattedData = initialEntry.rows
        ?.filter((row) => row.type === "Chainage")
        .map((row) => buildCsData(row))
        .filter(Boolean);
      if (!allFormattedData.length) throw new Error("No cross-section graphs are available to export.");

      const pdf = createGraphPdf();
      const plotNode = document.createElement("div");
      const graphWidth = Math.max(900, Math.round(pdfRef.current?.querySelector(".js-plotly-plot")?.getBoundingClientRect().width || 0));
      const graphHeight = 250;
      Object.assign(plotNode.style, {
        position: "fixed",
        left: "-10000px",
        top: "0",
        width: `${graphWidth}px`,
        height: `${graphHeight}px`,
        background: "white",
      });
      document.body.appendChild(plotNode);

      let renderedCount = 0;
      try {
        for (let index = 0; index < allFormattedData.length; index++) {
          const section = allFormattedData[index];
          const xValues = section.offsets.map(Number).filter(Number.isFinite);
          const yValues = section.allRl.map(Number).filter(Number.isFinite);
          if (!xValues.length || !yValues.length) continue;
          const minX = Math.min(...xValues);
          const maxX = Math.max(...xValues);
          const minY = Math.min(...yValues);
          const maxY = Math.max(...yValues);
          const pad = (maxY - minY) * 0.1;
          const traces = section.series.map((series) => {
            const points = [...(series.data || [])].sort((a, b) => Number(a.x) - Number(b.x));
            return {
              x: points.map((point) => Number(point.x)),
              y: points.map((point) => point.y === null ? null : Number(point.y)),
              type: "scatter",
              mode: "lines",
              name: series.name,
              line: { shape: "linear", width: 1, color: series.color },
            };
          });
          const layout = {
            ...v1ChartOptions.layout,
            width: graphWidth,
            height: graphHeight,
            xaxis: {
              autorange: false,
              range: scaledRange([minX, maxX], drawingScales.horizontal),
              tickformat: ".3f",
              dtick: (maxX - minX) / 4,
              zeroline: false,
              showline: false,
              mirror: true,
            },
            yaxis: {
              zeroline: false,
              autorange: false,
              range: scaledRange([minY - 2, maxY + pad], drawingScales.vertical),
            },
          };
          await Plotly.newPlot(plotNode, traces, layout, { displayModeBar: false, staticPlot: true });
          const image = await Plotly.toImage(plotNode, { format: "jpeg", width: graphWidth, height: graphHeight, scale: 2 });
          if (renderedCount > 0) pdf.addPage();
          addGraphPage(pdf, image, section, drawingScales, graphWidth, graphHeight);
          renderedCount++;
          setProgress({ percent: Math.round((index + 1) / allFormattedData.length * 100), message: `Rendering chainage ${index + 1} of ${allFormattedData.length}`, estimatedTimeLeft: null });
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
      } finally {
        Plotly.purge(plotNode);
        plotNode.remove();
      }

      if (!renderedCount) throw new Error("No valid cross-section graphs are available to export.");
      pdf.save("cross-sections.pdf");
      setLoading(false);
      setProgress(null);
    } catch (err) {
      handleFormError(err, null, dispatch, navigate);
      setLoading(false);
      setProgress(null);
    }
  };

  const handleMenuSelect = (item) => {
    if (item.value === "download") return downloadPDF();

    if (item.value === "exportToDXF") return exportToDXF();

    if (item.value === "downloadAllChainage")
      return handleDownloadAllChainage();

    if (!selectedCs) return;

    // Compute bounds
    const minY = Math.min(...selectedCs.allRl);
    const maxY = Math.max(...selectedCs.allRl);

    // Padding - you can tweak the factor
    const pad = (maxY - minY) * 0.1;

    const minX = Math.min(...selectedCs.offsets);
    const maxX = Math.max(...selectedCs.offsets);

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

    setSelectedMenu(item);
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

  const getColor = (type) => {
    if (type.includes("Initial")) return colors.Initial;
    if (type.includes("Proposed")) return colors.Proposed;
    return colors.Final;
  };

  const handleClickCs = (id) => {
    if (selectedCs?.id === id) return;
    if (!tableData?.length) return;

    const initialEntry = tableData[0];
    if (!initialEntry?.rows?.length) return;

    const row = initialEntry.rows.find((row) => row._id === id);
    if (!row) return;

    // raw offsets contain duplicates
    const rawOffsets = row.offsets || [];
    const safeInitial = row.reducedLevels || [];

    // UNIQUE OFFSETS ONLY FOR XAXIS
    const uniqueOffsets = [
      ...new Set(rawOffsets.map((n) => Number(n).toFixed(6))),
    ].sort((a, b) => a - b);

    const data = {
      id,
      type: "cs",
      offsets: [...uniqueOffsets],
      chainage: row.chainage,
      series: [],
      allRl: [],
    };

    // Keep duplicates in the plotted series
    const makeSeries = (offsets, levels) =>
      offsets.map((o, i) => {
        const level = levels?.[i];
        const y =
          level !== null &&
          level !== undefined &&
          level !== "" &&
          Number.isFinite(Number(level))
            ? Number(level).toFixed(3)
            : null;
        if (y !== null) data.allRl.push(Number(y));

        return {
          x: Number(o).toFixed(6),
          y,
        };
      });

    // Add initial (original)
    data.series.push({
      _id: row._id,
      purpose: initialEntry._id,
      name: initialEntry.type,
      color: getColor(initialEntry.type),
      data: makeSeries(rawOffsets, safeInitial),
    });

    // Additional tables (Proposed, Level-2...)
    if (tableData.length > 1) {
      for (let i = 1; i < tableData.length; i++) {
        const table = tableData[i];

        const newRow = table?.rows?.find((r) => r.chainage === row.chainage);
        if (!newRow) continue;

        const rawProposalOffsets = newRow.offsets || []; // duplicates allowed
        const safeProposalLevels = newRow.reducedLevels || [];

        // Merge unique offsets for category labels
        rawProposalOffsets.forEach((o) => {
          const num = Number(o).toFixed(6);
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

    // Sort offsets for categories
    data.offsets.sort((a, b) => a - b);

    // Compute bounds
    const minY = Math.min(...data.allRl);
    const maxY = Math.max(...data.allRl);

    const pad = (maxY - minY) * 0.1;

    const minX = Math.min(...data.offsets);
    const maxX = Math.max(...data.offsets);

    const xaxis = {
      autorange: false,
      range: [minX, maxX],
      tickformat: ".3f",
      dtick: (maxX - minX) / 4,
      zeroline: false,
      showline: false,
      mirror: true,
    };

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

    data.datum = Math.round(minY - 2);

    setSelectedCs(data);
  };

  const handleTableToggle = (id) => {
    handleToggle(id);

    handleClickCs(id);
  };

  const fetchSurvey = async () => {
    try {
      if (!global) dispatch(startLoading());
      const { data } = await getSurvey(id);

      if (data.success) {
        setSurvey(data.survey);

        handleSetTableData(data.survey);
      } else {
        throw Error("Failed to fetch survey");
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  const handleRlChange = (type, rowId, rlIndex, value) => {
    let prevValue = null;

    const updatedCs = {
      ...selectedCs,
      series: selectedCs?.series?.map((s) => {
        if (s.name === type) {
          return {
            ...s,
            data: s?.data?.map((d, idx) => {
              if (idx === rlIndex) {
                prevValue = d.y;

                return {
                  ...d,
                  y: value,
                };
              }

              return d;
            }),
          };
        }

        return s;
      }),
    };

    const index = updatedCs.allRl.indexOf(prevValue);
    if (index === -1) return;

    updatedCs.allRl[index] = String(value);

    setSelectedCs(updatedCs);

    // Compute bounds
    const minY = Math.min(...updatedCs.allRl);
    const maxY = Math.max(...updatedCs.allRl);

    // Padding - you can tweak the factor
    const pad = (maxY - minY) * 0.1;

    const minX = Math.min(...updatedCs.offsets);
    const maxX = Math.max(...updatedCs.offsets);

    const xaxis = {
      autorange: false,
      range: [minX, maxX],
      tickformat: ".3f",
      dtick: (maxX - minX) / 4,
      zeroline: false,
      showline: false,
      mirror: true,
    };

    if (selectedMenu === "v1") {
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
    if (selectedMenu === "v2") {
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

    setTableData((prev) =>
      prev.map((t) => ({
        ...t,
        rows: t.rows?.map((r) => {
          if (r._id !== rowId) return r;

          return {
            ...r,
            reducedLevels: r.reducedLevels.map((rl, idx) =>
              idx === rlIndex ? value : rl,
            ),
          };
        }),
      })),
    );
  };

  const handleInputChange = (value) => {
    const maxVal = Number(value);
    const highestRl = Math.max(...selectedCs?.allRl);

    setChartOptions((prev) => ({
      ...prev,

      layout: {
        ...chartOptions.layout,
        yaxis: {
          zeroline: false,
          autorange: false,
          range: [
            chartOptions?.layout?.yaxis?.range[0] || 0,
            maxVal > highestRl ? maxVal : highestRl,
          ],
        },
      },
    }));

    setMaxValue(maxVal);
  };

  const handleUpdateReducedLevels = async () => {
    try {
      const { data } = await updateReducedLevels(id, {
        chainage: selectedCs.chainage,
        series: selectedCs.series,
      });

      if (data.success) {
        dispatch(
          showAlert({
            type: "success",
            message: "Reduced levels updated successfully",
          }),
        );
      } else {
        throw Error("Failed to fetch survey");
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    }
  };

  useEffect(() => {
    fetchSurvey();
  }, []);

  useEffect(() => {
    if (tableData.length) {
      const row = tableData[0].rows?.find((row) => row.type === "Chainage");

      if (row) handleClickCs(row._id, "initial");
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

          <ExportLoader
            open={loading}
            progress={progress?.percent}
            progressMessage={progress?.message}
            estimatedTimeLeft={progress?.estimatedTimeLeft}
          />

          <Stack
            direction={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <BasicButton
                variant="text"
                sx={{
                  height: 40,
                  width: 40,
                  minWidth: 40,
                  borderRadius: "12px",
                  color: "#334155",
                  bgcolor: "#f1f5f9",
                  border: "none",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#e2e8f0", color: "#1e293b" },
                }}
                onClick={() => navigate(-1)}
                value={<MdArrowBackIosNew fontSize={18} />}
              />
              <Typography
                variant="h6"
                fontSize={20}
                fontWeight={800}
                color="#1e293b"
              >
                CS AT CH {selectedCs?.chainage}
              </Typography>
            </Stack>

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
              position: "sticky",
              top: 0,
              zIndex: 3,
            }}
          >
            <WaterWayProposalNotice purposes={tableData} />
            <SectionScaleInputs
              scales={drawingScales}
              onChange={setDrawingScales}
            />
            {selectedCs && selectedCs?.series && interactiveChartOptions && (
              <CrossSectionChart
                drawingScales={drawingScales}
                selectedCs={selectedCs}
                chartOptions={interactiveChartOptions}
                pdfRef={pdfRef}
              />
            )}

            <Box
              sx={{
                height: 56, // MUI table header height
                display: "flex",
                alignItems: "center",

                px: 2,
                mt: 2,
                width: "100%",
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "rgba(0, 0, 0, 0.87)",

                backgroundColor: "#f4f6f8",
                borderBottom: "1px solid #e0e0e0",

                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,

                // Optional: match table cell look
                boxSizing: "border-box",
              }}
            >
              CH
            </Box>

            <TableContainer
              component={Paper}
              sx={{
                maxHeight: 440,
                overflowX: "auto",
                borderRadius: 0,
                position: "relative",
              }}
            >
              <Table stickyHeader sx={{ tableLayout: "fixed" }}>
                <TableBody>
                  {tableData[0]?.rows?.map(
                    (row, index) =>
                      row.type === "Chainage" && (
                        <Fragment key={index}>
                          <TableRow>
                            <TableCell
                              sx={{
                                position: "sticky",
                                left: 0,
                                zIndex: 3, // higher than table body cells
                                backgroundColor: "#fff", // IMPORTANT to avoid overlap transparency
                                borderBottom: 0,
                              }}
                            >
                              <BasicButton
                                value={row.chainage}
                                variant="outlined"
                                sx={{
                                  py: 1,
                                  px: 2,
                                  cursor: "pointer",
                                  border: "1px solid #6366f1",
                                  color: "#6366f1",
                                  "&:hover": {
                                    bgcolor: "#f8fafc",
                                    color: "#6366f1",
                                  },
                                }}
                                onClick={() => handleTableToggle(row._id)}
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell
                              style={{
                                paddingBottom: 0,
                                paddingTop: 0,
                              }}
                              colSpan={6}
                            >
                              <Collapse
                                in={openRowId === row._id}
                                timeout="auto"
                                unmountOnExit
                              >
                                <Table size="small" aria-label="purchases">
                                  <TableBody>
                                    <TableRow>
                                      <TableCell
                                        sx={{
                                          position: "sticky",
                                          left: 0,
                                          zIndex: 3,
                                          backgroundColor: "#fff",
                                          fontWeight: 600,
                                          borderRight: "1px solid #e0e0e0",
                                        }}
                                      >
                                        Offset
                                      </TableCell>

                                      {selectedCs?.series?.map((s) => (
                                        <TableCell
                                          key={s._id}
                                          align="center"
                                          sx={{
                                            color: s.color,
                                            fontWeight: 600,
                                          }}
                                        >
                                          {shortLabel(s.name)}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                    {selectedCs?.offsets?.map((offset) => (
                                      <TableRow key={offset}>
                                        {/* Offset Column */}
                                        <TableCell
                                          sx={{
                                            position: "sticky",
                                            left: 0,
                                            zIndex: 2,
                                            backgroundColor: "#fff",
                                            borderRight: "1px solid #e0e0e0",
                                          }}
                                        >
                                          {Number(offset).toFixed(3)}
                                        </TableCell>

                                        {/* Series Columns */}
                                        {selectedCs?.series?.map((s) => {
                                          const idx = s.data?.findIndex(
                                            (d) => d?.x === offset,
                                          );
                                          const cellData =
                                            idx > -1 ? s.data[idx] : null;

                                          return (
                                            <TableCell
                                              key={s._id}
                                              sx={{ p: 1 }}
                                            >
                                              {cellData ? (
                                                <BasicInput
                                                  type="number"
                                                  value={cellData.y}
                                                  sx={{
                                                    minWidth: "100px",
                                                    borderColor:
                                                      inputColors[s.color]
                                                        ?.borderColor,
                                                    color:
                                                      inputColors[s.color]
                                                        ?.color,
                                                  }}
                                                  error={
                                                    cellData.y === ""
                                                      ? "Required"
                                                      : ""
                                                  }
                                                  onChange={(e) =>
                                                    handleRlChange(
                                                      s.name,
                                                      s._id,
                                                      idx,
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                              ) : (
                                                <BasicInput
                                                  type="text"
                                                  value="N/A"
                                                  disabled
                                                  sx={{
                                                    minWidth: "100px",
                                                    borderColor:
                                                      inputColors[s.color]
                                                        ?.borderColor,
                                                    color:
                                                      inputColors[s.color]
                                                        ?.color,
                                                  }}
                                                />
                                              )}
                                            </TableCell>
                                          );
                                        })}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>

                                <Box py={2}>
                                  <Box
                                    sx={{
                                      position: "sticky",
                                      left: 0,
                                      zIndex: 10,
                                      backgroundColor: "#fff",
                                      width: "fit-content",
                                      paddingLeft: 2,
                                    }}
                                  >
                                    <BasicButton
                                      value="Update"
                                      variant="outlined"
                                      sx={{ py: 1, px: 2 }}
                                      onClick={handleUpdateReducedLevels}
                                    />
                                  </Box>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      ),
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default CrossSectionReport;
