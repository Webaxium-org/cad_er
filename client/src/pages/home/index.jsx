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

import { TbRefresh } from 'react-icons/tb';
import { MdGpsFixed } from 'react-icons/md';
import { GoChecklist } from 'react-icons/go';

import BackgroundImage from '../../assets/background-img.png';
import ImageAvatars from '../../components/ImageAvatar';
import BasicButton from '../../components/BasicButton';
import { IoIosAddCircleOutline } from 'react-icons/io';
import BasicDivider from '../../components/BasicDevider';

const Home = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);

  const { global } = useSelector((state) => state.loading);

  const above385 = useMediaQuery('(min-width:386px)');
  const above400 = useMediaQuery('(min-width:400px)');

  const actions = [
    {
      label: 'Projects',
      icon: <TbReport fontSize={above400 ? 32 : 28} />,
      link: '/survey',
    },
    {
      label: 'Reports',
      icon: <TbReportSearch fontSize={above400 ? 32 : 28} />,
      link: '/survey/report',
    },
    {
      label: 'Unit Con.',
      icon: <TbRefresh fontSize={above400 ? 32 : 28} />,
      link: '#',
    },
    {
      label: 'Camera',
      icon: <MdGpsFixed size={28} />,
      link: '/camera',
    },
  ];

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  return (
    <Stack spacing={2} pb={2} sx={{ userSelect: 'none' }}>
      {/* 🌈 HEADER */}
      <Stack
        p={2}
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
          <Typography textAlign={'center'} fontWeight={900} fontSize="24px">
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
              onClick={() => navigate('/survey/select-equipment')}
              sx={{
                backgroundColor: '#ffffff',
                height: '45px',
                '&:hover': {
                  backgroundColor: '#ffffff',
                },
              }}
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
        <Typography fontWeight={700} fontSize="16px">
          Quick Actions
        </Typography>
        <Box display={'flex'} justifyContent={'space-between'}>
          {actions.map((item, idx) => (
            <Box key={idx}>
              <Stack alignItems={'center'} height={'100%'} spacing={0.5}>
                <Paper
                  elevation={3}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: '14px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    width: `${above400 ? '55px' : '46px'}`,
                    height: '100%',
                    backgroundColor: 'white',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                  }}
                  onClick={() => navigate(item.link)}
                >
                  <Stack
                    justifyContent={'center'}
                    alignItems={'center'}
                    spacing={0.5}
                    sx={{ color: 'rgba(0, 111, 253, 1)' }}
                  >
                    {item.icon}
                    <Typography
                      fontSize={above400 ? '12px' : '10px'}
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

      <Box px={2}>
        {/* Overview */}
        <Typography fontWeight={700} fontSize="16px" mb={1}>
          Overview
        </Typography>

        <Grid container columns={12} spacing={2}>
          <Grid size={{ xs: above385 ? 6 : 12 }}>
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
                    <Typography fontWeight={600} fontSize="14px">
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
                    fontWeight={600}
                    fontSize="14px"
                    color="rgba(40, 151, 255, 1)"
                  >
                    Today +2
                  </Typography>
                </Stack>
              }
            />
          </Grid>
          <Grid size={{ xs: above385 ? 6 : 12 }}>
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
                    <Typography fontWeight={600} fontSize="14px">
                      Total Tasks
                    </Typography>

                    <Box
                      bgcolor={'rgba(57, 104, 58, 0.22)'}
                      borderRadius={'6px'}
                      padding={'8px 8px 6px'}
                    >
                      <GoChecklist
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
                    fontWeight={600}
                    fontSize="14px"
                    color="rgba(57, 104, 58, 1)"
                  >
                    Today 0
                  </Typography>
                </Stack>
              }
            />
          </Grid>
        </Grid>

        <Stack spacing={2} mt={2} sx={{ display: 'none' }}>
          <Typography fontWeight={700} fontSize="16px">
            Tasks
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
};

export default Home;
