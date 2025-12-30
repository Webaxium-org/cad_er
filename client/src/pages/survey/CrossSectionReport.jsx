import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
import { MdDownload } from "react-icons/md";
import { showAlert } from "../../redux/alertSlice";

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

const inputColors = {
  green: { borderColor: "#00800081", color: "#008000" },
  blue: { borderColor: "#0000ff8a", color: "#0000FF" },
  red: { borderColor: "#ff000085", color: "#FF0000" },
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

  const [openRowId, setOpenRowId] = useState(null);

  const [selectedMenu, setSelectedMenu] = useState("v1");

  const handleToggle = (rowId) => {
    setOpenRowId((prev) => (prev === rowId ? null : rowId));
  };

  const downloadPDF = async () => {
    if (!pdfRef.current) return;

    await new Promise((res) => setTimeout(res, 300));

    const canvas = await html2canvas(pdfRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("l", "mm", "a5");

    const margin = 10;
    const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;

    const imgRatio = canvas.width / canvas.height;
    const pageRatio = pageWidth / pageHeight;

    let imgWidth, imgHeight;

    if (imgRatio > pageRatio) {
      imgWidth = pageWidth;
      imgHeight = imgWidth / imgRatio;
    } else {
      imgHeight = pageHeight;
      imgWidth = imgHeight * imgRatio;
    }

    const x = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
    const y = (pdf.internal.pageSize.getHeight() - imgHeight) / 2;

    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    pdf.save("cross-section.pdf");
  };

  const handleMenuSelect = (item) => {
    if (item.value === "download") return downloadPDF();

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
    const data = [];

    if (state && state?.selectedPurposeIds?.length) {
      state?.selectedPurposeIds?.forEach((entry) => {
        data.push(
          survey?.purposes?.find((p) => String(p._id) === String(entry))
        );
      });
    } else {
      data.push(survey?.purposes?.find((p) => p.type === "Initial Level"));
    }

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
    const uniqueOffsets = [...new Set(rawOffsets.map((n) => n))].sort(
      (a, b) => a - b
    );

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
        const y = Number(levels?.[i] ?? 0).toFixed(3);
        data.allRl.push(y);

        return {
          x: Number(o).toFixed(3),
          y,
        };
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
          const num = Number(o).toFixed(3);
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

    // Add initial (original)
    data.series.push({
      _id: row._id,
      purpose: initialEntry._id,
      name: initialEntry.type,
      color: getColor(initialEntry.type),
      data: makeSeries(rawOffsets, safeInitial),
    });

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
              idx === rlIndex ? value : rl
            ),
          };
        }),
      }))
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
          })
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
    <Box p={2}>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
        spacing={2}
        mb={2}
      >
        <Typography variant="h6" fontSize={18} fontWeight={700} align="center">
          CROSS SECTION AT CH {selectedCs?.chainage}
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

      <Stack direction={"row"} spacing={2} mb={2}>
        <Box>
          <Typography
            variant="body2"
            sx={{
              mb: 0.5,
              fontWeight: 600,
              color: "black",
            }}
          >
            Horizontal Scale X
          </Typography>
          <Stack direction={"row"} spacing={1}>
            <BasicInput label={""} placeholder={"1"} />
            <BasicInput label={""} placeholder={"100"} value={""} />
          </Stack>
        </Box>
        <Box>
          <Typography
            variant="body2"
            sx={{
              mb: 0.5,
              fontWeight: 600,
              color: "black",
            }}
          >
            Vertical Scale Y
          </Typography>
          <Stack direction={"row"} spacing={1}>
            <BasicInput label={""} placeholder={"1"} />
            <BasicInput
              label={""}
              placeholder={"100"}
              value={maxValue || ""}
              onChange={(e) => handleInputChange(e.target.value)}
            />
          </Stack>
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
        {selectedCs && selectedCs?.series && chartOptions && (
          <CrossSectionChart
            selectedCs={selectedCs}
            chartOptions={chartOptions}
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
          Chainage
        </Box>

        <TableContainer
          component={Paper}
          sx={{
            maxHeight: 440,
            overflowX: "auto", // 👈 REQUIRED
            borderRadius: 0,
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
                            sx={{ py: 1, px: 2, cursor: "pointer" }}
                            onClick={() => handleTableToggle(row._id)}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          style={{
                            paddingBottom: 0,
                            paddingTop: 0,
                            paddingLeft: 100,
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
                                  <TableCell>Offset</TableCell>
                                  {selectedCs?.series?.map((s) => (
                                    <TableCell
                                      key={s._id}
                                      align="center"
                                      sx={{ color: s.color, fontWeight: 600 }}
                                    >
                                      {s.name}
                                    </TableCell>
                                  ))}
                                </TableRow>
                                {selectedCs?.offsets?.map((offset) => (
                                  <TableRow key={offset}>
                                    {/* Offset Column */}
                                    <TableCell>
                                      {Number(offset).toFixed(3)}
                                    </TableCell>

                                    {/* Series Columns */}
                                    {selectedCs?.series?.map((s) => {
                                      const idx = s.data?.findIndex(
                                        (d) => d?.x === offset
                                      );
                                      const cellData =
                                        idx > -1 ? s.data[idx] : null;

                                      return (
                                        <TableCell key={s._id} sx={{ p: 1 }}>
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
                                                  inputColors[s.color]?.color,
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
                                                  e.target.value
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
                                                  inputColors[s.color]?.color,
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
                  )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default CrossSectionReport;
