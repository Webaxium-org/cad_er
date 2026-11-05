import WaterWayProposalNotice from "./components/WaterWayProposalNotice";
import QuantityDeltaBadge from "./components/QuantityDeltaBadge";
import AddLongitudinalChainageDialog from "./components/AddLongitudinalChainageDialog";
import { createLongitudinalPdf, fittedLongitudinalScales } from "../../utils/longitudinalPdf";
import ExportLoader from "../../components/ExportLoader";
import SectionScaleInputs from "./components/SectionScaleInputs";
import { profilePoints, profileLevel, chainageValue } from "../../utils/surveyGeometry";
import { calculateVolumeReport } from "../../utils/volumeReport";
import { reportDeductions } from "../../utils/surveyDeductions";
import { buildSlopeEdits, previewLongitudinalPurposes, shiftReducedLevels } from "../../utils/longitudinalLevels";
import { chainageTableViewport } from "../../utils/chainageTableViewport";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { handleFormError } from "../../utils/handleFormError";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import { getSurvey, updateReducedLevels, saveLongitudinalSlope } from "../../services/surveyServices";
import { showAlert } from "../../redux/alertSlice";
import { Alert, Box, Stack, Typography, Paper, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";
import BasicInput from "../../components/BasicInput";
import BasicButton from "../../components/BasicButton";
import CrossSectionChart from "./components/CrossSectionChart";
import { v1ChartOptions, v2ChartOptions } from "../../constants";
import { MdDownload, MdOutlineAssessment, MdUpdate, MdUndo } from "react-icons/md";
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

const shortLevelLabel = (name) => {
  if (name === "Initial Level") return "IL";
  if (name === "Proposed Level") return "PL";
  if (name === "Final Level") return "FL";
  return name.replace(/^Proposed /, "PL ").replace(/^Initial /, "IL ").replace(/^Final /, "FL ");
};

const headerActionSx = {
  minWidth: { xs: 44, sm: 64 }, height: 40, px: { xs: 1, sm: 1.5 },
  color: "white", borderColor: "rgba(255,255,255,0.45)",
  bgcolor: "rgba(255,255,255,0.12)", borderRadius: "10px",
  textTransform: "none", fontWeight: 700, fontSize: { xs: "0.75rem", sm: "0.875rem" },
  "&:hover": { bgcolor: "rgba(255,255,255,0.24)", borderColor: "white" },
  "&.Mui-disabled": { color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.2)" },
};

const colors = {
  Initial: "green",
  Proposed: "blue",
  Final: "red",
};

const levelEditReducer = (state, action) => {
  if (action.type === "undo") {
    if (!state.history.length) return state;
    return { edits: state.history.at(-1), history: state.history.slice(0, -1) };
  }
  if (action.type === "saved") {
    const removeSaved = (edits) => Object.fromEntries(
      Object.entries(edits).filter(([key]) => !action.keys.includes(key)),
    );
    const edits = removeSaved(state.edits);
    // Keep undo steps for other chainages without restoring saved values.
    const snapshots = [...state.history, state.edits].map(removeSaved);
    const distinct = snapshots.filter((snapshot, index) => index === 0
      || JSON.stringify(snapshot) !== JSON.stringify(snapshots[index - 1]));
    return { edits, history: distinct.slice(0, -1) };
  }
  const edits = action.update(state.edits);
  if (JSON.stringify(edits) === JSON.stringify(state.edits)) return state;
  return { edits, history: [...state.history, state.edits] };
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
  const chainageTableRef = useRef(null);
  const graphScrollRef = useRef(null);
  const graphInteractionRef = useRef(null);
  const [tableScrollSize, setTableScrollSize] = useState({ width: 0, content: 0 });
  const [tableViewport, setTableViewport] = useState(null);
  useEffect(() => {
    const table = chainageTableRef.current;
    if (!table) return;
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setTableScrollSize(previous => previous.width === table.clientWidth && previous.content === table.scrollWidth
          ? previous : { width: table.clientWidth, content: table.scrollWidth });
        if (graphScrollRef.current && Math.abs(graphScrollRef.current.scrollLeft - table.scrollLeft) > 1) graphScrollRef.current.scrollLeft = table.scrollLeft;
        const range = chainageTableViewport(selectedCs?.chainages || [], table.scrollLeft, table.clientWidth);
        setTableViewport(previous => previous?.[0] === range?.[0] && previous?.[1] === range?.[1] ? previous : range);
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(table);
    table.addEventListener("scroll", update, { passive: true });
    update();
    return () => { observer.disconnect(); table.removeEventListener("scroll", update); cancelAnimationFrame(frame); };
  }, [selectedCs]);
  useEffect(() => {
    const graph = graphInteractionRef.current;
    if (!graph) return;
    let touch;
    const wheel = event => {
      // Leave ordinary vertical scrolling and Ctrl+wheel zoom with the chart.
      if (event.ctrlKey || event.metaKey) return;
      const delta = event.shiftKey ? event.deltaY || event.deltaX : event.deltaX;
      const table = chainageTableRef.current;
      if (!delta || !table || table.scrollWidth <= table.clientWidth) return;
      event.preventDefault();
      event.stopPropagation();
      table.scrollLeft += delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? table.clientWidth : 1);
    };
    const start = event => {
      const table = chainageTableRef.current;
      touch = event.touches.length === 1 && table
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY, left: table.scrollLeft, horizontal: false } : null;
    };
    const move = event => {
      if (!touch || event.touches.length !== 1) return;
      const dx = event.touches[0].clientX - touch.x;
      const dy = event.touches[0].clientY - touch.y;
      if (!touch.horizontal && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.25) touch.horizontal = true;
      const table = chainageTableRef.current;
      if (!touch.horizontal || !table || table.scrollWidth <= table.clientWidth) return;
      event.preventDefault();
      event.stopPropagation();
      table.scrollLeft = touch.left - dx;
    };
    const end = () => { touch = null; };
    graph.addEventListener("wheel", wheel, { capture: true, passive: false });
    graph.addEventListener("touchstart", start, { capture: true, passive: true });
    graph.addEventListener("touchmove", move, { capture: true, passive: false });
    graph.addEventListener("touchend", end, true);
    graph.addEventListener("touchcancel", end, true);
    return () => {
      graph.removeEventListener("wheel", wheel, true);
      graph.removeEventListener("touchstart", start, true);
      graph.removeEventListener("touchmove", move, true);
      graph.removeEventListener("touchend", end, true);
      graph.removeEventListener("touchcancel", end, true);
    };
  }, []);
  const [compactHeroHeight, setCompactHeroHeight] = useState(0);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printPreviewUrl, setPrintPreviewUrl] = useState(null);
  useEffect(() => () => { if (printPreviewUrl) URL.revokeObjectURL(printPreviewUrl); }, [printPreviewUrl]);
  const [{ edits: levelEdits, history: editHistory }, dispatchLevelEdit] = useReducer(levelEditReducer, { edits: {}, history: [] });
  const setLevelEdits = (update) => dispatchLevelEdit({ type: "edit", update });
  const [savingLevels, setSavingLevels] = useState(false);
  const [addChainageOpen, setAddChainageOpen] = useState(false);

  const [slopeDialogOpen, setSlopeDialogOpen] = useState(false);
  const [slopeForm, setSlopeForm] = useState({ levelIndex: 1, from: "", to: "", denominator: "10", direction: "falling" });
  const canEditLevels = tableData.length === 2 && selectedCs?.series?.length === 2;
  const getRowEditState = (row) => {
    const values = row.sources.flatMap((_, index) => {
      const key = `${row.id}-${index}`;
      return Object.hasOwn(levelEdits, key) ? [levelEdits[key]] : [];
    });
    return {
      dirty: values.length > 0,
      invalid: values.some((value) => String(value).trim() === "" || !Number.isFinite(Number(value))),
    };
  };
  const [drawingScales, setDrawingScales] = useState({ horizontal: 2400, vertical: 300 });
  const [exportProgress, setExportProgress] = useState(null);
  const exportingRef = useRef(false);

  const savedQuantity = useMemo(() => tableData.length === 2
    ? calculateVolumeReport(survey, tableData[0], tableData[1], reportDeductions(survey, state?.deductionId))
    : null, [survey, tableData, state?.deductionId]);

  const liveQuantity = useMemo(() => {
    if (!savedQuantity || !canEditLevels || !selectedCs?.levelRows) return savedQuantity;
    const purposes = previewLongitudinalPurposes(tableData, selectedCs.levelRows, levelEdits);
    return calculateVolumeReport(survey, purposes[0], purposes[1], reportDeductions(survey, state?.deductionId));
  }, [savedQuantity, canEditLevels, selectedCs, tableData, levelEdits, survey, state?.deductionId]);
  const invalidQuantityEdits = Object.values(levelEdits).some((value) =>
    String(value).trim() === "" || !Number.isFinite(Number(value)));
  const quantityIncomplete = liveQuantity?.missingSections?.length > 0;

  const slopePreview = useMemo(() => {
    if (!slopeDialogOpen || !canEditLevels) return { error: "Slope editing requires exactly two selected levels." };
    try {
      return buildSlopeEdits({ rows: selectedCs.levelRows, ...slopeForm, separator: survey?.separator || "/", edits: levelEdits, breakChainages: selectedCs.breakBeforeChainages });
    } catch (error) { return { error: error.message }; }
  }, [slopeDialogOpen, canEditLevels, selectedCs, slopeForm, survey?.separator, levelEdits]);

  const handleApplySlope = async () => {
    if (!canEditLevels || savingLevels || slopePreview.error) return;
    const levelIndex = slopeForm.levelIndex;
    const edits = slopePreview.edits;
    const changes = selectedCs.levelRows.flatMap((row) => {
      const value = edits[`${row.id}-${levelIndex}`];
      if (value === undefined) return [];
      const source = row.sources[levelIndex];
      return [{ rowId: source.row._id, chainage: row.chainage, expectedLevels: source.row.reducedLevels,
        offsets: source.row.offsets, reducedLevels: shiftReducedLevels(source.row.reducedLevels, Number(value) - row.levels[levelIndex]) }];
    });
    setSavingLevels(true);
    try {
      const { data } = await saveLongitudinalSlope(id, { purposeId: tableData[levelIndex]._id, changes });
      if (!data.success) throw Error("The slope could not be saved.");
      const rows = new Map(data.rows.map((row) => [String(row._id), row]));
      const updatePurpose = (purpose) => ({ ...purpose, rows: purpose.rows?.map((row) => {
        const saved = rows.get(String(row._id));
        return saved ? { ...row, ...saved, offsets: saved.intermediateOffsets.map((point) => point.offset), intermediateSight: saved.intermediateOffsets.map((point) => point.is) } : row;
      }) });
      setTableData((previous) => previous.map(updatePurpose));
      setSurvey((previous) => ({ ...previous, purposes: previous.purposes.map(updatePurpose) }));
      dispatchLevelEdit({ type: "saved", keys: Object.keys(edits) });
      setSlopeDialogOpen(false);
      dispatch(showAlert({ type: "success", message: `Slope saved to the project across ${data.updated} chainages.` }));
    } catch (error) { handleFormError(error, null, dispatch, navigate); }
    finally { setSavingLevels(false); }
  };

  const previewCs = useMemo(() => {
    if (!selectedCs || !canEditLevels || !Object.keys(levelEdits).length) return selectedCs;
    const series = selectedCs.series.map((entry, index) => {
      const edits = new Map(selectedCs.levelRows.flatMap((row, rowIndex) => {
        const value = levelEdits[`${row.id}-${index}`];
        return value !== undefined && String(value).trim() !== "" && Number.isFinite(Number(value))
          ? [[Number(selectedCs.chainages[rowIndex].toFixed(3)), Number(value)]] : [];
      }));
      return { ...entry, data: entry.data.map((point) => ({
        ...point,
        // Null points mark breaks and missing coverage; keep them intact.
        y: point.y !== null && edits.has(point.x) ? edits.get(point.x) : point.y,
      })) };
    });
    const allRl = series.flatMap((entry) => entry.data.map((point) => point.y).filter(Number.isFinite));
    return { ...selectedCs, series, allRl, datum: allRl.length ? Math.round(Math.min(...allRl) - 1) : selectedCs.datum };
  }, [selectedCs, canEditLevels, levelEdits]);

  const interactiveChartOptions = useMemo(() => ({
    ...chartOptions,
    config: {
      ...chartOptions.config,
      displayModeBar: true,
      scrollZoom: true,
      doubleClick: "reset",
      modeBarButtonsToRemove: ["pan2d", "select2d", "lasso2d", "toggleSpikelines", "toImage"],
    },
    layout: {
      ...chartOptions.layout,
      dragmode: "zoom",
      xaxis: { ...chartOptions.layout?.xaxis, fixedrange: true },
      yaxis: { ...chartOptions.layout?.yaxis, fixedrange: false },
      ...(previewCs !== selectedCs && previewCs?.allRl?.length ? {
        yaxis: {
          ...chartOptions.layout?.yaxis,
          fixedrange: false,
          autorange: false,
          range: [Math.min(...previewCs.allRl) - 1, Math.max(...previewCs.allRl) + (Math.max(...previewCs.allRl) - Math.min(...previewCs.allRl)) * 0.2 + 1],
        },
      } : {}),
    },
  }), [chartOptions, previewCs, selectedCs]);

  const downloadPDF = async (preview = false, scales = drawingScales) => {
    if (!selectedCs || exportingRef.current) return;
    exportingRef.current = true;
    setExportProgress({ percent: 0, message: "Preparing longitudinal pages..." });
    try {
      const pdf = await createLongitudinalPdf(selectedCs, scales, chartOptions, "auto", setExportProgress);
      if (preview) setPrintPreviewUrl(URL.createObjectURL(pdf.output("blob")));
      else pdf.save("longitudinal-section.pdf");
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      exportingRef.current = false;
      setExportProgress(null);
    }
  };

  const fitPrintPreview = () => {
    if (!selectedCs || exportingRef.current) return;
    const scales = fittedLongitudinalScales(selectedCs, chartOptions);
    setDrawingScales(scales);
    setPrintPreviewUrl(null);
    downloadPDF(true, scales);
  };

  const handleMenuSelect = (item) => {
    if (item.value === "slope") {
      setSlopeForm({ levelIndex: 1, from: selectedCs?.levelRows?.[0]?.chainage || "", to: selectedCs?.levelRows?.at(-1)?.chainage || "", denominator: "10", direction: "falling" });
      setSlopeDialogOpen(true);
      return;
    }
    if (item.value === "download") {
      if (selectedCs && !exportingRef.current) downloadPDF();
      return;
    }

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
    }
    if (item.value === "v2") {
      setChartOptions(() => ({
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
      breakBeforeChainages: [...breakBeforeChainages],
      series: [],
      allRl: [], // We will only store NUMBERS here
      levelRows: filteredRow.map((row, index) => ({
        id: row._id,
        chainage: row.chainage,
        levels: [initialLevels[index]],
        sources: [{ row, purpose: initialEntry._id }],
      })),
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
        data.levelRows.forEach((row, index) => {
          row.levels.push(proposalLevels[index]);
          row.sources.push({
            row: newRows.find((source) => source.chainage === row.chainage),
            purpose: table._id,
          });
        });
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

    setChartOptions(() => ({
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

  const handleUpdateLevels = async (row) => {
    const editState = getRowEditState(row);
    if (!canEditLevels || savingLevels || editState.invalid || !editState.dirty) return;
    setSavingLevels(true);
    try {
        const series = row.sources.flatMap((source, index) => {
          const key = `${row.id}-${index}`;
          if (!Object.hasOwn(levelEdits, key)) return [];
          const delta = Number(levelEdits[key]) - row.levels[index];
          return [{
            _id: source.row._id,
            purpose: source.purpose,
            data: shiftReducedLevels(source.row.reducedLevels, delta).map((level, offsetIndex) => ({
              x: source.row.offsets[offsetIndex],
              y: level,
            })),
          }];
        });
        if (!series.length) return;
        const { data } = await updateReducedLevels(id, { chainage: String(row.chainage), series });
        if (!data.success) throw Error("Failed to update longitudinal levels");
        // Preserve drafts for other chainages.
        dispatchLevelEdit({ type: "saved", keys: row.sources.map((_, index) => `${row.id}-${index}`) });
      dispatch(showAlert({ type: "success", message: `Levels at chainage ${row.chainage} updated successfully` }));
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      await fetchSurvey();
      setSavingLevels(false);
    }
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
      {exportProgress && <ExportLoader progress={exportProgress.percent} progressMessage={exportProgress.message} />}
      <Dialog open={slopeDialogOpen} onClose={() => { if (!savingLevels) setSlopeDialogOpen(false); }} fullWidth maxWidth="sm" aria-labelledby="slope-dialog-title">
        <Box component="form" onSubmit={(event) => { event.preventDefault(); handleApplySlope(); }}>
          <DialogTitle id="slope-dialog-title" sx={{ color: "#4f46e5", fontWeight: 800 }}>Apply longitudinal slope</DialogTitle>
          <DialogContent inert={savingLevels ? true : undefined}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {!canEditLevels ? <Alert severity="info">Slope editing is available only when the LS report is generated with exactly two levels.</Alert> : <>
                <TextField select label="Level to adjust" value={slopeForm.levelIndex} onChange={(event) => setSlopeForm((previous) => ({ ...previous, levelIndex: Number(event.target.value) }))} fullWidth>
                  {selectedCs.series.map((series, index) => <MenuItem key={index} value={index}>{series.name}</MenuItem>)}
                </TextField>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField select required fullWidth label="From chainage" value={slopeForm.from} onChange={(event) => setSlopeForm((previous) => ({ ...previous, from: event.target.value }))}>
                    {selectedCs.levelRows.map((row) => <MenuItem key={row.id} value={row.chainage}>{row.chainage}</MenuItem>)}
                  </TextField>
                  <TextField select required fullWidth label="To chainage" value={slopeForm.to} onChange={(event) => setSlopeForm((previous) => ({ ...previous, to: event.target.value }))}>
                    {selectedCs.levelRows.map((row) => <MenuItem key={row.id} value={row.chainage} disabled={chainageValue(row.chainage, survey?.separator || "/") <= chainageValue(slopeForm.from, survey?.separator || "/")}>{row.chainage}</MenuItem>)}
                  </TextField>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField select fullWidth label="Direction" value={slopeForm.direction} onChange={(event) => setSlopeForm((previous) => ({ ...previous, direction: event.target.value }))}>
                    <MenuItem value="falling">Falling (subtract RL)</MenuItem>
                    <MenuItem value="rising">Rising (add RL)</MenuItem>
                  </TextField>
                  <TextField required fullWidth type="number" label="Slope: 1 in" value={slopeForm.denominator} inputProps={{ min: 0, step: "any" }} onChange={(event) => setSlopeForm((previous) => ({ ...previous, denominator: event.target.value }))} helperText="1 in 10 = 1 m change over 10 m." />
                </Stack>
                <Typography variant="body2" color="text.secondary">The slope starts at the current RL at the from-chainage. It sets a straight gradient at existing chainages within the range, keeping each cross-section's shape.</Typography>
                {slopePreview.error ? <Alert severity="warning">{slopePreview.error}</Alert> : <Box sx={{ p: 2, bgcolor: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 2, color: "#312e81" }}>
                  <Typography fontWeight={700}>Start RL: {slopePreview.startRl.toFixed(3)} → End RL: {slopePreview.endRl.toFixed(3)}</Typography>
                  <Typography variant="body2">{Object.keys(slopePreview.edits).length} chainages · {slopeForm.direction === "falling" ? "Fall" : "Rise"}: {Math.abs(slopePreview.endRl - slopePreview.startRl).toFixed(3)} m</Typography>
                </Box>}
                <Typography variant="caption" color="text.secondary">Apply &amp; save updates this level at every chainage in the selected range together. Other unsaved edits remain unchanged. Saved changes cannot be undone with the unsaved-edit Undo button.</Typography>
              </>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button disabled={savingLevels} onClick={() => setSlopeDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!canEditLevels || savingLevels || Boolean(slopePreview.error)} sx={{ bgcolor: "#4f46e5", "&:hover": { bgcolor: "#4338ca" } }}>{savingLevels ? "Saving slope…" : "Apply & save slope"}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={printPreviewOpen} onClose={() => setPrintPreviewOpen(false)} fullWidth maxWidth="lg"
        sx={{ "& .MuiDialog-paper": { height: "90dvh", maxHeight: "90dvh", m: { xs: 1, sm: 4 }, width: { xs: "calc(100% - 16px)", sm: "calc(100% - 64px)" } } }}>
        <DialogTitle>LS print preview</DialogTitle>
        <DialogContent sx={{ pt: "12px !important", display: "flex", overflow: "hidden" }}>
          <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0, minHeight: 0, "& > .MuiStack-root": { flexShrink: 0 } }}>
            <SectionScaleInputs scales={drawingScales} onChange={(scales) => { setDrawingScales(scales); setPrintPreviewUrl(null); }} />
            <Stack direction="row" spacing={1}>
              <Button onClick={() => downloadPDF(true)} disabled={Boolean(exportProgress)}>Update preview</Button>
              <Button onClick={fitPrintPreview} disabled={Boolean(exportProgress)}>Fit profile</Button>
            </Stack>
            {printPreviewUrl ? <Box key={printPreviewUrl} component="iframe" title="LS PDF print preview" src={`${printPreviewUrl}#view=Fit&navpanes=0`} sx={{ width: "100%", flex: 1, minHeight: 0, border: "1px solid #e2e8f0" }} /> : <Alert severity="info">Update the preview to view the selected print scales.</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setPrintPreviewOpen(false)}>Close</Button><Button onClick={() => downloadPDF()} disabled={Boolean(exportProgress)}>Download PDF</Button></DialogActions>
      </Dialog>
      <SmallHeader />
      <PageHeroHeader
        icon={MdOutlineAssessment}
        onCompactHeightChange={setCompactHeroHeight}
        title="LS Profile"
        subtitle="Graph follows the visible chainage columns"
        action={
          <Stack direction="row" spacing={0.75}>
            <Button variant="outlined" aria-label="Undo last unsaved chainage edit" title="Undo last unsaved edit"
              disabled={savingLevels || !editHistory.length}
              onClick={() => dispatchLevelEdit({ type: "undo" })} sx={headerActionSx}>
              <MdUndo size={20} /><Box component="span" sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}>Undo</Box>
            </Button>
            <Button variant="outlined" disabled={!canEditLevels || savingLevels} onClick={() => handleMenuSelect({ value: "slope" })}
              aria-label="Apply longitudinal slope" sx={headerActionSx}>Slope</Button>
            <Button variant="outlined" disabled={!selectedCs || Boolean(exportProgress)} onClick={() => { setPrintPreviewOpen(true); fitPrintPreview(); }}
              aria-label="Open LS print preview" sx={headerActionSx}>
              <Box component="span" sx={{ display: { xs: "none", sm: "inline-flex" }, mr: 0.5 }}><MdDownload size={18} /></Box>PDF
            </Button>
          </Stack>
        }
      />
      <Box sx={{ maxWidth: "1200px", margin: "0 auto", p: { xs: 2, md: 4 }, pt: 0, mt: -12, position: "relative", zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: "28px",
            bgcolor: "#ffffff",
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            borderLeftColor: "#6366f1",
            position: "relative",
            overflow: "visible",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              background: "linear-gradient(to right, #6366f1 6px, transparent 6px)",
              pointerEvents: "none",
            },
          }}
        >
          <Box
            sx={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "contents" }}>
              <WaterWayProposalNotice purposes={tableData} />
              <Box ref={graphInteractionRef} sx={{ touchAction: "pan-y pinch-zoom", width: "100%", position: "sticky", top: { xs: 49 + compactHeroHeight, md: 65 + compactHeroHeight }, zIndex: 10, bgcolor: "white", boxShadow: "0 8px 20px rgba(20,32,72,0.08)" }}>
              <QuantityDeltaBadge showTotals saved={savedQuantity} live={liveQuantity} invalid={invalidQuantityEdits || quantityIncomplete} />
              {selectedCs && selectedCs?.series?.length && (
                <CrossSectionChart
                  drawingScales={{ horizontal: 2400, vertical: 300 }}
                  selectedCs={previewCs}
                  chartOptions={interactiveChartOptions}
                  viewportRange={tableViewport}
                  pdfRef={pdfRef}
                />
              )}
              {tableScrollSize.content > tableScrollSize.width && <Box ref={graphScrollRef} tabIndex={0} role="region" aria-label="Scroll graph and chainage table horizontally"
                onScroll={event => { const table = chainageTableRef.current; if (table && Math.abs(table.scrollLeft - event.currentTarget.scrollLeft) > 1) table.scrollLeft = event.currentTarget.scrollLeft; }}
                sx={{ width: tableScrollSize.width, maxWidth: "100%", mx: "auto", overflowX: "scroll", overflowY: "hidden", height: 20, touchAction: "pan-x", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
                <Box sx={{ width: tableScrollSize.content, height: 1 }} />
              </Box>}
              </Box>

            </Box>
            {selectedCs?.levelRows?.length > 0 && (
              <Box sx={{ width: "100%", minWidth: 0, mt: 2, textAlign: "left" }}>
                {Boolean(Object.keys(levelEdits).length) && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 2, pb: 1.5 }}>
                    Save or undo pending RL edits before adding a new chainage.
                  </Typography>
                )}
                <TableContainer ref={chainageTableRef} tabIndex={0} role="region" aria-label="Chainage levels, scroll horizontally to view all chainages" sx={{ width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" }, touchAction: "pan-x pan-y", border: "1px solid #e2e8f0", borderRadius: "16px" }}>
                  <Table size="small" aria-label="Chainage levels" sx={{ width: 88 + selectedCs.levelRows.length * 104, tableLayout: "fixed", "& th, & td": { borderColor: "#e2e8f0", borderRight: "1px solid #e2e8f0" }, "& th:first-of-type": { width: 88, minWidth: 88, maxWidth: 88, boxSizing: "border-box", px: 1, whiteSpace: "normal", overflowWrap: "anywhere" } }}>
                    <colgroup><col style={{ width: 88 }} />{selectedCs.levelRows.map((row) => <col key={row.id} style={{ width: 104 }} />)}</colgroup>
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ position: "sticky", left: 0, zIndex: 2, bgcolor: "#eef2ff", fontWeight: 800, color: "#4338ca" }}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Box component="span" title="Chainage" aria-label="Chainage">CH</Box>
                            <Button variant="outlined" size="small" aria-label="Add chainage"
                              disabled={savingLevels || Boolean(Object.keys(levelEdits).length)}
                              onClick={() => setAddChainageOpen(true)}
                              title={Object.keys(levelEdits).length ? "Save or undo pending RL edits before adding a chainage" : "Add a new chainage"}
                              sx={{ minWidth: 24, width: 24, height: 24, p: 0, borderRadius: "8px", borderColor: "#c7d2fe", color: "#4f46e5", fontSize: "1.1rem", fontWeight: 700, bgcolor: "white" }}>+</Button>
                          </Stack>
                        </TableCell>
                        {selectedCs.levelRows.map((row) => (
                          <TableCell component="th" scope="col" key={row.id} align="center" sx={{ px: 1, bgcolor: "#eef2ff", color: "#4338ca", fontWeight: 800, whiteSpace: "nowrap", py: 1 }}>{row.chainage}</TableCell>
                        ))}
                      </TableRow>
                      {selectedCs.series.map((series, levelIndex) => (
                        <TableRow key={levelIndex}>
                          <TableCell component="th" scope="row" sx={{ position: "sticky", left: 0, zIndex: 1, bgcolor: "#f8fafc", color: series.color, fontWeight: 700 }} title={`${series.name} (RL)`} aria-label={`${series.name} (RL)`}>{shortLevelLabel(series.name)}</TableCell>
                          {selectedCs.levelRows.map((row) => {
                            const level = row.levels[levelIndex];
                            const key = `${row.id}-${levelIndex}`;
                            const value = levelEdits[key] ?? (Number.isFinite(level) ? level.toFixed(3) : "N/A");
                            const sourceLevels = row.sources[levelIndex]?.row?.reducedLevels;
                            const editable = canEditLevels && Number.isFinite(level) && sourceLevels?.length > 0
                              && sourceLevels.every((entry) => String(entry ?? "").trim() !== "" && Number.isFinite(Number(entry)));
                            const invalid = editable && (String(value).trim() === "" || !Number.isFinite(Number(value)));
                            return (
                              <TableCell key={row.id} sx={{ px: 0.5, py: 0.75 }}>
                                <BasicInput
                                  type={editable ? "number" : "text"}
                                  value={value}
                                  disabled={!editable || savingLevels}
                                  error={invalid ? "Enter a valid level" : ""}
                                  inputProps={{ step: "0.001", "aria-label": `${series.name} at chainage ${row.chainage}` }}
                                  sx={{ minWidth: 0, boxSizing: "border-box", px: 0.75, py: 1, color: series.color, borderColor: { green: "#bbf7d0", blue: "#bfdbfe", red: "#fecaca" }[series.color] }}
                                  onChange={(event) => setLevelEdits((previous) => ({ ...previous, [key]: event.target.value }))}
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                      {canEditLevels && (
                        <TableRow>
                          <TableCell component="th" scope="row" sx={{ position: "sticky", left: 0, zIndex: 1, bgcolor: "#f8fafc", fontWeight: 700 }}>Save changes</TableCell>
                          {selectedCs.levelRows.map((row) => (
                            <TableCell key={row.id} sx={{ px: 0.5, py: 0.75 }}>
                              <BasicButton
                                value="Update"
                                fullWidth
                                startIcon={<MdUpdate size={18} />}
                                disabled={savingLevels || getRowEditState(row).invalid || !getRowEditState(row).dirty}
                                onClick={() => handleUpdateLevels(row)}
                                sx={{ bgcolor: "#6366f1", color: "white", px: 0.5, fontSize: "0.75rem", "& .MuiButton-startIcon": { mr: 0.5, ml: 0 }, "&:hover": { bgcolor: "#4f46e5" } }}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
      <AddLongitudinalChainageDialog
        open={addChainageOpen} surveyId={id} referencePurposeId={tableData[0]?._id}
        separator={survey?.separator || "/"} onClose={() => setAddChainageOpen(false)}
        onAdded={async (chainage) => {
          setAddChainageOpen(false);
          await fetchSurvey();
          dispatch(showAlert({ type: "success", message: `Chainage ${chainage} added to all levels.` }));
        }}
      />
    </Box>
  );
};

export default LongitudinalSectionReport;
