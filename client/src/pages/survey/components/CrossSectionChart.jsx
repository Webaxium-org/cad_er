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
import Chart from 'react-apexcharts';

import { IoMdDownload } from 'react-icons/io';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useEffect, useRef, useState } from 'react';
import BasicDivider from '../../../components/BasicDevider';

const colors = {
  Initial: 'green',
  Proposed: 'blue',
  Final: 'red',
};

const CrossSectionChart = ({ selectedCs, chartOptions, download }) => {
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
    const isWidth = width > length * 60;

    return isWidth ? width - 30 : length * 60 - 20;
  };

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return chartOptions.chart.id === 'cross-section' ? (
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
              colSpan={(selectedCs?.offsets ?? selectedCs.chainages)?.length}
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
                    width: 'calc(100% - 30px)',
                    height: 100,
                    position: 'absolute',
                    top: '5px',
                    left: '7.5px',
                  }}
                >
                  <Chart
                    key={selectedCs.id}
                    options={chartOptions}
                    series={selectedCs?.series || []}
                    type="line"
                    height="100%"
                    width="100%"
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

                {s.data?.map((val, i) => (
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
                    <div style={{ rotate: '-90deg' }}>{val[1]}</div>
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

            {(selectedCs?.offsets ?? selectedCs.chainages)?.map((val, i) => (
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
                <Box minWidth={`${calcWidth()}px`} ml="37px" height="300px">
                  <Chart
                    key={selectedCs.id}
                    options={chartOptions}
                    series={selectedCs?.series || []}
                    type="line"
                    height="100%"
                    width="100%"
                  />
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
                <TableRow key={idx}>
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

export default CrossSectionChart;
