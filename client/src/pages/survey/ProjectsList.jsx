import { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Stack, styled } from '@mui/material';
import { MdOutlineSearch } from 'react-icons/md';
import IOSegmentedTabs from '../../components/IOSegmentedTabs';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { stopLoading } from '../../redux/loadingSlice';
import { handleFormError } from '../../utils/handleFormError';
import { getAllSurvey } from '../../services/surveyServices';
import { motion, AnimatePresence } from 'framer-motion';
import BasicAccordion from '../../components/BasicAccordion';
import LetterAvatar from '../../components/LetterAvatar';
import BasicDivider from '../../components/BasicDevider';
import { MdOutlineExpandMore } from 'react-icons/md';
import BasicCard from '../../components/BasicCard';
import StatusChip from '../../components/StatusChip';
import { TiEye } from 'react-icons/ti';
import BasicPagination from '../../components/BasicPagination';
import { ProjectListCardSkeleton } from './components/ProjectListCardSkeleton';

const colors = {
  Initial: 'green',
  Proposed: 'blue',
  Final: 'red',
};

const Item = styled(Box)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(0.5),
  marginBottom: 0,
  color: 'rgba(0, 0, 0, 0.74)',
  fontSize: '14px',
  display: 'flex',
  justifyContent: 'space-between',
}));

const fieldsToMap = [
  {
    key: 'type',
    value: 'Type',
  },
  {
    key: 'lastPurpose',
    value: 'Purpose',
  },
  {
    key: 'updatedAt',
    value: 'Last Edited',
    type: 'Date',
  },
  {
    key: <TiEye fontSize={20} color="rgba(0, 111, 253, 1)" />,
    value: 'Field Book',
    type: 'Icon',
  },
  {
    key: <TiEye fontSize={20} color="rgba(0, 111, 253, 1)" />,
    value: 'Reports',
    type: 'Icon',
  },
];

const getLink = (survey, target) => {
  if (target === 'reports') {
    return `/survey/${survey._id}/report`;
  }

  const initialLevel = survey?.purposes?.find(
    (p) => p.type === 'Initial Level'
  );

  if (target === 'Field Book') {
    if (initialLevel?.isPurposeFinish) {
      return `/survey/road-survey/${initialLevel._id}/field-book`;
    } else {
      return '#';
    }
  } else {
    return `/survey/${survey._id}/report`;
  }
};

export default function ProjectsList() {
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const [tab, setTab] = useState('two');

  const [loading, setLoading] = useState(true);

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
        const updatedSurveys =
          data?.surveys?.map((survey) => {
            const lastPurposeDoc = survey?.purposes
              ?.reverse()
              ?.find((p) => p.phase === 'Actual');

            return {
              ...survey,
              lastPurpose: lastPurposeDoc?.type || 'N/A',
            };
          }) || [];

        setSurveys(updatedSurveys);
      } else {
        throw Error('Failed to fetch surveys');
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      setLoading(false);
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
                            bgcolor={'rgba(0, 111, 253, 1)'}
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
                      details={
                        <Stack>
                          {fieldsToMap.map(({ key, value, type }, idx) => (
                            <Item key={idx}>
                              {value}

                              {type === 'Icon' ? (
                                <Link to={getLink(survey, value)}>{key}</Link>
                              ) : (
                                <Typography
                                  color={
                                    key === 'lastPurpose'
                                      ? colors[
                                          survey[key]?.includes('Initial')
                                            ? 'Initial'
                                            : survey[key]?.includes('Final')
                                            ? 'Final'
                                            : ''
                                        ]
                                      : ''
                                  }
                                  fontSize={14}
                                  fontWeight={700}
                                >
                                  {type === 'Date'
                                    ? new Date(survey[key])?.toLocaleDateString(
                                        'en-IN'
                                      )
                                    : survey[key]}
                                </Typography>
                              )}
                            </Item>
                          ))}
                        </Stack>
                      }
                      expandIcon={
                        <MdOutlineExpandMore
                          color="rgba(161, 161, 170, 1)"
                          fontSize={28}
                        />
                      }
                      sx={{ boxShadow: 'none' }}
                    />

                    <BasicDivider borderBottomWidth={0.5} color="#d9d9d9" />

                    <Stack
                      direction={'row'}
                      justifyContent={'space-between'}
                      alignItems={'center'}
                    >
                      <Typography
                        fontWeight={600}
                        fontSize="14px"
                        color="rgba(0, 0, 0, 0.74)"
                      >
                        Status
                      </Typography>

                      <StatusChip status={survey.status} />
                    </Stack>
                  </Box>
                }
                sx={{
                  borderRadius: '12px',
                  boxShadow: '0px 4px 8px 0px #1c252c2a',
                }}
              />
            ))}

            <Box
              position={'fixed'}
              display={'flex'}
              justifyContent={'center'}
              bottom={'66px'}
              left={0}
              width={'100%'}
              bgcolor={'white'}
              py={2}
              zIndex={999}
            >
              <BasicPagination count={10} color={'primary'} />
            </Box>
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
    <Box>
      <Box position={'sticky'} p={2} top={0} bgcolor={'white'} zIndex={1}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography fontWeight={700} fontSize="20px">
            Projects
          </Typography>
          {/* <IconButton>
            <MdOutlineSearch sx={{ fontSize: 26 }} />
          </IconButton> */}
        </Box>

        {/* iOS Tabs display: 'flex', justifyContent: 'center', */}
        <Box>
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
      </Box>

      {/* Animate tab content */}
      <Box px={2}>
        {loading ? (
          <Stack spacing={2}>
            {Array.from({ length: 7 }).map((_, idx) => (
              <ProjectListCardSkeleton key={idx} />
            ))}
          </Stack>
        ) : (
          <AnimatePresence mode="popLayout">{tabContent[tab]}</AnimatePresence>
        )}
      </Box>
    </Box>
  );
}
