import WaterWayProposalNotice from "./components/WaterWayProposalNotice";
import { createLongitudinalPdf } from "../../utils/longitudinalPdf";
import ExportLoader from "../../components/ExportLoader";
import SectionScaleInputs from "./components/SectionScaleInputs";
import { profilePoints, profileLevel, chainageValue } from "../../utils/surveyGeometry";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { handleFormError } from "../../utils/handleFormError";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import { getSurvey, updateReducedLevels } from "../../services/surveyServices";
import { showAlert } from "../../redux/alertSlice";
import { Box, Stack, Typography, Paper, TextField, Button, Collapse, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";
import BasicInput from "../../components/BasicInput";
import BasicButton from "../../components/BasicButton";
import CrossSectionChart from "./components/CrossSectionChart";
import { v1ChartOptions, v2ChartOptions } from "../../constants";
import BasicMenu from "../../components/BasicMenu";
import { BsThreeDots } from "react-icons/bs";
import { MdDownload, MdOutlineAssessment, MdUpdate } from "react-icons/md";
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
  const [levelEdits, setLevelEdits] = useState({});
  const [savingLevels, setSavingLevels] = useState(false);
  const [openRowId, setOpenRowId] = useState(null);
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
  const [pdfPageLength, setPdfPageLength] = useState(300);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const validPdfPageLength = Number.isFinite(Number(pdfPageLength)) && Number(pdfPageLength) > 0;
  const [exportProgress, setExportProgress] = useState(null);
  const exportingRef = useRef(false);

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
      modeBarButtonsToRemove: ["select2d", "lasso2d", "toggleSpikelines", "toImage"],
    },
    layout: {
      ...chartOptions.layout,
      dragmode: "pan",
      ...(previewCs !== selectedCs && previewCs?.allRl?.length ? {
        yaxis: {
          ...chartOptions.layout?.yaxis,
          autorange: false,
          range: [Math.min(...previewCs.allRl) - 1, Math.max(...previewCs.allRl) + (Math.max(...previewCs.allRl) - Math.min(...previewCs.allRl)) * 0.2 + 1],
        },
      } : {}),
    },
  }), [chartOptions, previewCs, selectedCs]);

  const downloadPDF = async () => {
    if (!selectedCs || exportingRef.current || !validPdfPageLength) return;
    setPdfDialogOpen(false);
    exportingRef.current = true;
    setExportProgress({ percent: 0, message: "Preparing longitudinal pages..." });
    try {
      const pdf = await createLongitudinalPdf(selectedCs, drawingScales, chartOptions, pdfPageLength, setExportProgress);
      pdf.save("longitudinal-section.pdf");
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      exportingRef.current = false;
      setExportProgress(null);
    }
  };

  const handleMenuSelect = (item) => {
    if (item.value === "download") {
      if (selectedCs && !exportingRef.current) setPdfDialogOpen(true);
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
            data: source.row.reducedLevels.map((level, offsetIndex) => ({
              x: source.row.offsets[offsetIndex],
              y: (Number(level) + delta).toFixed(3),
            })),
          }];
        });
        if (!series.length) return;
        const { data } = await updateReducedLevels(id, { chainage: String(row.chainage), series });
        if (!data.success) throw Error("Failed to update longitudinal levels");
        // Preserve drafts for other chainages.
        setLevelEdits((previous) => {
          const remaining = { ...previous };
          row.sources.forEach((_, index) => delete remaining[`${row.id}-${index}`]);
          return remaining;
        });
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
      <Dialog open={pdfDialogOpen} onClose={() => setPdfDialogOpen(false)} fullWidth maxWidth="xs" aria-labelledby="pdf-download-title">
        <Box component="form" onSubmit={(event) => { event.preventDefault(); downloadPDF(); }}>
          <DialogTitle id="pdf-download-title">Download longitudinal PDF</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Range length per page (m)"
              type="number"
              size="small"
              value={pdfPageLength}
              onChange={(event) => setPdfPageLength(event.target.value)}
              inputProps={{ min: 0, step: "any" }}
              error={!validPdfPageLength}
              helperText={validPdfPageLength
                ? "Long profiles split automatically. Dense chainages may use shorter pages."
                : "Enter a range length greater than zero."}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setPdfDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!validPdfPageLength} startIcon={<MdDownload />}>Download PDF</Button>
          </DialogActions>
        </Box>
      </Dialog>
      <SmallHeader />
      <PageHeroHeader
        icon={MdOutlineAssessment}
        title="Longitudinal Section Report"
        subtitle="View the survey profile along the chainage."
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
            overflow: "hidden",
          }}
        >
          {/* Indigo left accent */}
          <Box sx={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", bgcolor: "#6366f1" }} />

          <Box
            sx={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box sx={{ width: "100%", p: { xs: 2, md: 3 }, border: "1px solid #e2e8f0", borderRadius: "20px", bgcolor: "#fff" }}>
              <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
                <Box textAlign="left">
                  <Typography variant="h6" sx={{ color: "#1e293b", fontWeight: 800 }}>Longitudinal profile</Typography>
                  <Typography variant="body2" color="text.secondary">View and adjust the drawing scale</Typography>
                </Box>
                <SectionScaleInputs scales={drawingScales} onChange={setDrawingScales} />
              </Stack>
              <WaterWayProposalNotice purposes={tableData} />
              {selectedCs && selectedCs?.series?.length && (
                <CrossSectionChart
                  drawingScales={drawingScales}
                  selectedCs={previewCs}
                  chartOptions={interactiveChartOptions}
                  pdfRef={pdfRef}
                />
              )}

            {/* Footer */}
            <Typography
              variant="caption"
              sx={{ display: "block", mt: 2, color: "text.secondary" }}
            >
              [Hor Scale 1:{drawingScales.horizontal} : Ver Scale 1:{drawingScales.vertical}]
            </Typography>
            </Box>
            {selectedCs?.levelRows?.length > 0 && (
              <Box sx={{ width: "100%", mt: 2, textAlign: "left" }}>
                <Typography
                  id="ls-chainage-details"
                  component="h2"
                  sx={{ px: 2, py: 2, fontWeight: 700, fontSize: "0.875rem", color: "#1e293b", bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "16px 16px 0 0" }}
                >
                  Chainage details
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>
                  {canEditLevels
                    ? "Changing an LS value shifts the cross-section reduced levels at that chainage by the same amount."
                    : "Editing is available only when the LS report is generated with exactly two levels."}
                </Typography>
                <TableContainer sx={{ maxHeight: 440, overflowX: "auto", border: "1px solid #e2e8f0", borderTop: 0, borderRadius: "0 0 16px 16px" }}>
                  <Table aria-labelledby="ls-chainage-details" sx={{ tableLayout: "fixed", "& th, & td": { borderColor: "#e2e8f0" } }}>
                    <TableBody>
                      {selectedCs.levelRows.map((row, index) => (
                        <Fragment key={row.id ?? index}>
                          <TableRow sx={{ "&:hover": { bgcolor: "#f8f9ff" } }}>
                            <TableCell sx={{ py: 1 }}>
                              <BasicButton
                                value={row.chainage}
                                variant="outlined"
                                aria-expanded={openRowId === row.id}
                                onClick={() => setOpenRowId(openRowId === row.id ? null : row.id)}
                                sx={{ py: 1, px: 2, border: "1px solid #c7d2fe", borderRadius: "10px", bgcolor: openRowId === row.id ? "#eef2ff" : "#fff", color: "#4f46e5", fontWeight: 700, "&:hover": { bgcolor: "#eef2ff", color: "#4f46e5" } }}
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ py: 0 }}>
                              <Collapse in={openRowId === row.id} timeout="auto" unmountOnExit>
                                <Table size="small" aria-label={`Levels at chainage ${row.chainage}`}>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell component="th" scope="col" sx={{ bgcolor: "#f8fafc", fontWeight: 600, borderRight: "1px solid #e2e8f0" }}>Chainage</TableCell>
                                      {selectedCs.series.map((series, seriesIndex) => (
                                        <TableCell component="th" scope="col" key={seriesIndex} align="center" sx={{ color: series.color, fontWeight: 600, whiteSpace: "nowrap" }}>{series.name} (RL)</TableCell>
                                      ))}
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row" sx={{ borderRight: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{row.chainage}</TableCell>
                          {row.levels.map((level, levelIndex) => {
                            const key = `${row.id}-${levelIndex}`;
                            const value = levelEdits[key] ?? (Number.isFinite(level) ? level.toFixed(3) : "N/A");
                            const sourceLevels = row.sources[levelIndex]?.row?.reducedLevels;
                            const editable = canEditLevels && Number.isFinite(level) && sourceLevels?.length > 0
                              && sourceLevels.every((entry) => String(entry ?? "").trim() !== "" && Number.isFinite(Number(entry)));
                            const invalid = editable && (String(value).trim() === "" || !Number.isFinite(Number(value)));
                            return (
                              <TableCell key={levelIndex} sx={{ p: 1 }}>
                                <BasicInput
                                  type={editable ? "number" : "text"}
                                  value={value}
                                  disabled={!editable || savingLevels}
                                  error={invalid ? "Enter a valid level" : ""}
                                  inputProps={{ step: "0.001", "aria-label": `${selectedCs.series[levelIndex].name} at chainage ${row.chainage}` }}
                                  sx={{ minWidth: 100, color: selectedCs.series[levelIndex].color, borderColor: { green: "#bbf7d0", blue: "#bfdbfe", red: "#fecaca" }[selectedCs.series[levelIndex].color] }}
                                  onChange={(event) => setLevelEdits((previous) => ({ ...previous, [key]: event.target.value }))}
                                />
                              </TableCell>
                            );
                          })}
                                    </TableRow>
                                  </TableBody>
                                </Table>
                                <Box sx={{ py: 2, px: 2 }}>
                                  <BasicButton
                                    value="Update"
                                    fullWidth
                                    startIcon={<MdUpdate size={18} />}
                                    disabled={!canEditLevels || savingLevels || getRowEditState(row).invalid || !getRowEditState(row).dirty}
                                    onClick={() => handleUpdateLevels(row)}
                                    sx={{ py: 1.25, bgcolor: "#6366f1", color: "white", "&:hover": { bgcolor: "#4f46e5" } }}
                                  />
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default LongitudinalSectionReport;
