import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSurveyPurpose } from '../../services/surveyServices';
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

export default function PurposeList() {
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { global } = useSelector((state) => state.loading);

  const [purposes, setPurposes] = useState([]);

  const fetchPurposes = async () => {
    try {
      if (!global) {
        dispatch(startLoading());
      }

      const { data } = await getAllSurveyPurpose();

      if (data.success) {
        setPurposes(data.purposes || []);
      } else {
        throw Error('Failed to fetch purposes');
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  useEffect(() => {
    fetchPurposes();
  }, []);

  const handleContinuePurpose = async (id) =>
    navigate(`/survey/road-survey/${id}/rows`);

  const handleEndSurvey = async (id) => {
    alert('!');
  };

  if (purposes.length === 0)
    return (
      <Typography p={2} color="text.secondary">
        No purposes found.
      </Typography>
    );

  return (
    <Box p={3}>
      <Stack direction={'row'} alignItems={'center'} spacing={2} mb={2}>
        <Typography variant="h5" fontWeight={700}>
          Survey List
        </Typography>

        <ButtonLink
          label={'Project List'}
          onClick={() => navigate('/survey')}
        />
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Purpose</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Instrument No</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Chainage Multiple</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Report</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Field Book</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {purposes.map((purpose) => (
              <TableRow key={purpose._id} hover>
                <TableCell>{purpose.surveyId?.project}</TableCell>
                <TableCell>{purpose.type}</TableCell>
                <TableCell>{purpose.surveyId?.instrumentNo}</TableCell>
                <TableCell>{purpose.surveyId?.chainageMultiple}</TableCell>
                <TableCell>
                  <Chip
                    label={purpose.status}
                    color={purpose.isPurposeFinish ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(purpose.DateOfSurvey).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() =>
                      navigate(
                        `/survey/road-survey/${purpose?.surveyId?._id}/report`
                      )
                    }
                  >
                    <FaEye />
                  </IconButton>
                </TableCell>
                <TableCell>
                  {purpose.type === 'Initial Level' &&
                  purpose.isPurposeFinish ? (
                    <IconButton
                      color="primary"
                      onClick={() =>
                        navigate(
                          `/survey/road-survey/${purpose?._id}/field-book`
                        )
                      }
                    >
                      <FaEye />
                    </IconButton>
                  ) : (
                    'N/A'
                  )}
                </TableCell>

                <TableCell align="right">
                  {!purpose.isPurposeFinish && (
                    <IconButton
                      color="error"
                      onClick={() => handleContinuePurpose(purpose._id)}
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
