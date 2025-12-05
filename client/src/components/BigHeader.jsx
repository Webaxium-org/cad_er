import { Box, Stack, Typography } from '@mui/material';
import BackgroundImage from '../assets/background-img.png';
import logo from '../assets/logo/CADer logo-main.png';
import { IoNotificationsOutline } from 'react-icons/io5';

const BigHeader = () => {
  return (
    <Stack
      p={2}
      sx={{
        position: 'relative',
        backgroundColor: 'rgba(40, 151, 255, 1)',
        color: 'white',
      }}
      height={'45dvh'}
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

      <Box display={'flex'} justifyContent={'end'} alignItems={'center'}>
        <Box>
          <IoNotificationsOutline fontSize={'28px'} />
        </Box>
      </Box>

      <Box
        display={'flex'}
        justifyContent={'center'}
        alignItems={'center'}
        height={'100%'}
      >
        <img src={logo} alt="CADer" style={{ width: '150px', paddingBottom: '65px' }} />
      </Box>
    </Stack>
  );
};

export default BigHeader;
