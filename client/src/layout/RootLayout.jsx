import Box from '@mui/material/Box';

import Preloader from './Preloader';
import CustomSnackbar from '../components/CustomSnackbar';
import { Outlet } from 'react-router-dom';

const RootLayout = () => {
  return (
    <>
      <Preloader />

      <Box className="main-bg" sx={{ width: '100%', maxWidth: { sm: '100%', md: '2500px' } }}>
        {/* Common Alert Start*/}

        <CustomSnackbar />

        {/* Common Alert End*/}

        <Outlet />
      </Box>
    </>
  );
};

export default RootLayout;
