import { FaSignOutAlt } from 'react-icons/fa';
import { IoAddCircleOutline, IoHomeOutline } from 'react-icons/io5';
import { RiSurveyLine } from 'react-icons/ri';
import { TbReportAnalytics } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logOut } from '../redux/userSlice';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Typography,
  Stack,
} from '@mui/material';

const DrawerList = ({ toggleDrawer }) => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { currentUser } = useSelector((state) => state.user);

  const handleLogout = () => {
    dispatch(logOut());

    navigate('/');
  };

  return (
    <Box
      sx={{
        width: 260,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#f9f9fb',
      }}
      role="presentation"
      onClick={toggleDrawer(false)}
    >
      {/* 👤 User Profile Section */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, #6334FA 0%, #8E6CFF 100%)',
          color: 'white',
        }}
      >
        <Avatar
          src=""
          alt="User Avatar"
          sx={{ width: 48, height: 48, border: '2px solid white' }}
        />
        <Box>
          <Typography fontWeight={600}>{currentUser?.name}</Typography>
          <Typography fontSize="0.8rem" sx={{ opacity: 0.9 }}>
            {currentUser?.email}
          </Typography>
        </Box>
      </Stack>

      {/* 🔹 Menu Items */}
      <List sx={{ flexGrow: 1 }}>
        {[
          { text: 'Home', icon: <IoHomeOutline />, path: '/' },
          { text: 'Surveys', icon: <RiSurveyLine />, path: '/survey' },
          { text: 'Reports', icon: <TbReportAnalytics />, path: '/reports' },
          { text: 'Settings', icon: <IoAddCircleOutline />, path: '/settings' },
        ].map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              sx={{
                borderRadius: '8px',
                mx: 1,
                my: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(99, 52, 250, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ color: '#6334FA', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* 🚪 Logout Button */}
      <Box sx={{ p: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: '8px',
              mx: 1,
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'red', minWidth: 40 }}>
              <FaSignOutAlt />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontWeight: 500, color: 'red' }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );
};

export default DrawerList;
