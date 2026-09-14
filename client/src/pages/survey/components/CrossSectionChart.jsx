import SectionSheet from "./SectionSheet";
import Plot from "react-plotly.js";
import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";

const colors = {
  Initial: "green",
  Proposed: "blue",
  Final: "red",
};

const CrossSectionChart = ({ selectedCs, chartOptions, pdfRef, drawingScales }) => {
  const [width, setWidth] = useState(window.innerWidth);

  const calcWidth = () => {
    const effectiveWidth = Math.min(width, 794);
    const isLs = selectedCs.type === "ls";

    const length = isLs
      ? selectedCs?.chainages?.length
      : selectedCs?.offsets?.length;

    const subtractValue = isLs ? 30 : 70;

    const isWidth = effectiveWidth > length * 90;

    return isWidth ? effectiveWidth - 30 : length * 90 - subtractValue;
  };

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return chartOptions.id === "v2" ? (
    <TableContainer
      component={Paper}
      sx={{
        mt: 0,
        bgcolor: "transparent",
        overflowX: "auto",
      }}
      ref={pdfRef}
    >
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell
              sx={{
                border: "none",
                bgcolor: "white",
                position: "sticky",
                left: 0,
                zIndex: 10,
              }}
            ></TableCell>

            <TableCell
              sx={{ border: "none", px: "14px", bgcolor: "transparent" }}
              colSpan={
                (selectedCs.type === "ls"
                  ? selectedCs?.chainages
                  : selectedCs?.offsets
                )?.length
              }
            >
              <Box
                sx={{
                  height: 100,
                  width: "100%",
                  display: "flex",
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: "5px",
                    left: "20.5px",
                  }}
                  maxWidth={"calc(100% - 30px)"}
                  maxHeight={"100px"}
                >
                  <Plot
                    data={selectedCs?.series?.map((s) => ({
                      x: [...(s.data || [])].sort((a, b) => Number(a.x) - Number(b.x)).map((p) => Number(p.x)),
                      y: [...(s.data || [])].sort((a, b) => Number(a.x) - Number(b.x)).map((p) => p.y === null ? null : Number(p.y)),
                      type: "scatter",
                      mode: "lines",
                      name: s.name,
                      line: { shape: "linear", width: 1, color: s.color },
                    }))}
                    config={chartOptions.config}
                    layout={chartOptions.layout}
                    style={{ width: `${calcWidth() + 5}px`, height: 100 }}
                  />
                </Box>
              </Box>
            </TableCell>
          </TableRow>
          {selectedCs?.series?.length &&
            selectedCs.series.map((s, idx) => (
              <TableRow key={idx}>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    border: "1px solid black",
                    position: "sticky",
                    left: 0,
                    zIndex: 6,
                    backgroundColor: "white",
                    boxShadow: "inset -1px 0 0 0 black",
                  }}
                >
                  {s.name}
                </TableCell>

                {(selectedCs.type === "ls"
                  ? selectedCs?.chainages
                  : selectedCs?.offsets
                )?.map((o, i) => (
                  <TableCell
                    key={i}
                    align="center"
                    sx={{
                      position: "relative",
                      color:
                        colors[
                          s.name?.includes("Initial")
                            ? "Initial"
                            : s.name?.includes("Proposed")
                            ? "Proposed"
                            : "Final"
                        ],
                      fontWeight: 500,
                      height: "85px",
                      overflow: "visible",
                      border: "1px solid black",
                      p: 0,
                      width: "90px",
                      minWidth: "90px",
                      maxWidth: "90px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {s?.data
                        ?.filter((val) => val.x === o)
                        .map((val, idx) => (
                          <div
                            key={idx}
                            style={{ transform: "rotate(-90deg)" }}
                          >
                            {Number(val.y).toFixed(3)}
                          </div>
                        ))}
                    </div>

                    <div className="cs-table-vertical-line" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          <TableRow>
            <TableCell
              sx={{
                fontWeight: "bold",
                border: "1px solid black",
                position: "sticky",
                left: 0,
                zIndex: 6,
                backgroundColor: "white",
                boxShadow: "inset -1px 0 0 0 black",
              }}
            >
              {selectedCs?.offsets ? "Offset" : "Chainage"}
            </TableCell>

            {(selectedCs.type === "ls"
              ? selectedCs?.chainages
              : selectedCs?.offsets
            )?.map((val, i) => (
              <TableCell
                key={i}
                align="center"
                sx={{
                  position: "relative",
                  color: "green",
                  fontWeight: 500,
                  height: "85px",
                  overflow: "visible",
                  border: "1px solid black",
                  p: 0,
                  width: "90px",
                  minWidth: "90px",
                  maxWidth: "90px",
                }}
              >
                <div style={{ rotate: "-90deg" }}>{Number(val).toFixed(3)}</div>
                <div className="cs-table-vertical-line" />
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  ) : (
    <>
      <TableContainer
        component={Paper}
        sx={{
          mt: 0,
          width: "100%",
          bgcolor: "transparent",
          overflowX: "auto",
        }}
      >
        <Table size="small" sx={{ tableLayout: "fixed" }}>
          <TableBody>
            {/* CHART ROW */}
            <TableRow>
              <TableCell sx={{ border: "none", p: 0 }}>
                <Box width="100%" height="250px">
                  <Plot
                    data={selectedCs?.series?.map((s) => ({
                      x: [...(s.data || [])].sort((a, b) => Number(a.x) - Number(b.x)).map((p) => Number(p.x)),
                      y: [...(s.data || [])].sort((a, b) => Number(a.x) - Number(b.x)).map((p) => p.y === null ? null : Number(p.y)),
                      type: "scatter",
                      mode: "lines",
                      name: s.name,
                      line: { shape: "linear", width: 1, color: s.color },
                    }))}
                    config={chartOptions.config}
                    layout={chartOptions.layout}
                    useResizeHandler
                    style={{ ...chartOptions.style, width: "100%" }}
                  />
                </Box>

                <Box display="flex" justifyContent={"center"} gap={2} px={2}>
                  <Typography fontSize="12px" mr={0.5}>
                    Datum: {selectedCs?.datum}
                  </Typography>

                  {selectedCs?.series?.map((s, idx) => {
                    const color =
                      colors[
                        s.name?.includes("Initial")
                          ? "Initial"
                          : s.name?.includes("Proposed")
                          ? "Proposed"
                          : "Final"
                      ];

                    return (
                      <Box
                        key={idx}
                        display="flex"
                        alignItems="center"
                        mb={0.5}
                      >
                        <Typography fontSize="12px" mr={0.5}>
                          {s.name}
                        </Typography>

                        {/* Colored dot */}
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: color,
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, width: "100%" }} ref={pdfRef}>
        <SectionSheet section={selectedCs} scales={drawingScales} />
      </Box>
    </>
  );
};

export default CrossSectionChart;
