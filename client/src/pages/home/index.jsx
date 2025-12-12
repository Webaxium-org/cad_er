import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Stack,
  Box,
  Typography,
  Grid,
  Paper,
  Tooltip,
  Fab,
} from '@mui/material';
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
import { BiSupport } from 'react-icons/bi';
import { IoTime } from 'react-icons/io5';

import BackgroundImage from '../../assets/background-img.png';
import logo from '../../assets/logo/CADer logo-main.png';
import ImageAvatars from '../../components/ImageAvatar';
import BasicButton from '../../components/BasicButton';
import { IoIosAddCircleOutline } from 'react-icons/io';
import BasicDivider from '../../components/BasicDevider';
import AlertDialogSlide from '../../components/AlertDialogSlide';
import UniversalConverter from '../../components/UniversalConverter';
import StatusChip from '../../components/StatusChip';

const alertData = {
  title: 'Help & Support',
  description: `If you have any questions or need assistance, we're here to help.
            Please describe your issue below, and our support team will get back
            to you as soon as possible.`,
  content: <BasicInput placeholder="Message" sx={{ mt: 2 }} />,
  cancelButtonText: 'Cancel',
  submitButtonText: 'Continue',
};

const unitConverterAlertData = {
  title: 'Unit Converter',
  description: '',
  content: '',
  submitButtonText: 'Cancel',
};

const animations = [
  { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } },
  { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 } },
];

const taskData = [
  {
    title: 'Auto Level',
    description: 'create level and accurate road profiles',
    status: 'Pending',
    createdAt: '12:00 PM',
  },
  {
    title: 'Soil Testing',
    description: 'analyze soil composition and moisture content',
    status: 'Completed',
    createdAt: '09:30 AM',
  },
  {
    title: 'Site Inspection',
    description: 'inspect construction site for quality assurance',
    status: 'In Progress',
    createdAt: '03:45 PM',
  },
  {
    title: 'Material Check',
    description: 'verify material delivery and measurements',
    status: 'Pending',
    createdAt: '08:15 AM',
  },
  {
    title: 'Excavation Leveling',
    description: 'ensure excavation is done at correct levels',
    status: 'Completed',
    createdAt: '11:20 AM',
  },
  {
    title: 'Boundary Marking',
    description: 'mark boundaries as per the approved layout plan',
    status: 'In Progress',
    createdAt: '10:05 AM',
  },
  {
    title: 'Concrete Mix Test',
    description: 'test the workability and strength of concrete mix',
    status: 'Pending',
    createdAt: '04:10 PM',
  },
  {
    title: 'Equipment Calibration',
    description: 'calibrate surveying instruments and tools',
    status: 'Completed',
    createdAt: '01:40 PM',
  },
];

const Home = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);

  const { global } = useSelector((state) => state.loading);

  const [open, setOpen] = useState();

  const [openUnitConverter, setOpenUnitConverter] = useState();

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
      type: 'unit',
    },
    {
      label: 'Camera',
      icon: <MdGpsFixed size={28} />,
      link: '/camera',
    },
  ];

  const handleOpen = (action) => {
    setOpen(action === 'help & support');
    setOpenUnitConverter(action === 'unit converter');
  };

  const handleClose = () => {
    setOpen(false);
    setOpenUnitConverter(false);
  };

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  return (
    <>
      <AlertDialogSlide
        {...alertData}
        open={open}
        onCancel={handleClose}
        onSubmit={handleClose}
      />

      <AlertDialogSlide
        {...unitConverterAlertData}
        content={<UniversalConverter />}
        open={openUnitConverter}
        onSubmit={handleClose}
      />

      {!open && !openUnitConverter && (
        <Tooltip title="Help" placement="left">
          <Fab
            onClick={() => handleOpen('help & support')}
            aria-label="help"
            sx={{
              position: 'fixed',
              bottom: 90,
              right: 24,
              borderRadius: 8,
              textTransform: 'none',
              zIndex: 2000,
              width: 56,
              height: 56,
              backgroundColor: '#006FFD',
              color: 'white',
              ':hover': { backgroundColor: '#006FFD' },
            }}
          >
            <BiSupport size={24} />
          </Fab>
        </Tooltip>
      )}

      <Stack spacing={2} pb={2} sx={{ userSelect: 'none' }}>
        {/* 🌈 HEADER */}
        <Stack
          p={2}
          height={'228px'}
          sx={{
            position: 'relative',
            // backgroundColor: 'rgba(40, 151, 255, 1)',
            background:
              'linear-gradient(217.64deg, #0A3BAF -5.84%, #0025A0 106.73%)',
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
              height: '60dvh',
              width: '100%',
            }}
          ></div>
          <Box
            display={'flex'}
            justifyContent={'space-between'}
            alignItems={'center'}
            color="white"
          >
            <img src={logo} alt="CADer" style={{ width: '65px' }} />
            <IoNotificationsOutline fontSize={'28px'} />
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

          <BasicDivider
            borderBottomWidth={0.5}
            color="rgba(222, 222, 222, 1)"
          />

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

        <Box px={2} className="overlapping-header">
          {/* ⚡ Quick Actions */}
          <Stack spacing={2}>
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
                      onClick={() => {
                        item.type === 'unit'
                          ? handleOpen('unit converter')
                          : navigate(item.link);
                      }}
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

            {/* Overview */}
            <Typography fontWeight={700} fontSize="16px">
              Overview
            </Typography>

            <Grid container columns={12} spacing={2}>
              <Grid size={{ xs: above385 ? 6 : 12 }}>
                <BasicCard
                  key={global}
                  component={motion.div}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{
                    y: -5,
                    boxShadow: '0px 8px 20px rgba(0,0,0,0.1)',
                  }}
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
                  whileHover={{
                    y: -5,
                    boxShadow: '0px 8px 20px rgba(0,0,0,0.1)',
                  }}
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
          </Stack>

          <Stack spacing={2} mt={2} sx={{ display: 'none' }}>
            <Typography fontWeight={700} fontSize="16px">
              Tasks
            </Typography>
          </Stack>
        </Box>

        <Stack spacing={2} px={2} overflow={'hidden'}>
          {taskData.map((task, idx) => (
            <BasicCard
              key={idx}
              sx={{
                borderRadius: 4,
                boxShadow: 1,
                bgcolor: '#fff',
              }}
              component={motion.div}
              {...animations[idx % 2]}
              whileHover={{
                y: -5,
                boxShadow: '0px 8px 20px rgba(0,0,0,0.1)',
              }}
              transition={{ duration: 0.4, delay: 0.6 + idx * 0.1 }}
              content={
                <Box position={'relative'}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    className="task-card-inner"
                  >
                    {/* Left Side - Time + Title + Description */}
                    <Stack spacing={1}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IoTime fontSize={18} color="#2897FF" />
                        <Typography fontSize={14} color="#2897FF">
                          {task.createdAt}
                        </Typography>
                      </Stack>

                      <Typography fontWeight={700} fontSize="16px">
                        {task.title}
                      </Typography>

                      <Typography fontSize={14} color="text.secondary">
                        {task.description}
                      </Typography>
                    </Stack>

                    {/* Status */}

                    <StatusChip status={task.status} />
                  </Stack>
                </Box>
              }
            />
          ))}
        </Stack>
      </Stack>
    </>
  );
};

export default Home;
