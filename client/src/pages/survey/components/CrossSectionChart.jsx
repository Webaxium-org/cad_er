import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import Chart from 'react-apexcharts';

const CrossSectionChart = ({ selectedCs, chartOptions }) => {
  return (
    <Box>
      {/* Header */}
      <Typography variant="h6" fontWeight="bold" textTransform="uppercase">
        CROSS SECTION AT CHAINAGE {selectedCs?.chainage}
      </Typography>
      <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
        Datum: {selectedCs.datum}
      </Typography>

      {/* Chart */}
      <Box
        sx={{
          width: 390,
          height: 100,
          mt: 1,
          display: 'flex',
          justifyContent: 'end',
          position: 'relative',
        }}
      >
        <Box sx={{ width: 198, height: 100, position: 'absolute', top: '5px' }}>
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

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          width: 420,
          border: '1px solid black',
          mt: 0,
          overflow: 'visible',
        }}
      >
        <Table size="small">
          <TableBody>
            {/* GSB Row */}

            {selectedCs?.proposal?.length > 1 && (
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    borderRight: '1px solid black',
                    width: '40%',
                  }}
                >
                  Prop. Level
                </TableCell>
                {selectedCs?.proposal?.map((val, i) => (
                  <TableCell
                    key={i}
                    align="center"
                    sx={{
                      position: 'relative',
                      color: 'blue',
                      fontWeight: 500,
                      height: '55px',
                      overflow: 'visible',
                      p: 0,
                    }}
                  >
                    <div style={{ rotate: '-90deg' }}>{val}</div>
                    <div className="cs-table-vertical-line" />
                  </TableCell>
                ))}
              </TableRow>
            )}

            {/* Initial Level Row */}
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 'bold',
                  borderRight: '1px solid black',
                  width: '40%',
                }}
              >
                Initial Level
              </TableCell>
              {selectedCs?.initial?.map((val, i) => (
                <TableCell
                  key={i}
                  align="center"
                  sx={{
                    position: 'relative',
                    color: 'green',
                    fontWeight: 500,
                    height: '55px',
                    overflow: 'visible',
                    p: 0,
                  }}
                >
                  <div style={{ rotate: '-90deg' }}>{val}</div>
                  <div className="cs-table-vertical-line" />
                </TableCell>
              ))}
            </TableRow>

            {/* Offset Row */}
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 'bold',
                  borderRight: '1px solid black',
                }}
              >
                Offset
              </TableCell>
              {selectedCs?.offsets?.map((val, i) => (
                <TableCell
                  key={i}
                  align="center"
                  sx={{
                    position: 'relative',
                    color: 'green',
                    fontWeight: 500,
                    height: '55px',
                    overflow: 'visible',
                    p: 0,
                  }}
                >
                  <div style={{ rotate: '-90deg' }}>{val}</div>
                  <div className="cs-table-vertical-line" />
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer */}
      <Typography
        variant="caption"
        sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}
      >
        [Hor Scale – 1 in 150 : Ver Scale – 1 in 150]
      </Typography>
    </Box>
  );
};

export default CrossSectionChart;
