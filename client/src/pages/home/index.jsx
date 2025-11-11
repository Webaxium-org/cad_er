import { useEffect, useState } from 'react';
import { Stack, Box, Typography, Grid, Paper, Avatar } from '@mui/material';
import {
  IoNotificationsOutline,
  IoHomeOutline,
  IoAddCircleOutline,
  IoPerson,
  IoMenu,
} from 'react-icons/io5';
import { RiSurveyLine } from 'react-icons/ri';
import { GoProject } from 'react-icons/go';

import { TbReportAnalytics } from 'react-icons/tb';
import {
  MdOutlineAssignment,
  MdOutlinePerson,
  MdOutlineMenu,
} from 'react-icons/md';

import { useDispatch } from 'react-redux';
import { stopLoading } from '../../redux/loadingSlice';
import { useNavigate } from 'react-router-dom';
import BasicBottomNavigation from '../../components/BasicBottomNavigation';
import BasicTextFields from '../../components/BasicTextFields';

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

const navItems = [
  { label: 'Home', value: 'Home', icon: <IoHomeOutline size={22} /> },
  { label: 'Projects', value: 'Projects', icon: <GoProject size={22} /> },
  { label: 'You', value: 'You', icon: <IoPerson size={22} /> },
  { label: 'Menu', value: 'Menu', icon: <IoMenu size={22} /> },
];

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [active, setActive] = useState('Home');

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
        <Typography fontSize="14px">Hi, Abhijith Suresh</Typography>

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
        <Grid container spacing={1}>
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
      <Box px={2}>
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
      </Box>
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        sx={{
          backgroundColor: '#fff',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-around',
          py: 1.2,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <BasicBottomNavigation active={'Home'} data={navItems} />
      </Box>
    </Stack>
  );
};

export default Home;
