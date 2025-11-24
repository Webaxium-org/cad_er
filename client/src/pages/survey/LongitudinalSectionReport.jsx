import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { handleFormError } from '../../utils/handleFormError';
import { startLoading, stopLoading } from '../../redux/loadingSlice';
import { getSurvey } from '../../services/surveyServices';
import { Box } from '@mui/material';
import CrossSectionChart from './components/CrossSectionChart';
import { initialChartOptions } from '../../constants';

const LongitudinalSectionReport = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const dispatch = useDispatch();

  const { state } = useLocation();

  const { global } = useSelector((state) => state.loading);

  const [chartOptions, setChartOptions] = useState(initialChartOptions);

  const [tableData, setTableData] = useState([]);

  const [selectedCs, setSelectedCs] = useState(null);

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

  const handleGenerateLs = () => {
    const initialEntry = tableData[0];
    if (!initialEntry?.rows?.length) return;

    const row = initialEntry.rows.filter((row) => row.type === 'Chainage');
    if (!row.length) return;

    const safeChainages = row.map((r) => getSafeChainage(r.chainage)) || [];
    const safeInitial = row.map((r) => {
      const offsetPointIndex = r.offsets?.findIndex((o) => Number(0) === 0);

      return r.reducedLevels[offsetPointIndex];
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
          const offsetPointIndex = r.offsets?.findIndex((o) => Number(0) === 0);

          return r.reducedLevels[offsetPointIndex];
        });

        data.series.push({
          name: table.type,
          data: makeSeries(table.type, safeChainages, safeProposal),
        });
      }
    }

    // Add the Initial Entry at the end
    data.series.push({
      name: initialEntry.type,
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
          download={true}
          title="Longitudinal Section"
        />
      )}
    </Box>
  );
};

export default LongitudinalSectionReport;
