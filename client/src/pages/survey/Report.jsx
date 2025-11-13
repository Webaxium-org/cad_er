import { useEffect, useMemo, useState } from 'react';
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
import CrossSectionChart from './components/CrossSectionChart';
import { calculateReducedLevel, initialChartOptions } from '../../constants';

const Report = () => {
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

    let proposal = [];

    const proposedLevel = survey.purposes?.find(
      (p) => p.type === 'Proposed Level'
    );

    const safeOffsets = row.offsets || [];
    const safeInitial = row.reducedLevels || [];

    const data = {
      id: id,
      datum: 9.4,
      initial: safeInitial,
      offsets: safeOffsets,
      chainage: row.chainage,
      series: [],
    };

    if (proposedLevel) {
      const propRow = proposedLevel.rows?.find(
        (r) => r.chainage === row.chainage
      );

      if (propRow) {
        proposal = propRow?.reducedLevels || [];
      }

      const safeProposal = proposal?.slice(0, safeOffsets.length);

      data.proposal = safeProposal;
      data.series.push({
        name: proposedLevel.type,
        data: safeOffsets.map((x, i) => [Number(x), safeProposal[i]]),
      });
    }

    data.series.push({
      name: 'Initial Level',
      data: safeOffsets.map((x, i) => [Number(x), Number(safeInitial[i])]),
    });

    setSelectedCs(data);
  };

  const fetchSurvey = async () => {
    try {
      if (!global) dispatch(startLoading());
      const { data } = await getSurvey(id);

      if (data.success) {
        const surveyWithRL = calculateReducedLevel(data.survey);

        setSurvey(surveyWithRL);
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
        <CrossSectionChart
          selectedCs={selectedCs}
          chartOptions={chartOptions}
        />
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

export default Report;
