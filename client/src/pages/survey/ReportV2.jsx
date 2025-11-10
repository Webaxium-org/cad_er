import { useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { handleFormError } from '../../utils/handleFormError';
import { startLoading, stopLoading } from '../../redux/loadingSlice';
import { getSurvey } from '../../services/surveyServices';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

const initialChartOptions = {
  chart: {
    id: 'cross-section',
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  colors: ['blue', 'green'],
  grid: {
    show: false,
  },
  xaxis: {
    type: 'numeric',
    labels: { show: false },
    axisTicks: { show: false },
    axisBorder: { show: false },
  },
  yaxis: {
    min: 0,
    labels: { show: false },
    axisTicks: { show: false },
    axisBorder: { show: true, color: '#000000' },
  },
  legend: { show: false },
  tooltip: { enabled: false },
};

const ReportV2 = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const dispatch = useDispatch();

  const { global } = useSelector((state) => state.loading);

  const [chartOptions, setChartOptions] = useState(initialChartOptions);

  const [survey, setSurvey] = useState([]);

  const [selectedCs, setSelectedCs] = useState(null);

  const handleClickCs = (id) => {
    if (selectedCs?.id === id) return;

    const initialLevel = survey.purposes?.find(
      (p) => p.type === 'Initial Level'
    );
    if (!initialLevel) return;

    const row = initialLevel.rows?.find((row) => row._id === id);
    if (!row) return;

    let gsbProposal = [];

    const proposedLevel = survey.purposes?.find(
      (p) => p.type === 'Proposed Level'
    );

    if (proposedLevel) {
      const propRow = proposedLevel.rows?.find(
        (r) => r.chainage === row.chainage
      );

      if (propRow) {
        gsbProposal = propRow?.intermediateSight || [];
      }
    }

    const safeOffsets = row.offsets || [];
    const safeInitial = row.intermediateSight || [];
    const safeGSB = gsbProposal?.slice(0, safeOffsets.length);

    const data = {
      id: id,
      datum: 9.4,
      gsb: safeGSB,
      initial: safeInitial,
      offsets: safeOffsets,
      chainage: row.chainage,
      series: [
        {
          name: 'GSB Prop. Level',
          data: safeOffsets.map((x, i) => [Number(x), safeGSB[i]]),
        },
        {
          name: 'Initial Level',
          data: safeOffsets.map((x, i) => [Number(x), Number(safeInitial[i])]),
        },
      ],
    };

    setSelectedCs(data);
  };

  const fetchSurvey = async () => {
    try {
      if (!global) {
        dispatch(startLoading());
      }

      const { data } = await getSurvey(id);

      if (data.success) {
        setSurvey(data.survey || []);
      } else {
        throw Error('Failed to fetch survey');
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
    if (survey) {
      const initialLevel = survey?.purposes?.find(
        (p) => p.type === 'Initial Level'
      );

      if (!initialLevel) return;

      const row = initialLevel.rows?.find((row) => row.type === 'Chainage');

      if (row) handleClickCs(row._id);
    }
  }, [survey]);

  return (
    <Box
      sx={{
        textAlign: 'center',
        mt: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {selectedCs && selectedCs?.series && (
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
            <Box
              sx={{ width: 198, height: 100, position: 'absolute', top: '5px' }}
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
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      borderRight: '1px solid black',
                      width: '40%',
                    }}
                  >
                    GSB Prop. Level
                  </TableCell>
                  {selectedCs?.gsb?.map((val, i) => (
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

                {/* Initial Level Row */}
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      borderRight: '1px solid black',
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
      )}

      <TableContainer
        component={Paper}
        sx={{
          maxWidth: 420,
          border: '1px solid black',
          mt: 2,
          overflow: 'visible',
        }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Chainage</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>CS</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>LS</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {survey?.purposes
              ?.find((p) => p.type === 'Initial Level')
              ?.rows?.map(
                (row, index) =>
                  row.type === 'Chainage' && (
                    <TableRow key={index}>
                      <TableCell>{row.chainage}</TableCell>
                      <TableCell
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleClickCs(row._id)}
                      >
                        View
                      </TableCell>
                      <TableCell>N/A</TableCell>
                    </TableRow>
                  )
              )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ReportV2;
