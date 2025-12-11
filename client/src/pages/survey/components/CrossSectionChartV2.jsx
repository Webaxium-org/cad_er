import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import Plot from 'react-plotly.js';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useEffect, useRef, useState } from 'react';

const colors = {
  Initial: 'green',
  Proposed: 'blue',
  Final: 'red',
};

const CrossSectionChartV2 = ({ selectedCs, chartOptions, download }) => {
  const pdfRef = useRef();

  const [width, setWidth] = useState(window.innerWidth);

  const downloadPDF = async () => {
    // Let ApexCharts finish rendering
    await new Promise((res) => setTimeout(res, 300));

    const element = pdfRef.current;
    if (!element) return;

    // Capture screenshot
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      scrollX: 0,
      scrollY: -window.scrollY,
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();

    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('cross-section.pdf');
  };

  const calcWidth = () => {
    const length = selectedCs?.chainages?.length ?? selectedCs?.offsets?.length;

    const isWidth = width > length * 90;

    return isWidth ? width - 30 : length * 90 - 70;
  };

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return chartOptions.id === 'v2' ? (
    <TableContainer
      component={Paper}
      sx={{
        mt: 0,
        bgcolor: 'transparent',
        overflowX: 'auto',
      }}
    >
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell
              sx={{
                border: 'none',
                bgcolor: 'white',
                position: 'sticky',
                left: 0,
                zIndex: 10,
              }}
            ></TableCell>

            <TableCell
              sx={{ border: 'none', px: '14px', bgcolor: 'transparent' }}
              colSpan={(selectedCs?.offsets ?? selectedCs?.chainages)?.length}
            >
              <Box
                sx={{
                  height: 100,
                  width: '100%',
                  display: 'flex',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: '5px',
                    left: '20.5px',
                  }}
                  maxWidth={'calc(100% - 30px)'}
                  maxHeight={'100px'}
                >
                  <Plot
                    data={selectedCs?.series?.map((s) => ({
                      x: s?.data?.map((p) => p.x),
                      y: s?.data?.map((p) => p.y),
                      type: 'scatter',
                      mode: 'lines',
                      line: { shape: 'linear', width: 1, color: s.color },
                    }))}
                    config={chartOptions.config}
                    layout={chartOptions.layout}
                    style={{ width: `${calcWidth() + 5}px`, height: 100 }}
                  />
                </Box>
              </Box>
            </TableCell>
          </TableRow>
          {console.log(selectedCs)}
          {selectedCs?.series?.length &&
            selectedCs.series.map((s, idx) => (
              <TableRow key={idx}>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    border: '1px solid black',
                    position: 'sticky',
                    left: 0,
                    zIndex: 6,
                    backgroundColor: 'white',
                    boxShadow: 'inset -1px 0 0 0 black',
                  }}
                >
                  {s.name}
                </TableCell>

                {selectedCs?.offsets?.map((o, i) => (
                  <TableCell
                    key={i}
                    align="center"
                    sx={{
                      position: 'relative',
                      color:
                        colors[
                          s.name?.includes('Initial')
                            ? 'Initial'
                            : s.name?.includes('Proposed')
                            ? 'Proposed'
                            : 'Final'
                        ],
                      fontWeight: 500,
                      height: '85px',
                      overflow: 'visible',
                      border: '1px solid black',
                      p: 0,
                      width: '90px',
                      minWidth: '90px',
                      maxWidth: '90px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {s?.data
                        ?.filter((val) => val.x === o)
                        .map((val, idx) => (
                          <div
                            key={idx}
                            style={{ transform: 'rotate(-90deg)' }}
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
                fontWeight: 'bold',
                border: '1px solid black',
                position: 'sticky',
                left: 0,
                zIndex: 6,
                backgroundColor: 'white',
                boxShadow: 'inset -1px 0 0 0 black',
              }}
            >
              {selectedCs?.offsets ? 'Offset' : 'Chainage'}
            </TableCell>

            {(selectedCs?.offsets ?? selectedCs?.chainages)?.map((val, i) => (
              <TableCell
                key={i}
                align="center"
                sx={{
                  position: 'relative',
                  color: 'green',
                  fontWeight: 500,
                  height: '85px',
                  overflow: 'visible',
                  border: '1px solid black',
                  p: 0,
                  width: '90px',
                  minWidth: '90px',
                  maxWidth: '90px',
                }}
              >
                <div style={{ rotate: '-90deg' }}>{Number(val).toFixed(3)}</div>
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
          bgcolor: 'transparent',
          overflowX: 'auto',
        }}
      >
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableBody>
            {/* CHART ROW */}
            <TableRow>
              <TableCell sx={{ border: 'none', p: 0 }}>
                <Box maxWidth={`${calcWidth()}px`} height="300px">
                  <Plot
                    data={selectedCs?.series?.map((s) => ({
                      x: s?.data?.map((p) => p.x),
                      y: s?.data?.map((p) => p.y),
                      type: 'scatter',
                      mode: 'lines',
                      line: { shape: 'linear', width: 1, color: s.color },
                    }))}
                    config={chartOptions.config}
                    layout={chartOptions.layout}
                    style={chartOptions.style}
                  />
                </Box>

                <Box display="flex" justifyContent={'center'} gap={2} px={2}>
                  <Typography fontSize="12px" mr={0.5}>
                    Datum: {selectedCs?.datum}
                  </Typography>

                  {selectedCs?.series?.map((s, idx) => {
                    const color =
                      colors[
                        s.name?.includes('Initial')
                          ? 'Initial'
                          : s.name?.includes('Proposed')
                          ? 'Proposed'
                          : 'Final'
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
                            borderRadius: '50%',
                            backgroundColor: color,
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </TableCell>
            </TableRow>

            {/* LEVEL / DIST ROWS */}
            {selectedCs?.series?.map((s, idx) => {
              // detect color for series
              const color =
                colors[
                  s.name?.includes('Initial')
                    ? 'Initial'
                    : s.name?.includes('Proposed')
                    ? 'Proposed'
                    : 'Final'
                ];

              return (
                <TableRow key={idx} sx={{ display: 'none' }}>
                  <TableCell sx={{ border: 'none', p: 0 }}>
                    <Stack direction="row" width="fit-content">
                      {/* Name column */}
                      <Typography
                        color={color}
                        fontSize="12px"
                        sx={{
                          minWidth: '90px',
                          maxWidth: '90px',
                          textAlign: 'right',
                          pr: 1,
                          flexShrink: 0,
                        }}
                      >
                        {s.name}
                      </Typography>

                      {/* Data section */}
                      <Box
                        sx={{
                          position: 'relative',
                          height: '80px',
                          flexShrink: 0,
                          minWidth: `
                          ${calcWidth() - 74}px`,
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '10px',
                            left: 0,
                            right: 0,
                            height: '2px',
                            backgroundColor: color,
                          }}
                        />

                        <Box
                          sx={{
                            position: 'absolute',
                            top: '28px',
                            left: 0,
                            right: 0,
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                          }}
                        >
                          {s.data.map((val, i) => (
                            <Typography
                              key={i}
                              fontSize="12px"
                              sx={{ transform: 'rotate(-90deg)', color }}
                            >
                              {val[1]}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default CrossSectionChartV2;
