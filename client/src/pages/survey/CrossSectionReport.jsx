import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
import { advancedChartOptions, initialChartOptions } from '../../constants';
import BasicMenu from '../../components/BasicMenu';

const menuItems = [
  { label: 'V1', value: 'v1' },
  { label: 'V2', value: 'v2' },
  { label: 'V3', value: 'v3' },
];

const CrossSectionReport = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const dispatch = useDispatch();

  const { state } = useLocation();

  const { global } = useSelector((state) => state.loading);

  const [chartOptions, setChartOptions] = useState(initialChartOptions);

  const [survey, setSurvey] = useState([]);

  const [tableData, setTableData] = useState([]);

  const [selectedCs, setSelectedCs] = useState(null);

  const handleMenuSelect = (item) => {
    if (item.value === 'v1') setChartOptions(initialChartOptions);
    if (item.value === 'v2') setChartOptions(advancedChartOptions);
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
      data.push(survey?.purposes?.find((p) => p.type === 'Initial Level'));
    }

    setTableData(data);
  };

  const handleClickCs = (id) => {
    if (selectedCs?.id === id) return;

    if (!tableData?.length) return;

    const initialEntry = tableData[0];
    if (!initialEntry?.rows?.length) return;

    const row = initialEntry.rows.find((row) => row._id === id);
    if (!row) return;

    const safeOffsets = row.offsets || [];
    const safeInitial = row.reducedLevels || [];

    const data = {
      id,
      datum: 9.4,
      offsets: safeOffsets,
      chainage: row.chainage,
      series: [],
    };

    const makeSeries = (name, offsets, levels) =>
      offsets.map((o, i) => [Number(o), Number(levels?.[i] ?? 0).toFixed(3)]);

    // Add all additional tableData (Proposed, Level 2, etc.)
    if (tableData.length > 1) {
      for (let i = 1; i < tableData.length; i++) {
        const table = tableData[i];

        const newRow = table?.rows?.find((r) => r.chainage === row.chainage);
        if (!newRow) continue;

        const safeProposal =
          newRow.reducedLevels?.slice(0, safeOffsets.length) || [];

        data.series.push({
          name: table.type,
          data: makeSeries(table.type, safeOffsets, safeProposal),
        });
      }
    }

    // Add the Initial Entry at the end
    data.series.push({
      name: initialEntry.type,
      data: makeSeries(initialEntry.type, safeOffsets, safeInitial),
    });

    setSelectedCs(data);
  };

  const fetchSurvey = async () => {
    try {
      if (!global) dispatch(startLoading());
      const { data } = await getSurvey(id);

      if (data.success) {
        setSurvey(data.survey);

        handleSetTableData(data.survey);
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
    if (tableData.length) {
      const row = tableData[0].rows?.find((row) => row.type === 'Chainage');

      if (row) handleClickCs(row._id);
    }
  }, [tableData]);

  return (
    <Box p={2} mt={4}>
      <Box textAlign={'end'}>
        <BasicMenu
          label="Options"
          items={menuItems}
          onSelect={handleMenuSelect}
        />
      </Box>
      <Box
        sx={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 3,
        }}
      >
        <Typography
          variant="h6"
          fontSize={18}
          fontWeight={700}
          align="center"
          mb={2}
        >
          CROSS SECTION AT CHAINAGE {selectedCs?.chainage}
        </Typography>
        <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
          Datum: {selectedCs?.datum}
        </Typography>

        {selectedCs && selectedCs?.series && (
          <CrossSectionChart
            selectedCs={selectedCs}
            chartOptions={chartOptions}
            download={true}
          />
        )}

        {/* Footer */}
        <Typography
          variant="caption"
          sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}
        >
          [Hor Scale – 1 in 150 : Ver Scale – 1 in 150]
        </Typography>

        <TableContainer
          component={Paper}
          sx={{
            border: '1px solid black',
            mt: 2,
            maxHeight: 440,
          }}
        >
          <Table stickyHeader>
            <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Chainage</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>CS</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {tableData[0]?.rows?.map(
                (row, index) =>
                  row.type === 'Chainage' && (
                    <TableRow key={index}>
                      <TableCell
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleClickCs(row._id)}
                      >
                        {row.chainage}
                      </TableCell>
                      <TableCell
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleClickCs(row._id)}
                      >
                        View
                      </TableCell>
                    </TableRow>
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
