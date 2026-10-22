import Plot from "react-plotly.js";
import SectionLevelBands from "./SectionLevelBands";
import useSectionBandLayout from "./useSectionBandLayout";
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

const CrossSectionChartV2 = ({ selectedCs, chartOptions, showLevelBands = false }) => {
  const [bandLayout, updateBandLayout] = useSectionBandLayout(showLevelBands);
  return (
    <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <Box sx={{ bgcolor: "transparent", width: "100%", minWidth: 0 }}>
        <Typography fontSize="12px" textAlign={"center"}>
          CHAINAGE {selectedCs?.chainage}
        </Typography>
        <Stack
          alignItems={"end"}
          sx={{ width: "100%", mx: "auto" }}
        >
          <Typography fontSize="8px">SCALE X- 1:100</Typography>
          <Typography fontSize="8px">SCALE Y- 1:100</Typography>
        </Stack>
        <TableContainer component={Paper} sx={{ width: "100%", maxWidth: "100%" }}>
          <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableBody>
              {/* CHART ROW */}
              <TableRow>
                <TableCell sx={{ border: "none", p: 0, width: "100%" }}>
                  <Box
                    sx={{
                      width: "100%",
                      height: "250px",
                      mb: 2,
                      mx: "auto",
                    }}
                  >
                    <Plot
                      onInitialized={updateBandLayout}
                      onUpdate={updateBandLayout}
                      data={selectedCs?.series?.map((s) => ({
                        x: s?.data?.map((p) => p.x),
                        y: s?.data?.map((p) => p.y),
                        type: "scatter",
                        mode: "lines",
                        name: s.name,
                        line: { shape: "linear", width: 1, color: s.color },
                      }))}
                      config={{
                        ...chartOptions.config,
                        displayModeBar: false,
                      }}
                      layout={chartOptions.layout}
                      useResizeHandler
                      style={{
                        ...chartOptions.style,
                        width: "100%",
                        height: "250px",
                      }}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        {showLevelBands && <SectionLevelBands section={selectedCs} layout={bandLayout} />}
      </Box>
    </Box>
  );
};

export default CrossSectionChartV2;
