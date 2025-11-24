import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Stack, Box, Typography, Grid, Paper, Avatar } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { IoAddCircleOutline } from 'react-icons/io5';
import { RiSurveyLine } from 'react-icons/ri';
import { GoProject } from 'react-icons/go';

import { TbReportAnalytics } from 'react-icons/tb';

import { useDispatch, useSelector } from 'react-redux';
import { stopLoading } from '../../redux/loadingSlice';
import { useNavigate } from 'react-router-dom';
import BasicInput from '../../components/BasicInput';
import BasicCard from '../../components/BasicCard';

import { IoNotificationsOutline } from 'react-icons/io5';
import { MdOutlineSearch } from 'react-icons/md';

import Lottie from 'lottie-react';

import totalStationIcon from '../../assets/icons/compass.json';
import DGPSIcon from '../../assets/icons/GPS Navigation.json';
import DroneIcon from '../../assets/icons/Drone Camera.json';
import BathymetryIcon from '../../assets/icons/Boat-Looking-For-Land.json';

const actions = [
  { label: 'Projects', icon: <GoProject size={28} />, link: '/survey' },
  {
    label: 'Tasks',
    icon: <RiSurveyLine size={28} />,
    link: '/survey/tasks',
  },
  { label: 'Reports', icon: <TbReportAnalytics size={28} />, link: '/survey/report' },
  {
    label: 'Add Project',
    icon: <IoAddCircleOutline size={28} />,
    link: '/survey/add-survey',
  },
];

const upcomingList = [
  {
    label: 'Total Station',
    icon: totalStationIcon,
    link: '#',
    color: '#006FFD',
    description:
      'High-precision land surveying using electronic distance and angle measurements.',
  },
  {
    label: 'DGPS',
    icon: DGPSIcon,
    link: '#',
    color: '#D98500',
    description:
      'Centimeter-level positioning using GPS enhanced by base-station corrections.',
  },
  {
    label: 'Drone',
    icon: DroneIcon,
    link: '#',
    color: '#7A2EFF',
    description:
      'Aerial mapping and 3D modelling using high-resolution drone imagery.',
  },
  {
    label: 'Bathymetry',
    icon: BathymetryIcon,
    link: '#',
    color: '#00A79D',
    description:
      'Underwater depth mapping using sonar or echo-sounder measurement systems.',
  },
];

const animations = [
  { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } },
  { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 } },
];

const colors = [
  {
    bg: '#F5F9FC',
    icon: '#2775AD', // your theme as accent
    hover: '#E8F1F8',
  },
  {
    bg: '#F6FAF8',
    icon: '#3A7F6C',
    hover: '#EAF3EE',
  },
  {
    bg: '#FBF9F4',
    icon: '#AA7A33',
    hover: '#F4EEDF',
  },
  {
    bg: '#FCF6F7',
    icon: '#B5545C',
    hover: '#F4E4E6',
  },
];

const Home = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);

  const { global } = useSelector((state) => state.loading);

  const lottieRef = useRef();
  const [open, setOpen] = useState(false);

  const above412 = useMediaQuery('(min-width:412px)');

  const handleClick = () => {
    if (!lottieRef.current) return;

    if (!open) {
      // Play first half (open)
      lottieRef.current.playSegments([0, 70], true);
    } else {
      // Play second half (close)
      lottieRef.current.playSegments([70, 140], true);
    }

    setOpen(!open);
  };

  const handleNavigate = (link) => {
    navigate(link);
  };

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  return (
    <Stack spacing={2} pb={2}>
      {/* 🌈 HEADER */}
      <Stack spacing={2} p={2} bgcolor={'#EAF2FF'}>
        <Box
          display={'flex'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Typography textAlign={'center'} fontWeight={700} fontSize="24px">
            Cader
          </Typography>

          <Box>
            <IoNotificationsOutline fontSize={'24px'} />
          </Box>
        </Box>

        <Stack>
          <Typography fontWeight={700} fontSize="16px">
            Hello,
          </Typography>
          <Typography fontWeight={700} fontSize="16px">
            {user.name}
          </Typography>
        </Stack>

        <Box position={'relative'}>
          <Box
            position={'absolute'}
            zIndex={1}
            sx={{ top: '10px', left: '10px' }}
          >
            <MdOutlineSearch fontSize={'24px'} />
          </Box>
          <BasicInput
            placeholder="Search"
            sx={{
              paddingLeft: '40px',
              borderRadius: '14px',
            }}
          />
        </Box>
      </Stack>

      {/* ⚡ Quick Actions */}
      <Stack spacing={2}>
        <Typography fontWeight={700} fontSize="14px" px={2}>
          Quick Actions
        </Typography>
        <Box display={'flex'} justifyContent={'space-evenly'}>
          {' '}
          {actions.map((item, idx) => (
            <Box key={idx}>
              <Stack alignItems={'center'} spacing={0.5}>
                {' '}
                <Paper
                  elevation={3}
                  sx={{
                    px: 2.5,
                    py: 2,
                    borderRadius: '22px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    width: 'fit-content',
                    backgroundColor: colors[idx].bg,
                    '&:hover': {
                      backgroundColor: colors[idx].hover,
                      transform: 'scale(1.05)',
                    },
                  }}
                  onClick={() => handleNavigate(item.link)}
                >
                  {' '}
                  <Box sx={{ color: colors[idx].icon }}>{item.icon}</Box>{' '}
                </Paper>{' '}
                <Typography fontSize="12px" fontWeight={500} align="center">
                  {' '}
                  {item.label}{' '}
                </Typography>{' '}
              </Stack>
            </Box>
          ))}{' '}
        </Box>{' '}
      </Stack>

      {/* Overview */}

      <Box px={2}>
        <Typography fontWeight={700} fontSize="14px" mt={2} mb={1}>
          Overview
        </Typography>

        <Grid container columns={12} spacing={2}>
          <Grid size={{ xs: above412 ? 6 : 12 }}>
            <BasicCard
              key={global}
              component={motion.div}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, boxShadow: '0px 8px 20px rgba(0,0,0,0.1)' }}
              transition={{ duration: 0.4, delay: 0.6 }}
              sx={{
                borderBottom: '2px solid #006FFD',
                borderRadius: '16px',
                cursor: 'pointer',
              }}
              content={
                <Stack spacing={1}>
                  <Box
                    display={'flex'}
                    justifyContent={'space-between'}
                    alignItems={'center'}
                    gap={2}
                  >
                    <Typography fontWeight={500} fontSize="14px">
                      Total Projects
                    </Typography>

                    <Box>
                      <GoProject
                        size={28}
                        style={{
                          padding: 10,
                          backgroundColor: '#EAF2FF',
                          color: '#006FFD',
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography fontWeight={700} fontSize="24px">
                    12
                  </Typography>

                  <Typography fontWeight={500} fontSize="14px">
                    Today +2
                  </Typography>
                </Stack>
              }
            />
          </Grid>
          <Grid size={{ xs: above412 ? 6 : 12 }}>
            <BasicCard
              key={global}
              component={motion.div}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, boxShadow: '0px 8px 20px rgba(0,0,0,0.1)' }}
              transition={{ duration: 0.4, delay: 0.8 }}
              sx={{
                borderBottom: '2px solid #0B8A1F',
                borderRadius: '16px',
                cursor: 'pointer',
                height: '100%',
              }}
              content={
                <Stack spacing={1}>
                  <Box
                    display={'flex'}
                    justifyContent={'space-between'}
                    alignItems={'center'}
                    gap={2}
                  >
                    <Typography fontWeight={500} fontSize="14px">
                      Total Tasks
                    </Typography>

                    <Box>
                      <RiSurveyLine
                        size={28}
                        style={{
                          padding: 10,
                          backgroundColor: '#E8F7EA',
                          color: '#0B8A1F',
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography fontWeight={700} fontSize="24px">
                    0
                  </Typography>

                  <Typography fontWeight={500} fontSize="14px">
                    Today 0
                  </Typography>
                </Stack>
              }
            />
          </Grid>
        </Grid>
      </Box>

      <Box p={2} overflow={'hidden'}>
        <Typography fontWeight={700} fontSize="14px" mt={2} mb={1}>
          Upcoming
        </Typography>

        <Grid container columns={12} spacing={2}>
          {upcomingList.map((upcoming, idx) => (
            <Grid
              key={idx}
              size={{ xs: above412 ? 6 : 12 }}
              sx={{
                '& .MuiCard-root': {
                  height: '100%',
                },
              }}
            >
              <BasicCard
                key={global}
                component={motion.div}
                {...animations[idx % 2]}
                whileHover={{
                  y: -5,
                  boxShadow: '0px 8px 20px rgba(0,0,0,0.1)',
                }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                sx={{
                  borderRadius: '16px',
                  cursor: 'pointer',
                }}
                content={
                  <Stack spacing={1}>
                    <Box width={'70px'}>
                      <Lottie animationData={upcoming.icon} />
                    </Box>
                    <Typography fontWeight={700} fontSize="24px">
                      {upcoming.label}
                    </Typography>
                    <Typography fontWeight={500} fontSize="16px">
                      {upcoming.description}
                    </Typography>
                  </Stack>
                }
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* <div onClick={handleClick} style={{ width: 50, cursor: 'pointer' }}>
        <Lottie
          lottieRef={lottieRef}
          animationData={MenuIcon}
          autoplay={false}
          loop={false}
        />
      </div> */}
    </Stack>
  );
};

export default Home;
