import { useEffect, useState } from 'react';
import { Stack, Box, Typography, Grid, Paper, Avatar } from '@mui/material';
import { IoAddCircleOutline } from 'react-icons/io5';
import { RiSurveyLine } from 'react-icons/ri';
import { GoProject } from 'react-icons/go';

import { TbReportAnalytics } from 'react-icons/tb';

import { useDispatch, useSelector } from 'react-redux';
import { stopLoading } from '../../redux/loadingSlice';
import { useNavigate } from 'react-router-dom';
import BasicInput from '../../components/BasicInput';

import { IoMdNotifications } from 'react-icons/io';

import {
  WiDaySunny,
  WiCloud,
  WiRain,
  WiThunderstorm,
  WiFog,
} from 'react-icons/wi';

const getWeatherIcon = (code) => {
  if (code === 0) return <WiDaySunny />; // Clear
  if ([1, 2].includes(code)) return <WiCloud />; // Partly cloudy
  if (code === 3) return <WiCloud />; // Overcast
  if ([51, 53, 55].includes(code)) return <WiFog />; // Drizzle
  if ([61, 63, 65].includes(code)) return <WiRain />; // Rain
  if ([80, 81, 82].includes(code)) return <WiRain />; // Showers
  if ([95, 96, 99].includes(code)) return <WiThunderstorm />; // Storm

  return <WiDaySunny />;
};

const actions = [
  { label: 'Projects', icon: <GoProject size={28} />, link: '/survey' },
  {
    label: 'Surveys',
    icon: <RiSurveyLine size={28} />,
    link: '/survey/purpose',
  },
  { label: 'Reports', icon: <TbReportAnalytics size={28} />, link: '#' },
  {
    label: 'Add Survey',
    icon: <IoAddCircleOutline size={28} />,
    link: '/survey/add-survey',
  },
];

const otherLinks = [];

const Home = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { currentUser } = useSelector((state) => state.user);

  const handleNavigate = (link) => {
    navigate(link);
  };

  const [temperature, setTemperature] = useState(null);
  const [city, setCity] = useState('Loading...');
  const [weatherCode, setWeatherCode] = useState(null);

  const getIconFromWMO = (code) => {
    const map = {
      0: '01d',
      1: '02d',
      2: '03d',
      3: '04d',
      45: '50d',
      48: '50d',
      51: '09d',
      53: '09d',
      55: '09d',
      61: '10d',
      63: '10d',
      65: '10d',
      71: '13d',
      73: '13d',
      75: '13d',
      77: '13d',
      80: '09d',
      81: '09d',
      82: '09d',
      95: '11d',
      96: '11d',
      99: '11d',
    };
    return map[code] || '01d';
  };

  useEffect(() => {
    const loadWeather = () => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const wURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const wRes = await fetch(wURL);
        const wData = await wRes.json();

        setTemperature(wData.current_weather.temperature);
        setWeatherCode(wData.current_weather.weathercode);

        const gURL = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
        const gRes = await fetch(gURL);
        const gData = await gRes.json();

        setCity(
          gData.address.city ||
            gData.address.town ||
            gData.address.village ||
            'Unknown'
        );
      });
    };

    loadWeather();
  }, []);

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  return (
    <Stack spacing={2} pb={10} sx={{ bgcolor: '#F7F7FF' }}>
      {/* 🌈 HEADER */}
      <Stack
        sx={{
          position: 'relative',
          borderBottomLeftRadius: '28px',
          borderBottomRightRadius: '28px',
          overflow: 'hidden',
          color: '#fff',
          backgroundColor: 'rgba(99, 53, 250, 1)',
          p: 2,
        }}
        spacing={2}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("src/assets/background-img.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.25,
            zIndex: 0,
          }}
        ></div>

        {/* /* Content */}
        <Stack sx={{ position: 'relative', zIndex: 1 }} spacing={2}>
          {/* Header Row */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            {/* Temperature + City */}
            <Box display="flex" alignItems="center" gap={1}>
              <img
                src={`https://openweathermap.org/img/wn/${getIconFromWMO(
                  weatherCode
                )}@2x.png`}
                alt="weather"
                style={{ width: 32, height: 32 }}
              />

              <Box>
                <Typography fontWeight={600} fontSize="14px">
                  {temperature !== null ? `${temperature}°C` : '...'}
                </Typography>
                <Typography fontSize="12px" sx={{ opacity: 0.8 }}>
                  {city}
                </Typography>
              </Box>
            </Box>

            <Typography fontSize="22px" fontWeight="700" letterSpacing={0.5}>
              CADER
            </Typography>

            <IoMdNotifications size={24} />
          </Stack>

          {/* User greeting */}
          <Box>
            <Typography fontSize="14px" mt={3} sx={{ opacity: 0.85 }}>
              Hello, Welcome 🎉
            </Typography>
            <Typography fontSize="20px" fontWeight="600">
              {currentUser?.name}
            </Typography>
          </Box>

          {/* Search bar */}
          <Box>
            <BasicInput placeholder="Search" />
          </Box>
        </Stack>
      </Stack>

      {/* ⚡ Quick Actions */}
      <Box px={2}>
        <Typography fontWeight={700} fontSize="16px" mb={1}>
          Quick Links
        </Typography>
        <Grid container spacing={2} justifyContent={'center'}>
          {' '}
          {actions.map((item, i) => (
            <Grid key={i} size={{ xs: 3 }}>
              <Stack alignItems={'center'} spacing={0.5}>
                {' '}
                <Paper
                  elevation={2}
                  sx={{
                    px: 2.5,
                    py: 2,
                    borderRadius: '22px',
                    textAlign: 'center',
                    backgroundColor: 'rgba(109, 66, 250, 0.21)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    // boxShadow: 'none',
                    width: 'fit-content',
                    boxShadow: '0 3px 12px rgba(0,0,0,0.06)',
                  }}
                  onClick={() => handleNavigate(item.link)}
                >
                  {' '}
                  <Box sx={{ color: '#6334FA' }}>{item.icon}</Box>{' '}
                </Paper>{' '}
                <Typography fontSize="12px" fontWeight={500} align="center">
                  {' '}
                  {item.label}{' '}
                </Typography>{' '}
              </Stack>
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
    </Stack>
  );
};

export default Home;
