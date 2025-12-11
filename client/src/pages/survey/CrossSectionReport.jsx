import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { handleFormError } from '../../utils/handleFormError';
import { startLoading, stopLoading } from '../../redux/loadingSlice';
import { getSurvey } from '../../services/surveyServices';
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CrossSectionChart from './components/CrossSectionChart';
import { v1ChartOptions, v2ChartOptions } from '../../constants';
import { BsThreeDots } from 'react-icons/bs';
import BasicMenu from '../../components/BasicMenu';
import BasicInput from '../../components/BasicInput';

const menuItems = [
  { label: 'V1', value: 'v1' },
  { label: 'V2', value: 'v2' },
];

const colors = {
  Initial: 'green',
  Proposed: 'blue',
  Final: 'red',
};

const CrossSectionReport = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const dispatch = useDispatch();

  const { state } = useLocation();

  const { global } = useSelector((state) => state.loading);

  const [chartOptions, setChartOptions] = useState(null);

  const [survey, setSurvey] = useState([]);

  const [maxValue, setMaxValue] = useState('');

  const [tableData, setTableData] = useState([]);

  const [selectedCs, setSelectedCs] = useState(null);

  const handleMenuSelect = (item) => {
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
      tickformat: '.3f', // 3 decimals always
      dtick: (maxX - minX) / 4, // Generates: min → -2 → 0 → 2 → max
      zeroline: false,
      showline: false,
      mirror: true,
    };

    if (item.value === 'v1') {
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
    if (item.value === 'v2') {
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

  const getColor = (type) => {
    if (type.includes('Initial')) return colors.Initial;
    if (type.includes('Proposed')) return colors.Proposed;
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
    const uniqueOffsets = [...new Set(rawOffsets.map(Number))].sort(
      (a, b) => a - b
    );

    const data = {
      id,
      type: 'cs',
      offsets: [...uniqueOffsets],
      chainage: row.chainage,
      series: [],
      allRl: [],
    };

    // Keep duplicates in the plotted series
    const makeSeries = (offsets, levels) =>
      offsets.map((o, i) => ({
        x: Number(Number(o).toFixed(3)), // NUMERIC X (IMPORTANT)
        y: Number(Number(levels?.[i] ?? 0).toFixed(3)),
      }));

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
          const num = Number(o);
          if (!data.offsets.includes(num)) data.offsets.push(num);
        });

        data.series.push({
          name: table.type,
          color: getColor(table.type),
          data: makeSeries(rawProposalOffsets, safeProposalLevels),
        });

        data.allRl.push(...safeProposalLevels);
      }
    }

    // Add initial (original)
    data.series.push({
      name: initialEntry.type,
      color: getColor(initialEntry.type),
      data: makeSeries(rawOffsets, safeInitial),
    });

    data.allRl.push(...safeInitial);

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
      tickformat: '.3f',
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
    <Box p={2}>
      <Stack
        direction={'row'}
        justifyContent={'space-between'}
        alignItems={'center'}
        spacing={2}
        mb={2}
      >
        <Typography variant="h6" fontSize={18} fontWeight={700} align="center">
          CS AT CHAINAGE {selectedCs?.chainage}
        </Typography>
        <Box textAlign={'end'}>
          <BasicMenu
            label={<BsThreeDots />}
            items={menuItems}
            onSelect={handleMenuSelect}
          />
        </Box>
      </Stack>

      <Box mb={2}>
        <BasicInput
          label={'Change Y-Axis Limit'}
          placeholder="Enter"
          value={maxValue || ''}
          onChange={(e) => handleInputChange(e.target.value)}
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
        {selectedCs && selectedCs?.series && chartOptions && (
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
