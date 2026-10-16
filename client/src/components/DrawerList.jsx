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
  Dialog,
  TextField,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useEffect, useState } from "react";
import { logoutUser } from "../services/indexServices";
import { IoSettingsOutline } from "react-icons/io5";
import { AiOutlineDelete } from "react-icons/ai";
import { BiSupport } from "react-icons/bi";
import profileImage from "../assets/blank-profile-picture.webp";

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
      // "Survey Manager",
      // "Chief Surveyor",
      // "Senior Surveyor",
    ],
  },
  {
    label: "Tickets",
    icon: <BiSupport />,
    path: "/tickets",
    required: ["Professional"],
  },
  {
    label: "Settings",
    icon: <IoSettingsOutline />,
    path: "/settings",
    required: ["Super Admin"],
    requiredTypes: ["Professional"],
  },
  {
    label: "Trash",
    icon: <AiOutlineDelete />,
    path: "/trash",
  },
];

const DrawerList = ({ toggleDrawer }) => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const location = useLocation();

  const { user } = useSelector((state) => state.user);

  const [menuList, setMenuList] = useState([]);
  const [search, setSearch] = useState("");

  const handleNavigate = (link) => {
    navigate(link);
  };

  const [openLogout, setOpenLogout] = useState(false);

  const handleLogoutClick = (e) => {
    e.stopPropagation(); // prevent drawer from closing
    setOpenLogout(true);
  };

  const cancelLogout = (e) => {
    e.stopPropagation();
    setOpenLogout(false);
  };

  const handleConfirmLogout = async () => {
    setOpenLogout(false);
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      dispatch(logOut());
      await persistor.flush();
      await persistor.purge();

      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    if (user) {
      const filteredMenu = menuListDetails.filter((menu) =>
        (!menu.required && !menu.requiredTypes) ||
        menu.required?.includes(menu.label === "Tickets" ? user.type : user.role) ||
        menu.requiredTypes?.includes(user.type),
      );

      setMenuList(filteredMenu);
    }
  }, [user]);

  return (
    <>
      <Box
        sx={{
          width: 300,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          bgcolor: "#ffffff",
        }}
        role="presentation"
      // onClick={toggleDrawer(false)}
      >
        {/* 👤 Premium User Profile Header */}
        <Box
          sx={{
            p: 3,
            background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
            color: "white",
            position: "relative",
            overflow: "hidden",
            borderRadius: "0 0 28px 28px",
            boxShadow: "0 12px 30px -10px rgba(99, 102, 241, 0.5)",
            mb: 2,
          }}
        >
          <Stack
            alignItems="center"
            spacing={1.5}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Avatar
              src={profileImage}
              alt="User Avatar"
              sx={{
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
                border: "2px solid rgba(255,255,255,0.3)",
                bgcolor: "#6366f1",
              }}
            />
            <Box textAlign="center">
              <Typography
                variant="h6"
                fontWeight={900}
                sx={{ letterSpacing: "-0.5px" }}
              >
                {user?.name || "Professional User"}
              </Typography>
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ opacity: 0.85 }}
              >
                {user?.email || "user@cader.com"}
              </Typography>
            </Box>
          </Stack>
          {/* Decorative elements */}
          <Box
            sx={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -20,
              left: -20,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
            }}
          />
        </Box>

        {/* 📱 Mobile Search Bar */}
        <Box sx={{ px: 2, mb: 1, display: { xs: 'block', sm: 'none' } }}>
          <TextField
            size="small"
            placeholder="Search here..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                toggleDrawer(false)(); // Force close Drawer
                navigate("/survey", { state: { search: search } });
              }
            }}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#f1f5f9",
                borderRadius: "14px",
                fontSize: "0.95rem",
                color: "#334155",
                "& fieldset": { borderColor: "transparent" },
                "&:hover fieldset": { borderColor: "#e2e8f0" },
                "&.Mui-focused fieldset": { borderColor: "#6366f1", borderWidth: "1px" }
              },
              mb: 1
            }}
            slotProps={{
              startAdornment: (
                <Box sx={{ color: "#94a3b8", mr: 1, display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </Box>
              ),
            }}
          />
        </Box>

        {/* 🔹 Enhanced Menu Items */}
        <List sx={{ flexGrow: 1, px: 2, pt: 0 }}>
          {menuList.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem
                key={item.label}
                disablePadding
                onClick={() => handleNavigate(item.path)}
                sx={{ mb: 1 }}
              >
                <ListItemButton
                  sx={{
                    borderRadius: "14px",
                    py: 1.5,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    backgroundColor: isActive ? "#6366f1" : "transparent",
                    color: isActive ? "white" : "#334155",
                    boxShadow: isActive
                      ? "0 8px 20px -6px rgba(99, 102, 241, 0.5)"
                      : "none",
                    "&:hover": {
                      backgroundColor: isActive ? "#4f46e5" : "#f8fafc",
                      transform: isActive ? "none" : "translateY(-2px)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? "white" : "#64748b",
                      minWidth: 44,
                      fontSize: "1.3rem",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 800 : 700,
                      fontSize: "0.95rem",
                      letterSpacing: "0.2px",
                    }}
                  />
                  {isActive && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        bgcolor: "white",
                        borderRadius: "50%",
                        ml: 1,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* 🚪 Action Logout Button */}
        <Box sx={{ p: 2, pb: 4 }}>
          <Divider sx={{ mb: 2, borderColor: "#e2e8f0" }} />
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogoutClick}
              sx={{
                borderRadius: "14px",
                py: 1.5,
                color: "#e11d48",
                backgroundColor: "transparent",
                transition: "all 0.2s ease",
                border: "1px solid transparent",
                "&:hover": {
                  backgroundColor: "#fff1f2",
                  borderColor: "#fda4af",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <ListItemIcon
                sx={{ color: "#e11d48", minWidth: 44, fontSize: "1.3rem" }}
              >
                <FaSignOutAlt />
              </ListItemIcon>
              <ListItemText
                primary=" Sign Out"
                slotProps={{
                  primary: {
                    fontWeight: 800,
                    fontSize: "0.95rem",
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        </Box>
      </Box>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={openLogout}
        onClose={cancelLogout}
        onClick={(e) => e.stopPropagation()} // prevent clicks inside dialog from closing drawer
        sx={{ zIndex: 3000 }}
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Sign Out</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontWeight: 500 }}>
            Are you sure you want to securely sign out of CADER? You will need
            to log in again to access your projects.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={cancelLogout}
            sx={{ fontWeight: 700, color: "#64748b" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLogout}
            variant="contained"
            color="error"
            sx={{ fontWeight: 700, borderRadius: "8px" }}
          >
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DrawerList;

const StatItem = ({ label, value }) => (
  <Box textAlign="center" width="33%">
    <Typography fontSize="20px" fontWeight={900}>
      {value}
    </Typography>
    <Typography
      fontSize="10px"
      fontWeight={800}
      sx={{ opacity: 0.85, letterSpacing: "0.08em" }}
    >
      {label}
    </Typography>
  </Box>
);
