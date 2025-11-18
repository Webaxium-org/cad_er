import Box from '@mui/material/Box';

import Preloader from './Preloader';
import CustomSnackbar from '../components/CustomSnackbar';
import { Outlet } from 'react-router-dom';
import BasicBottomNavigation from '../components/BasicBottomNavigation';
import CookieBlockedDialog from './CookieBlockedDialog';

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

        {/* Add this here */}
        {/* <CookieBlockedDialog /> */}
      </Box>
    </>
  );
};

export default RootLayout;
