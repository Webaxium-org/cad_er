import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSurvey } from '../../services/surveyServices';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import { startLoading, stopLoading } from '../../redux/loadingSlice';
import { FaEye, FaChevronRight } from 'react-icons/fa';
import { handleFormError } from '../../utils/handleFormError';
import { showAlert } from '../../redux/alertSlice';
import ButtonLink from '../../components/ButtonLink';

export default function SurveyList() {
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { global } = useSelector((state) => state.loading);

  const [surveys, setSurveys] = useState([]);

  const fetchSurveys = async () => {
    try {
      if (!global) {
        dispatch(startLoading());
      }

      const { data } = await getAllSurvey();

      if (data.success) {
        setSurveys(data.surveys || []);
      } else {
        throw Error('Failed to fetch surveys');
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleContinueSurvey = async (id) => {
    try {
      const survey = surveys.find((s) => String(s._id) === id);

      if (!survey) throw Error('Something went wrong');
      if (survey.isSurveyFinish) throw Error('The survey already finished');

      const activePurpose = survey.purposes?.find((p) => !p.isPurposeFinish);

      if (activePurpose) {
        navigate(`/survey/road-survey/${activePurpose._id}/rows`);
      } else {
        navigate(`/survey/road-survey/${survey._id}`);
      }
    } catch (err) {
      dispatch(
        showAlert({
          type: 'error',
          message: 'Something went wrong',
        })
      );
    }
  };

  const handleEndSurvey = async (id) => {
    alert('!');
  };

  const generateLink = (link) => {
    return (
      <IconButton color="primary" onClick={() => navigate(link)}>
        <FaEye />
      </IconButton>
    );
  };

  const getReportLink = (survey, target) => {
    const initialLevel = survey?.purposes?.find(
      (p) => p.type === 'Initial Level'
    );

    if (target === 'Field Book' && initialLevel?.isPurposeFinish) {
      return generateLink(`/survey/road-survey/${initialLevel._id}/field-book`);
    } else {
      const proposedLevel = survey?.purposes?.find(
        (p) => p.type === 'Proposed Level'
      );

      if (!proposedLevel?.isPurposeFinish) return 'N/A';

      return generateLink(`/survey/road-survey/${survey._id}/${target}`);
    }
  };

  if (surveys.length === 0)
    return (
      <Typography p={2} color="text.secondary">
        No surveys found.
      </Typography>
    );

  return (
    <Box p={3}>
      <Stack direction={'row'} alignItems={'center'} spacing={2} mb={2}>
        <Typography variant="h5" fontWeight={700}>
          Project List
        </Typography>

        <ButtonLink
          label={'Survey List'}
          onClick={() => navigate('/survey/purpose')}
        />
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Purpose</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Instrument No</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Chainage Multiple</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>FieldBook</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Area Report</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Volume Report</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {surveys.map((survey) => (
              <TableRow key={survey._id} hover>
                <TableCell>{survey.project}</TableCell>
                <TableCell>
                  {survey.purposes?.map((p) => p.type)?.join(', ')}
                </TableCell>
                <TableCell>{survey.instrumentNo}</TableCell>
                <TableCell>{survey.type}</TableCell>
                <TableCell>{survey.chainageMultiple}</TableCell>
                <TableCell>
                  <Chip
                    label={survey.isSurveyFinish ? 'Finished' : 'Active'}
                    color={survey.isSurveyFinish ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(survey.DateOfSurvey).toLocaleDateString()}
                </TableCell>
                <TableCell>{getReportLink(survey, 'Field Book')}</TableCell>
                <TableCell>{getReportLink(survey, 'area-report')}</TableCell>
                <TableCell>{getReportLink(survey, 'volume-report')}</TableCell>

                <TableCell align="right">
                  {!survey.isSurveyFinish && (
                    <IconButton
                      color="error"
                      onClick={() => handleContinueSurvey(survey._id)}
                    >
                      <FaChevronRight />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
