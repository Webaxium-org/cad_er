import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Stack, Box, Typography, Grid, Paper } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import { stopLoading } from '../../redux/loadingSlice';
import { useNavigate } from 'react-router-dom';
import BasicInput from '../../components/BasicInput';
import BasicCard from '../../components/BasicCard';

import { IoNotificationsOutline } from 'react-icons/io5';
import { MdOutlineSearch } from 'react-icons/md';
import { TbReport } from 'react-icons/tb';
import { TbReportSearch } from 'react-icons/tb';

import { GrTask } from 'react-icons/gr';

import { MdGpsFixed } from 'react-icons/md';
import { GoArrowSwitch } from 'react-icons/go';

import Lottie from 'lottie-react';

import BackgroundImage from '../../assets/background-img.png';
import totalStationIcon from '../../assets/icons/compass.json';
import DGPSIcon from '../../assets/icons/GPS Navigation.json';
import DroneIcon from '../../assets/icons/Drone Camera.json';
import BathymetryIcon from '../../assets/icons/Boat-Looking-For-Land.json';
import ImageAvatars from '../../components/ImageAvatar';
import BasicButton from '../../components/BasicButton';
import { IoIosAddCircleOutline } from 'react-icons/io';
import BasicDivider from '../../components/BasicDevider';

const openCamera = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.click();

  input.onchange = (e) => {
    const file = e.target.files[0];
    console.log('Captured Image:', file);
  };
};

const actions = [
  {
    label: 'Projects',
    icon: <TbReport size={28} />,
    link: '/survey',
  },
  {
    label: 'Reports',
    icon: <TbReportSearch size={28} />,
    link: '/survey/report',
  },
  {
    label: 'Unit Con',
    icon: <GoArrowSwitch size={28} />,
    link: '#',
  },
  {
    label: 'Camera',
    icon: <MdGpsFixed size={28} />,
    link: null,
    onClick: openCamera,
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

  const above412 = useMediaQuery('(min-width:370px)');

  const handleNavigate = (link) => {
    navigate(link);
  };

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  return (
    <Stack spacing={2} pb={2}>
      {/* 🌈 HEADER */}
      <Stack
        p={2}
        bgcolor={''}
        sx={{
          position: 'relative',
          backgroundColor: 'rgba(40, 151, 255, 1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${BackgroundImage})`,
            backgroundSize: '200%',
            backgroundPosition: 'center',
            opacity: 0.25,
            zIndex: 0,
            height: '100%',
            width: '100%',
          }}
        ></div>
        <Box
          display={'flex'}
          justifyContent={'space-between'}
          alignItems={'center'}
          color="white"
        >
          <Typography textAlign={'center'} fontWeight={900} fontSize="20px">
            CADer
          </Typography>

          <Box>
            <IoNotificationsOutline fontSize={'24px'} />
          </Box>
        </Box>

        <Stack
          direction={'row'}
          alignItems={'center'}
          justifyContent={'space-between'}
          mt={2}
        >
          <Stack direction={'row'} alignItems={'center'} spacing={1}>
            <Box>
              <ImageAvatars
                sx={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#fff',
                  color: 'rgba(40, 151, 255, 1)',
                  '& .css-1mo2pzk-MuiSvgIcon-root-MuiAvatar-fallback': {
                    width: '60%',
                    height: '60%',
                  },
                }}
              />
            </Box>

            <Box color="white">
              <Typography fontWeight={700} fontSize="14px">
                Hello,
              </Typography>
              <Typography fontWeight={700} fontSize="14px">
                {user.name}
              </Typography>
            </Box>
          </Stack>

          <Box minWidth={'123px'}>
            <BasicButton
              value={
                <Box
                  display={'flex'}
                  gap={1}
                  alignItems={'center'}
                  color={'rgba(0, 111, 253, 1)'}
                >
                  <IoIosAddCircleOutline
                    fontSize={'20px'}
                    fontWeight={'900'}
                    strokeWidth={'10px'}
                  />
                  <Typography fontSize={'13px'} fontWeight={700}>
                    Add Project
                  </Typography>
                </Box>
              }
              onClick={() => navigate('/survey/add-survey')}
              sx={{ backgroundColor: '#ffffffff', height: '45px' }}
            />
          </Box>
        </Stack>

        <BasicDivider borderBottomWidth={0.5} color="rgba(222, 222, 222, 1)" />

        <Box position={'relative'}>
          <Box
            position={'absolute'}
            zIndex={1}
            sx={{ top: '10px', left: '10px' }}
            color={'rgba(145, 145, 145, 1)'}
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
      <Stack spacing={2} px={2}>
        <Typography fontWeight={700} fontSize="14px">
          Quick Actions
        </Typography>
        <Box display={'flex'} justifyContent={'space-between'}>
          {actions.map((item, idx) => (
            <Box key={idx}>
              <Stack alignItems={'center'} spacing={0.5}>
                <Paper
                  elevation={3}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: '22px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    width: 'fit-content',
                    backgroundColor: 'white',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                  }}
                  onClick={() => handleNavigate(item.link)}
                >
                  <Stack
                    justifyContent={'center'}
                    alignItems={'center'}
                    spacing={0.5}
                    sx={{ color: 'rgba(0, 111, 253, 1)' }}
                  >
                    {item.icon}
                    <Typography
                      fontSize="10px"
                      fontWeight={700}
                      color="black"
                      align="center"
                    >
                      {item.label}
                    </Typography>
                  </Stack>
                </Paper>
              </Stack>
            </Box>
          ))}
        </Box>
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
                    gap={1.5}
                  >
                    <Typography fontWeight={700} fontSize="12px">
                      Total Projects
                    </Typography>

                    <Box
                      bgcolor={'rgba(234, 242, 255, 1)'}
                      borderRadius={'6px'}
                      padding={'8px 8px 6px'}
                    >
                      <TbReport
                        size={20}
                        style={{
                          color: 'rgba(0, 111, 253, 1)',
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography fontWeight={700} fontSize="24px">
                    12
                  </Typography>

                  <Typography
                    fontWeight={700}
                    fontSize="12px"
                    color="rgba(40, 151, 255, 1)"
                  >
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
                borderBottom: '2px solid rgba(57, 104, 58, 1)',
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
                    gap={1.5}
                  >
                    <Typography fontWeight={700} fontSize="12px">
                      Total Tasks
                    </Typography>

                    <Box
                      bgcolor={'rgba(57, 104, 58, 0.22)'}
                      borderRadius={'6px'}
                      padding={'8px 8px 6px'}
                    >
                      <GrTask
                        size={20}
                        style={{
                          color: 'rgba(57, 104, 58, 1)',
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography fontWeight={700} fontSize="24px">
                    0
                  </Typography>

                  <Typography
                    fontWeight={700}
                    fontSize="12px"
                    color="rgba(57, 104, 58, 1)"
                  >
                    Today 0
                  </Typography>
                </Stack>
              }
            />
          </Grid>
        </Grid>
      </Box>

      <Box p={2} overflow={'hidden'}>
        <Typography fontWeight={700} fontSize="14px" mb={1}>
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
    </Stack>
  );
};

export default Home;
