import { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Stack } from '@mui/material';
import { MdOutlineSearch } from 'react-icons/md';
import IOSegmentedTabs from '../../components/IOSegmentedTabs';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { stopLoading } from '../../redux/loadingSlice';
import { handleFormError } from '../../utils/handleFormError';
import { getAllSurvey } from '../../services/surveyServices';
import { motion, AnimatePresence } from 'framer-motion';
import BasicAccordion from '../../components/BasicAccordion';
import LetterAvatar from '../../components/LetterAvatar';
import { deepOrange, deepPurple } from '@mui/material/colors';
import BasicDivider from '../../components/BasicDevider';
import BasicChip from '../../components/BasicChip';
import BasicCard from '../../components/BasicCard';

export default function ProjectsList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [tab, setTab] = useState('two');
  const [surveys, setSurveys] = useState([]);

  const handleChange = (e, newValue) => setTab(newValue);

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

  const fetchSurveys = async () => {
    try {
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

  // 🔥 Reusable motion variants
  const fadeSlide = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
  };

  const tabContent = {
    one: (
      <motion.div {...fadeSlide}>
        <Box textAlign="center" mt={6}>
          <Typography fontSize="20px" fontWeight={600}>
            To Do Items
          </Typography>
          <Typography fontSize="14px" color="gray" mt={1}>
            Your scheduled projects will appear here.
          </Typography>
        </Box>
      </motion.div>
    ),
    two: (
      <motion.div {...fadeSlide}>
        {surveys?.length ? (
          <Stack spacing={2}>
            {surveys?.map((survey, idx) => (
              <BasicCard
                key={idx}
                content={
                  <Box>
                    <BasicAccordion
                      summary={
                        <Stack
                          direction={'row'}
                          alignItems={'center'}
                          spacing={1}
                        >
                          <LetterAvatar
                            letter={survey.project.slice(0, 1)}
                            bgcolor={
                              idx % 2 === 0 ? deepOrange[500] : deepPurple[500]
                            }
                            onClick={() => handleContinueSurvey(survey._id)}
                          />

                          <Box>
                            <Typography fontWeight={600} fontSize="14px">
                              {survey.project}
                            </Typography>
                            <Typography
                              fontWeight={500}
                              color="rgba(161, 161, 170, 1)"
                              fontSize="14px"
                            >
                              {new Date(survey.createdAt)?.toLocaleDateString(
                                'en-IN'
                              )}
                            </Typography>
                          </Box>
                        </Stack>
                      }
                      sx={{ boxShadow: 'none' }}
                    />

                    <BasicDivider
                      borderBottomWidth={0.5}
                      color="rgba(194, 194, 194, 1)"
                    />

                    <Stack
                      direction={'row'}
                      justifyContent={'space-between'}
                      alignItems={'center'}
                    >
                      <Typography fontWeight={600} fontSize="14px">
                        Status
                      </Typography>

                      <BasicChip label={survey.status} />
                    </Stack>
                  </Box>
                }
              />
            ))}
          </Stack>
        ) : (
          <Box textAlign="center" mt={6}>
            <Typography fontSize="20px" fontWeight={600}>
              In Progress
            </Typography>
            <Typography fontSize="14px" color="gray" mt={1}>
              Your ongoing projects will appear here.
            </Typography>
          </Box>
        )}
      </motion.div>
    ),
    three: (
      <motion.div {...fadeSlide}>
        <Box textAlign="center" mt={6}>
          <Typography fontSize="20px" fontWeight={600}>
            Finished Projects
          </Typography>
          <Typography fontSize="14px" color="gray" mt={1}>
            Completed projects will appear here.
          </Typography>
        </Box>
      </motion.div>
    ),
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 3,
          alignItems: 'center',
        }}
      >
        <Typography fontWeight={700} fontSize="20px">
          Projects
        </Typography>
        <IconButton>
          <MdOutlineSearch sx={{ fontSize: 26 }} />
        </IconButton>
      </Box>

      {/* iOS Tabs */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <IOSegmentedTabs
          value={tab}
          onChange={handleChange}
          tabs={[
            { label: 'To do', value: 'one' },
            { label: 'In progress', value: 'two' },
            { label: 'Finished', value: 'three' },
          ]}
        />
      </Box>

      {/* Animate tab content */}
      <AnimatePresence mode="popLayout">{tabContent[tab]}</AnimatePresence>
    </Box>
  );
}
