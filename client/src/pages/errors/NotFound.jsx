import { Link } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import { stopLoading } from '../../redux/loadingSlice';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Lottie from 'lottie-react';

import UnderMaintenance from '../../assets/icons/Under Maintenance.json';

const NotFound = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  return (
    <Container
      maxWidth="lg"
      sx={{
         minHeight: "calc(100vh - 76.5px)",
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 4,
      }}
    >
      {/* Animation */}
      <Box
        sx={{
          width: { xs: '100%', sm: '70%', md: '50%', lg: '40%' },
          maxWidth: 400,
          mx: 'auto',
        }}
      >
        <Lottie animationData={UnderMaintenance} />
      </Box>

      {/* Text & Button */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          404 - Page Not Found
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          The page you are looking for doesn’t exist.
        </Typography>

        <Button variant="contained" component={Link} to="/" size="large">
          Back to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
