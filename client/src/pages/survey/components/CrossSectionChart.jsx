import {
  Box,
  Button,
  Paper,
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
import { useRef } from 'react';

const colors = {
  Initial: 'green',
  Proposed: 'blue',
  Final: 'red',
};

const CrossSectionChart = ({ selectedCs, chartOptions, download, title }) => {
  const pdfRef = useRef();

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
  return (
    <>
      <>
        {/* Table */}
        <TableContainer
          component={Paper}
          sx={{
            mt: 0,
            bgcolor: 'transparent',
          }}
        >
          <Box textAlign={'end'} p={2}>
            {download && (
              <Button variant="contained" onClick={downloadPDF} sx={{ mb: 2 }}>
                <IoMdDownload />
              </Button>
            )}
          </Box>

          <Box ref={pdfRef} textAlign={'center'}>
            {/* Header */}
            <Typography
              variant="h6"
              fontWeight="bold"
              textTransform="uppercase"
            >
              {title
                ? title
                : `CROSS SECTION AT CHAINAGE ${selectedCs?.chainage}`}
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
              Datum: {selectedCs.datum}
            </Typography>

            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell
                    sx={{ border: 'none', bgcolor: 'transparent' }}
                  ></TableCell>
                  <TableCell
                    sx={{ border: 'none', px: '14px', bgcolor: 'transparent' }}
                    colSpan={
                      (selectedCs?.offsets ?? selectedCs.chainages)?.length
                    }
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
                          width: '100%',
                          height: 100,
                          position: 'absolute',
                          top: '5px',
                          left: '-6.5px',
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
                            height: '55px',
                            overflow: 'visible',
                            border: '1px solid black',
                            p: 0,
                            minWidth: '60px',
                          }}
                        >
                          <div style={{ rotate: '-90deg' }}>{val[1]}</div>
                          <div className="cs-table-vertical-line" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {/* Offset Row */}
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      border: '1px solid black',
                    }}
                  >
                    {selectedCs?.offsets ? 'Offset' : 'Chainage'}
                  </TableCell>
                  {(selectedCs?.offsets ?? selectedCs.chainages)?.map(
                    (val, i) => (
                      <TableCell
                        key={i}
                        align="center"
                        sx={{
                          position: 'relative',
                          color: 'green',
                          fontWeight: 500,
                          height: '55px',
                          overflow: 'visible',
                          border: '1px solid black',
                          p: 0,
                        }}
                      >
                        <div style={{ rotate: '-90deg' }}>
                          {Number(val).toFixed(3)}
                        </div>
                        <div className="cs-table-vertical-line" />
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </TableContainer>

        {/* Footer */}
        <Typography
          variant="caption"
          sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}
        >
          [Hor Scale – 1 in 150 : Ver Scale – 1 in 150]
        </Typography>
      </>
    </>
  );
};

export default CrossSectionChart;
