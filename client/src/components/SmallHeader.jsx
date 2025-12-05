import { Box, Stack, Typography } from '@mui/material';
import BackgroundImage from '../assets/background-img.png';
import logo from '../assets/logo/CADer logo-main.png';
import { IoNotificationsOutline } from 'react-icons/io5';

const SmallHeader = () => {
  return (
    <Stack
      p={2}
      sx={{
        position: 'relative',
        backgroundColor: 'rgba(40, 151, 255, 1)',
      }}
      height={'88px'}
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
        <img src={logo} alt="CADer" style={{ width: '90px' }} />

        <Box>
          <IoNotificationsOutline fontSize={'24px'} />
        </Box>
      </Box>
    </Stack>
  );
};

export default SmallHeader;
