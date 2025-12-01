import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { handleFormError } from '../../utils/handleFormError';
import { startLoading, stopLoading } from '../../redux/loadingSlice';
import { getSurvey } from '../../services/surveyServices';
import { Box, Stack, Typography } from '@mui/material';
import CrossSectionChart from './components/CrossSectionChart';
import { advancedChartOptions, initialChartOptions } from '../../constants';
import CrossSectionChartV2 from './components/CrossSectionChartV2';
import BasicMenu from '../../components/BasicMenu';
import { BsThreeDots } from 'react-icons/bs';

const menuItems = [
  { label: 'V1', value: 'v1' },
  { label: 'V2', value: 'v2' },
];

const colors = {
  Initial: 'green',
  Proposed: 'blue',
  Final: 'red',
};

const LongitudinalSectionReport = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const dispatch = useDispatch();

  const { state } = useLocation();

  const { global } = useSelector((state) => state.loading);

  const [chartOptions, setChartOptions] = useState(advancedChartOptions);

  const [tableData, setTableData] = useState([]);

  const [selectedCs, setSelectedCs] = useState(null);

  const handleMenuSelect = (item) => {
    if (item.value === 'v1') setChartOptions(advancedChartOptions);
    if (item.value === 'v2') setChartOptions(initialChartOptions);
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

  const getSafeChainage = (chainage) => {
    return Number(chainage?.split('/')[1]);
  };

  const getColor = (type) => {
    if (type.includes('Initial')) return colors.Initial;
    if (type.includes('Proposed')) return colors.Proposed;
    return colors.Final;
  };

  const handleGenerateLs = () => {
    const initialEntry = tableData[0];
    if (!initialEntry?.rows?.length) return;

    const row = initialEntry.rows.filter((row) => row.type === 'Chainage');
    if (!row.length) return;

    const safeChainages = row.map((r) => getSafeChainage(r.chainage)) || [];
    const safeInitial = row.map((r) => {
      const offsetPointIndex = r.offsets?.findIndex((o) => Number(o) === 0);

      const safeOffsetPointIndex =
        offsetPointIndex === -1
          ? Math.round(r.offsets.length / 2)
          : offsetPointIndex;

      return r.reducedLevels[safeOffsetPointIndex];
    });

    const data = {
      id,
      datum: 9.4,
      chainages: safeChainages,
      series: [],
    };

    const makeSeries = (name, offsets, levels) =>
      offsets.map((o, i) => [Number(o), Number(levels?.[i] ?? 0).toFixed(3)]);

    // Add all additional tableData (Proposed, Level 2, etc.)
    if (tableData.length > 1) {
      for (let i = 1; i < tableData.length; i++) {
        const table = tableData[i];

        const newRow = table?.rows?.filter((r) => r.type === 'Chainage') || [];
        if (!newRow.length) continue;

        const safeProposal = newRow.map((r) => {
          const offsetPointIndex = r.offsets?.findIndex((o) => Number(o) === 0);
          const safeOffsetPointIndex =
            offsetPointIndex === -1
              ? Math.round(r.offsets.length / 2)
              : offsetPointIndex;

          return r.reducedLevels[safeOffsetPointIndex];
        });

        data.series.push({
          name: table.type,
          color: getColor(table.type),
          data: makeSeries(table.type, safeChainages, safeProposal),
        });
      }
    }

    // Add the Initial Entry at the end
    data.series.push({
      name: initialEntry.type,
      color: getColor(initialEntry.type),
      data: makeSeries(initialEntry.type, safeChainages, safeInitial),
    });

    setSelectedCs(data);
  };

  const fetchSurvey = async () => {
    try {
      if (!global) dispatch(startLoading());
      const { data } = await getSurvey(id);

      if (data.success) {
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
      handleGenerateLs();
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
          LONGITUDINAL SECTION
        </Typography>
        <Box textAlign={'end'}>
          <BasicMenu
            label={<BsThreeDots />}
            items={menuItems}
            onSelect={handleMenuSelect}
          />
        </Box>
      </Stack>
      <Box
        sx={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {selectedCs && selectedCs?.series?.length && (
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
      </Box>
    </Box>
  );
};

export default LongitudinalSectionReport;
