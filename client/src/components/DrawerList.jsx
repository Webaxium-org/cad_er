import { FaSignOutAlt } from "react-icons/fa";
import { IoHomeOutline } from "react-icons/io5";
import { GoPerson } from "react-icons/go";
import { GoOrganization } from "react-icons/go";
import { PiUsersThree } from "react-icons/pi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { logOut } from "../redux/userSlice";
import { persistor } from "../redux/store";
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
} from "@mui/material";
import { useEffect, useState } from "react";
import { logoutUser } from "../services/indexServices";
import BasicDivider from "./BasicDevider";

const menuListDetails = [
  {
    id: "1",
    label: "Home",
    icon: <IoHomeOutline />,
    path: "/",
  },
  {
    id: "2",
    label: "Profile",
    icon: <GoPerson />,
    path: "/profile",
  },
  {
    label: "Organizations",
    icon: <GoOrganization />,
    path: "/organizations",
    required: ["Super Admin"],
  },
  {
    label: "Users",
    icon: <PiUsersThree />,
    path: "/users",
    required: [
      "Super Admin",
      "Survey Manager",
      "Chief Surveyor",
      "Senior Surveyor",
    ],
  },
];

const DrawerList = ({ toggleDrawer }) => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const location = useLocation();

  const { user } = useSelector((state) => state.user);

  const [menuList, setMenuList] = useState([]);

  const handleNavigate = (link) => {
    navigate(link);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      dispatch(logOut());
      persistor.purge();

      navigate("/login", { replace: true });
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
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "#f9f9fb",
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
          backgroundColor: "#006FFD",
          color: "white",
        }}
      >
        <Avatar
          src=""
          alt="User Avatar"
          sx={{ width: 48, height: 48, border: "2px solid white" }}
        />
        <Box>
          <Typography fontWeight={600}>{user?.name}</Typography>
          <Typography fontSize="0.8rem" sx={{ opacity: 0.9 }}>
            {user?.email}
          </Typography>
        </Box>

        <BasicDivider
          borderBottomWidth={0.5}
          color="#6ca1d7"
          style={{ width: "100%" }}
        />
        <Stack direction="row" justifyContent="space-between" width="100%">
          <StatItem label="Surveys" value={user?.surveys ?? 0} />
          <StatItem label="Completed" value={user?.completed ?? 0} />
          <StatItem label="Pending" value={user?.pending ?? 0} />
        </Stack>
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
                borderRadius: "8px",
                mx: 1,
                my: 0.5,
                backgroundColor:
                  location.pathname === item.path ? "#006ffd29" : "transparent",
                "&:hover": {
                  backgroundColor: "#006ffd29",
                },
              }}
            >
              <ListItemIcon sx={{ color: "#006FFD", minWidth: 40 }}>
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
              borderRadius: "8px",
              mx: 1,
              "&:hover": {
                backgroundColor: "rgba(255, 0, 0, 0.08)",
              },
            }}
          >
            <ListItemIcon sx={{ color: "red", minWidth: 40 }}>
              <FaSignOutAlt />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontWeight: 500, color: "red" }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );
};

export default DrawerList;

const StatItem = ({ label, value }) => (
  <Box textAlign="center" width="33%">
    <Typography fontSize="16px" fontWeight={700}>
      {value}
    </Typography>
    <Typography fontSize="12px">{label}</Typography>
  </Box>
);
