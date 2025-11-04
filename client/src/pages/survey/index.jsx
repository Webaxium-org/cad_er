import { Box, Stack, Typography } from '@mui/material';
import LandingImg from '../../assets/landing.jpg';
import BasicButtons from '../../components/BasicButton';
import { FaRoad } from 'react-icons/fa6';
import { FaWater } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import SimpleAlert from '../../components/SimpleAlert';
import { GoAlert } from 'react-icons/go';
import { useNavigate } from 'react-router-dom';
import OutlinedCard from './components/OutlinedCard';
import { stopLoading } from '../../redux/loadingSlice';
import { useDispatch } from 'react-redux';

const cardData = [
  {
    id: 0,
    icon: <FaRoad fontSize={'26px'} color="#B8B8B8" />,
    title: 'Road survey',
    description:
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem',
  },
  {
    id: 1,
    icon: <FaWater fontSize={'26px'} color="#B8B8B8" />,
    title: 'Waterbodies',
    description:
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem',
  },
];

const alertData = {
  icon: <GoAlert fontSize="inherit" />,
  severity: 'error',
  message: 'Work in progress!',
};

const Index = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [active, setActive] = useState(0);

  const [showAlert, setShowAlert] = useState(false);

  const handleChangeActive = (value) => setActive(value);

  const handleSubmit = () => {
    if (active === 1) {
      return setShowAlert(true);
    }

    if (showAlert) setShowAlert(false);
    navigate('/survey/road-survey');
  };

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  return (
    <Box>
      {showAlert && <SimpleAlert {...alertData} />}
      <Stack spacing={5}>
        <Box className="landing-img-wrapper">
          <img
            src={LandingImg}
            srcSet={`${LandingImg}?w=800 800w, ${LandingImg}?w=1600 1600w, ${LandingImg}?w=2400 2400w`}
            sizes="100vw"
            alt="landing"
            // loading="lazy"
            className="landing-img"
          />
        </Box>

        <Stack alignItems={'center'}>
          <Typography
            fontSize={'26px'}
            fontWeight={700}
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/survey/purpose')}
          >
            Welcome To CADer
          </Typography>
          <Typography fontSize={'16px'} fontWeight={400} color="#434343">
            What type of survey do you want to perform?
          </Typography>
        </Stack>

        <Stack direction={'row'} justifyContent={'center'} px={'24px'} gap={3}>
          {cardData.map((data, idx) => (
            <OutlinedCard
              key={idx}
              card={data}
              selected={idx === active}
              onClick={handleChangeActive}
            />
          ))}
        </Stack>

        <Box px={'24px'} className="landing-btn">
          <BasicButtons
            value={'Continue'}
            sx={{ backgroundColor: '#0059E7', height: '45px' }}
            fullWidth={true}
            onClick={handleSubmit}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default Index;
