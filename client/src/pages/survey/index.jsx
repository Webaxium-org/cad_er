import { Box, Stack, Typography } from '@mui/material';
import BasicButtons from '../../components/BasicButton';
import { FaRoad } from 'react-icons/fa6';
import { FaWater } from 'react-icons/fa';
import { SiLevelsdotfyi } from 'react-icons/si';
import { useEffect, useState } from 'react';
import SimpleAlert from '../../components/SimpleAlert';
import { GoAlert } from 'react-icons/go';
import { useNavigate } from 'react-router-dom';
import OutlinedCard from './components/OutlinedCard';
import { stopLoading } from '../../redux/loadingSlice';
import { useDispatch } from 'react-redux';
import { IoIosArrowForward } from 'react-icons/io';
import BigHeader from '../../components/BigHeader';
import { SlTarget } from 'react-icons/sl';

const cardData = [
  {
    id: 0,
    icon: <FaRoad fontSize={'26px'} color="#B8B8B8" />,
    title: 'Road survey',
  },
  {
    id: 1,
    icon: <FaWater fontSize={'26px'} color="#B8B8B8" />,
    title: 'Water way',
  },
  {
    id: 2,
    icon: <SiLevelsdotfyi fontSize={'26px'} color="#B8B8B8" />,
    title: 'Fly level',
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
    if (active > 0) {
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
      <BigHeader />

      {showAlert && <SimpleAlert {...alertData} />}

      <Stack spacing={2} p={2} className="overlapping-header">
        <Stack alignItems={'center'} spacing={2}>
          <BasicButtons
            value={
              <Box display={'flex'} gap={1} alignItems={'center'}>
                Calibration
                <SlTarget fontSize={'20px'} />
              </Box>
            }
            sx={{ backgroundColor: 'rgb(0 111 253)', height: '45px' }}
            fullWidth={true}
          />
          <Typography fontSize={13} fontWeight={400} color="#434343">
            What type of survey do you want to perform using Auto Level?
          </Typography>
        </Stack>

        <Stack direction={'row'} justifyContent={'center'} px={'24px'} gap={1}>
          {cardData.map((data, idx) => (
            <OutlinedCard
              key={idx}
              card={data}
              selected={idx === active}
              onClick={handleChangeActive}
            />
          ))}
        </Stack>

        <Box>
          <BasicButtons
            value={
              <Box display={'flex'} gap={1} alignItems={'center'}>
                Continue
                <IoIosArrowForward fontSize={'20px'} />
              </Box>
            }
            sx={{ backgroundColor: 'rgba(24, 195, 127, 1)', height: '45px' }}
            fullWidth={true}
            onClick={handleSubmit}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default Index;
