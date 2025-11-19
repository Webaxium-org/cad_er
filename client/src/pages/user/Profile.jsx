import { useEffect } from 'react';
import { Avatar, Box, Typography, Paper, Stack, Divider } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { stopLoading } from '../../redux/loadingSlice';

const Profile = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
        background: 'linear-gradient(180deg, #ffffff, #faf7ff)',
      }}
    >
      <Stack spacing={2} alignItems="center">
        {/* Avatar */}
        <Avatar
          src={user?.avatar}
          alt={user?.name}
          sx={{ width: 64, height: 64, bgcolor: '#6D42FA' }}
        />

        {/* User Info */}
        <Box textAlign="center">
          <Typography fontSize="18px" fontWeight={700}>
            {user?.name || 'N/A'}
          </Typography>

          <Typography fontSize="13px" sx={{ opacity: 0.7 }}>
            {user?.email || 'N/A'}
          </Typography>
        </Box>

        <Divider sx={{ width: '80%' }} />

        {/* Survey Stats */}
        <Stack direction="row" justifyContent="space-between" width="100%">
          <StatItem label="Surveys" value={user?.surveys ?? 0} />
          <StatItem label="Completed" value={user?.completed ?? 0} />
          <StatItem label="Pending" value={user?.pending ?? 0} />
        </Stack>
      </Stack>

      <Stack mt={3} p={3} spacing={2}>
        {/* Personal Info Section */}
        <Section title="Personal Information">
          <Info label="Email" value={user?.email} />
          <Info label="Phone" value={user?.phone || 'N/A'} />
          <Info label="Role" value={user?.role || 'N/A'} />
          <Info label="Location" value={user?.location || 'N/A'} />
        </Section>

        {user?.organization && (
          <>
            <Divider sx={{ width: '100%' }} />

            {/* Organization Info Section */}
            <Section title="Organization Details">
              <Info label="Organization" value={user?.organization} />
              <Info label="Department" value={user?.department} />
              <Info label="Designation" value={user?.designation} />
            </Section>
          </>
        )}
      </Stack>
    </Paper>
  );
};

/* ------------------- Small Components ----------------------- */

const Section = ({ title, children }) => (
  <Box width="100%">
    <Typography fontSize="14px" fontWeight={700} mb={1}>
      {title}
    </Typography>
    <Stack spacing={1.2}>{children}</Stack>
  </Box>
);

const Info = ({ label, value }) => (
  <Box>
    <Typography fontSize="12px" sx={{ opacity: 0.6 }}>
      {label}
    </Typography>
    <Typography fontSize="14px" fontWeight={600}>
      {value || '—'}
    </Typography>
  </Box>
);

const StatItem = ({ label, value }) => (
  <Box textAlign="center" width="33%">
    <Typography fontSize="16px" fontWeight={700}>
      {value}
    </Typography>
    <Typography fontSize="12px" sx={{ opacity: 0.6 }}>
      {label}
    </Typography>
  </Box>
);

export default Profile;
