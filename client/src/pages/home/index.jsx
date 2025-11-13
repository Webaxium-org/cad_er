import { useEffect } from 'react';
import { Stack, Box, Typography, Grid, Paper, Avatar } from '@mui/material';
import { IoNotificationsOutline, IoAddCircleOutline } from 'react-icons/io5';
import { RiSurveyLine } from 'react-icons/ri';
import { GoProject } from 'react-icons/go';

import { TbReportAnalytics } from 'react-icons/tb';

import { useDispatch, useSelector } from 'react-redux';
import { stopLoading } from '../../redux/loadingSlice';
import { useNavigate } from 'react-router-dom';
import BasicTextFields from '../../components/BasicTextFields';
import BasicInput from '../../components/BasicInput';

const actions = [
  { label: 'Projects', icon: <GoProject size={24} />, link: '/survey' },
  {
    label: 'Surveys',
    icon: <RiSurveyLine size={24} />,
    link: '/survey/purpose',
  },
  { label: 'Reports', icon: <TbReportAnalytics size={24} />, link: '#' },
  {
    label: 'Add Survey',
    icon: <IoAddCircleOutline size={24} />,
    link: '/survey/add-survey',
  },
];

const otherLinks = [];

const Home = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  const handleNavigate = (link) => {
    navigate(link);
  };

  return (
    <Stack spacing={2} pb={10}>
      {/* 🌈 Header */}

      <Stack
        sx={{
          background: '#6334FA',
          color: '#fff',
          borderBottomLeftRadius: '30px',
          borderBottomRightRadius: '30px',
          p: 2,
          boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
        }}
        spacing={2}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography fontSize="28px">CADer</Typography>
          <IoNotificationsOutline size={24} color="#fff" />
        </Box>
        <Typography fontSize="14px">Hi, {currentUser?.name}</Typography>

        <Box mt={2}>
          <BasicTextFields
            type="text"
            placeholder={'Search...'}
            sx={{
              '& input': {
                borderRadius: '16px',
                border: '1px solid white',
              },
            }}
          />
        </Box>
      </Stack>

      {/* ⚡ Quick Actions */}
      <Box px={2}>
        <Typography fontWeight={700} fontSize="16px" mb={1}>
          Quick Links
        </Typography>
        <Grid container spacing={2}>
          {' '}
          {actions.map((item, i) => (
            <Grid key={i} size={{ xs: 3 }}>
              {' '}
              <Paper
                elevation={2}
                sx={{
                  py: 1.5,
                  borderRadius: '16px',
                  textAlign: 'center',
                  backgroundColor: '#F4F0FF',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#EAE4FF',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 10px rgba(99, 52, 250, 0.15)',
                  },
                }}
                onClick={() => handleNavigate(item.link)}
              >
                {' '}
                <Box sx={{ color: '#6334FA', fontSize: 20 }}>
                  {item.icon}
                </Box>{' '}
                <Typography fontSize="12px"> {item.label} </Typography>{' '}
              </Paper>{' '}
            </Grid>
          ))}{' '}
        </Grid>{' '}
      </Box>

      {/* 🧾 Payment List */}
      <Box px={2}>
        <Typography fontWeight={700} fontSize="16px" mt={2} mb={1}>
          Overview
        </Typography>
        <Grid container columns={12} spacing={2}>
          {otherLinks.map((label, i) => (
            <Grid size={{ xs: 3 }} key={i}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  textAlign: 'center',
                  backgroundColor: '#fff',
                }}
              >
                <Avatar sx={{ bgcolor: '#6334FA', width: 40, height: 40 }}>
                  {label[0]}
                </Avatar>
                <Typography fontSize="12px" mt={1}>
                  {label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 🎁 Promo Banner */}
      {/* <Box px={2}>
        <Paper
          sx={{
            mt: 3,
            p: 2,
            borderRadius: '16px',
            background: 'linear-gradient(90deg, #4F8CFF, #6B4EFF)',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <Typography fontWeight={700}>
            Special Offer for Today's Top Up
          </Typography>
          <Typography fontSize="12px">
            Get discount for every top up transaction
          </Typography>
        </Paper>
      </Box> */}

      {/* <Box px={10}>
        <BasicInput
          label="Email"
          placeholder="Enter your email"
          value={''}
          onChange={() => {}}
          error={'error !!'}
          helperText="We'll never share your email."
        />
        <BasicInput
          label="Email"
          placeholder="Enter your email"
          value={''}
          onChange={() => {}}
          helperText="We'll never share your email."
        />
        <BasicInput
          label="Email"
          placeholder="Enter your email"
          value={''}
          onChange={() => {}}
          helperText="We'll never share your email."
        />
      </Box> */}
    </Stack>
  );
};

export default Home;
