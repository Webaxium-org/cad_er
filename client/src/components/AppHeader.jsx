import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Stack,
  Box,
  Typography,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Divider,
  Container,
} from "@mui/material";
import TemporaryDrawer from "./TemporaryDrawer";
import DrawerList from "./DrawerList";
import profileImage from "../assets/blank-profile-picture.webp";

const PRIMARY_BRAND = "#6366f1";

const Icons = {
  Search: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Notification: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  Options: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="12" cy="5" r="1"></circle>
      <circle cx="12" cy="19" r="1"></circle>
    </svg>
  ),
};

const AppHeader = ({ sidebar = true, showSearch = true, showNotifications = true }) => {
  const [search, setSearch] = useState("");
  const { user } = useSelector((state) => state.user || { user: null });
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = (newOpen) => () => setDrawerOpen(newOpen);

  const [anchorEl, setAnchorEl] = useState(null);
  const handleNotifClick = (event) => setAnchorEl(event.currentTarget);
  const handleNotifClose = () => setAnchorEl(null);

  const notifications = [
    { title: "System maintenance scheduled", time: "10 min ago" },
    { title: "New Survey Assigned: Sector 4", time: "1 hr ago" },
    { title: "Weekly Report #42 ready", time: "3 hr ago" },
  ];

  return (
    <>
      <TemporaryDrawer
        open={drawerOpen}
        toggleDrawer={toggleDrawer}
        drawerList={<DrawerList toggleDrawer={toggleDrawer} />}
      />

      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          background: "rgba(79, 70, 229, 0.95)", // High opacity Indigo
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          pt: { xs: 0.5, md: 1 },
          pb: { xs: 0.5, md: 1 },
          color: "white",
          boxShadow: "0 10px 30px -10px rgba(79, 70, 229, 0.5)",
          transition: "all 0.3s ease-in-out",
        }}
      >
        <Box px={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Avatar
                  src={profileImage}
                  onClick={() => navigate("/")}
                  sx={{
                    width: { xs: 40, md: 48 },
                    height: { xs: 40, md: 48 },
                    border: "2px solid rgba(255,255,255,0.3)",
                    bgcolor: PRIMARY_BRAND,
                    cursor: "pointer",
                  }}
                />
              </motion.div>
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{
                    opacity: 0.95,
                    lineHeight: 1.1,
                    fontSize: { xs: "0.85rem", md: "1rem" },
                  }}
                >
                  Hi, {user?.name || "Professional User"}
                </Typography>
                {/* <Typography
                  variant="caption"
                  sx={{ opacity: 0.8, fontWeight: 600 }}
                >
                  {user?.role || "CAD Engineer"}
                </Typography> */}
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              {showSearch && <TextField
                size="small"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate("/survey", { state: { search: search } });
                  }
                }}
                sx={{
                  display: { xs: "none", sm: "flex" },
                  width: { sm: 220, md: 300 },
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "rgba(255,255,255,0.15)",
                    borderRadius: "16px",
                    color: "white",
                    fontSize: "0.85rem",
                    "& fieldset": { border: "none" },
                    "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      <Icons.Search />
                    </InputAdornment>
                  ),
                }}
              />}

              {showNotifications && <IconButton
                onClick={handleNotifClick}
                sx={{
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.15)",
                  borderRadius: "14px",
                  p: { xs: 0.8, md: 1.2 },
                }}
              >
                <Badge color="error" variant="dot">
                  <Icons.Notification />
                </Badge>
              </IconButton>}

              {showNotifications && <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleNotifClose}
                disableScrollLock={true}
                PaperProps={{
                  sx: { width: 300, mt: 1.5, borderRadius: "12px" },
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{ px: 2, py: 1 }}
                >
                  Notifications
                </Typography>
                <Divider />
                {notifications.map((notif, idx) => (
                  <MenuItem key={idx} onClick={handleNotifClose} sx={{ mb: 1 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {notif.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notif.time}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Menu>}

              {sidebar && (
                <IconButton
                  onClick={toggleDrawer(true)}
                  sx={{
                    color: "white",
                    bgcolor: "rgba(255,255,255,0.15)",
                    borderRadius: "14px",
                    p: { xs: 0.8, md: 1.2 },
                  }}
                >
                  <Icons.Options />
                </IconButton>
              )}
            </Stack>
          </Stack>
        </Box>
      </Box>
    </>
  );
};

export default AppHeader;
