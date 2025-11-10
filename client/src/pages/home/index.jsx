import { useEffect, useState } from 'react';
import { Stack, Box, Typography, Grid } from '@mui/material';
import { IoNotificationsOutline } from 'react-icons/io5';
import { RiSurveyLine } from 'react-icons/ri';
import { AiOutlineProject } from 'react-icons/ai';
import { TbReportAnalytics } from 'react-icons/tb';
import { IoAddCircleOutline, IoHomeOutline } from 'react-icons/io5';
import {
  MdOutlineAssignment,
  MdOutlinePerson,
  MdOutlineMenu,
} from 'react-icons/md';

import 'animate.css';

import { stopLoading } from '../../redux/loadingSlice';
import { useDispatch } from 'react-redux';
import BasicIconButton from '../../components/IconButton';
import BasicCard from '../../components/BasicCard';
import { useNavigate } from 'react-router-dom';

const actions = [
  {
    label: 'Projects',
    icon: <AiOutlineProject size={28} color="#502EE3" />,
    link: '/survey',
  },
  {
    label: 'Surveys',
    icon: <RiSurveyLine size={28} color="#502EE3" />,
    link: '/survey/purpose',
  },
  {
    label: 'Reports',
    icon: <TbReportAnalytics size={28} color="#502EE3" />,
    link: '#',
  },
  {
    label: 'Add Survey',
    icon: <IoAddCircleOutline size={28} color="#502EE3" />,
    link: '/survey/add-survey',
  },
];

const navItems = [
  { label: 'Home', icon: <IoHomeOutline size={24} /> },
  { label: 'Survey', icon: <MdOutlineAssignment size={24} /> },
  { label: 'You', icon: <MdOutlinePerson size={24} /> },
  { label: 'Menu', icon: <MdOutlineMenu size={24} /> },
];

const Home = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [active, setActive] = useState('Home');

  const handleNavigate = (link) => {
    navigate(link);
  };

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  return (
    <Stack spacing={2} p={2}>
      {/* Top Section */}
      <Box
        display={'flex'}
        justifyContent={'space-between'}
        alignItems={'center'}
      >
        <div></div>
        <Typography
          fontSize={'26px'}
          fontWeight={700}
          sx={{ cursor: 'pointer' }}
        >
          CADer
        </Typography>

        <BasicIconButton
          icon={
            <IoNotificationsOutline
              className="animate__animated animate__swing animate__infinite animate__slower animate__delay-2s"
              style={{
                transformOrigin: 'top center',
                fontSize: '28px',
                color: '#6334FA',
              }}
            />
          }
          label={'Notification'}
          sx={{
            border: '1px solid #dbdbdbad',
          }}
        />
      </Box>

      <Typography fontSize={'12px'} fontWeight={700}>
        Hi, Abhijith Suresh!
      </Typography>

      <BasicCard
        content={
          <Grid container columns={12} columnSpacing={3}>
            {actions.map((item, index) => (
              <Grid key={index} size={{ xs: 3 }}>
                <Stack
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                    },
                  }}
                  onClick={() => handleNavigate(item.link)}
                >
                  <Box
                    sx={{
                      padding: '16px',
                      backgroundColor: '#F1EEFF',
                      width: 'fit-content',
                      borderRadius: '12px',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography mt={1} fontSize="13px" fontWeight={600}>
                    {item.label}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        }
      />

      {/* Bottom Navigation */}
      <Box
        position={'fixed'}
        bottom={0}
        left={0}
        width={'100%'}
        borderTop={'1px solid #dbdbdbad'}
        display={'flex'}
        justifyContent={'space-around'}
        alignItems={'center'}
        height={'56px'}
        zIndex={1000}
      >
        {navItems.map((item) => (
          <Box
            key={item.label}
            onClick={() => setActive(item.label)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: active === item.label ? '#6334FA' : '#000',
              transition: 'all 0.2s ease',
            }}
          >
            {item.icon}
            <Typography fontSize={'12px'} fontWeight={600}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  );
};

export default Home;
