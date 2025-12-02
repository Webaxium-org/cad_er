import { motion } from 'framer-motion';
import { Box, Grid, Stack, Typography, useMediaQuery } from '@mui/material';
import BasicCard from '../../components/BasicCard';
import Lottie from 'lottie-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { stopLoading } from '../../redux/loadingSlice';
import { useEffect, useState } from 'react';
import BasicButton from '../../components/BasicButton';
import SimpleAlert from '../../components/SimpleAlert';

import { GoAlert } from 'react-icons/go';
import totalStationIcon from '../../assets/icons/compass.json';
import DGPSIcon from '../../assets/icons/GPS Navigation.json';
import DroneIcon from '../../assets/icons/Drone Camera.json';
import BathymetryIcon from '../../assets/icons/Boat-Looking-For-Land.json';
import { IoIosArrowForward } from 'react-icons/io';

const equipmentList = [
  {
    label: 'Auto Level',
    icon: totalStationIcon,
    link: '#',
    color: '#006FFD',
    size: 12,
  },
  {
    label: 'Total Station',
    icon: totalStationIcon,
    link: '#',
    color: '#006FFD',
  },
  {
    label: 'DGPS',
    icon: DGPSIcon,
    link: '#',
    color: '#D98500',
  },
  {
    label: 'Drone',
    icon: DroneIcon,
    link: '#',
    color: '#7A2EFF',
  },
  {
    label: 'Bathymetry',
    icon: BathymetryIcon,
    link: '#',
    color: '#00A79D',
  },
];

const alertData = {
  icon: <GoAlert fontSize="inherit" />,
  severity: 'error',
  message: 'Work in progress!',
};

const animations = [
  { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } },
  { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 } },
];

const SelectEquipment = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { global } = useSelector((state) => state.loading);

  const [active, setActive] = useState(0);

  const [showAlert, setShowAlert] = useState(false);

  const above290 = useMediaQuery('(min-width:290px)');

  const handleChangeActive = (value) => setActive(value);

  const handleSubmit = () => {
    if (active === 1) {
      return setShowAlert(true);
    }

    if (showAlert) setShowAlert(false);
    navigate('/survey/add-survey');
  };

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  return (
    <Box p={2} overflow={'hidden'}>
      {showAlert && <SimpleAlert {...alertData} />}

      <Typography
        variant="h6"
        fontSize={18}
        fontWeight={700}
        align="center"
        mb={2}
      >
        Select Your Equipment
      </Typography>

      <Grid container columns={12} spacing={2}>
        {equipmentList.map((equipment, idx) => (
          <Grid
            key={idx}
            size={{ xs: equipment.size ? equipment.size : above290 ? 6 : 12 }}
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
                border: idx === active ? '2px solid blue' : '2px solid white',
              }}
              content={
                <Stack spacing={1}>
                  <Box width={'70px'}>
                    <Lottie animationData={equipment.icon} />
                  </Box>
                  <Typography fontWeight={700} fontSize="14px">
                    {equipment.label}
                  </Typography>
                </Stack>
              }
              onClick={() => handleChangeActive(idx)}
            />
          </Grid>
        ))}
      </Grid>

      <Box mt={2} className="landing-btn">
        <BasicButton
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
    </Box>
  );
};

export default SelectEquipment;
