import { FaSignOutAlt } from 'react-icons/fa';
import { IoHomeOutline } from 'react-icons/io5';
import { GoOrganization, GoProject } from 'react-icons/go';
import { FaUsers } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logOut } from '../redux/userSlice';
import { persistor } from '../redux/store';
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
import { useEffect, useState } from 'react';
import { tokenService } from '../services/tokenService';

const menuListDetails = [
  {
    id: '1',
    label: 'Home',
    icon: <IoHomeOutline />,
    path: '/',
  },
  {
    label: 'Organizations',
    icon: <GoOrganization />,
    path: '/organizations',
    required: ['Super Admin'],
  },
  {
    label: 'Users',
    icon: <FaUsers />,
    path: '/users',
    required: [
      'Super Admin',
      'Survey Manager',
      'Chief Surveyor',
      'Senior Surveyor',
    ],
  },
  { label: 'Projects', icon: <GoProject />, path: '/survey' },
];

const DrawerList = ({ toggleDrawer }) => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);

  const [menuList, setMenuList] = useState([]);

  const handleNavigate = (link) => {
    navigate(link);
  };

  const handleLogout = async () => {
    try {
      // 1. Call backend to remove refresh token + clear cookies
      await logoutUser();

      // 2. Clear frontend token (in-memory)
      tokenService.clear();

      // 3. Clear redux state
      dispatch(logOut());

      // 4. Clear persisted redux cache
      persistor.purge();

      // 5. Redirect to login/home
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);

      // Even if backend fails, still clear client state
      tokenService.clear();
      dispatch(logOut());
      persistor.purge();
      navigate('/login');
    }
  };

  useEffect(() => {
    if (user) {
      const filteredMenu = menuListDetails.filter((menu) =>
        menu.required ? menu.required.includes(user.role) : true
      );

      setMenuList(filteredMenu);
    }
  }, [user]);

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
        alignItems="center"
        spacing={2}
        sx={{
          p: 2,
          backgroundColor: '#2775ad',
          color: 'white',
        }}
      >
        <Avatar
          src=""
          alt="User Avatar"
          sx={{ width: 48, height: 48, border: '2px solid white' }}
        />
        <Box>
          <Typography fontWeight={600}>{user?.name}</Typography>
          <Typography fontSize="0.8rem" sx={{ opacity: 0.9 }}>
            {user?.email}
          </Typography>
        </Box>
      </Stack>

      {/* 🔹 Menu Items */}
      <List sx={{ flexGrow: 1 }}>
        {menuList.map((item) => (
          <ListItem
            key={item.label}
            disablePadding
            onClick={() => handleNavigate(item.path)}
          >
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
                primary={item.label}
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
