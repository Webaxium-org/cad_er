import Box from '@mui/material/Box';

import Preloader from './Preloader';
import CustomSnackbar from '../components/CustomSnackbar';
import { Outlet } from 'react-router-dom';
import BasicBottomNavigation from '../components/BasicBottomNavigation';

const RootLayout = () => {
  return (
    <>
      <Preloader />

      <Box width={'100%'} mb={'76.5px'}>
        {/* Global Alert Start*/}

        <CustomSnackbar />

        {/* Global Alert End*/}

        <Outlet />

        <BasicBottomNavigation />
      </Box>
    </>
  );
};

export default RootLayout;
