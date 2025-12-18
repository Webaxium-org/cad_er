import * as React from "react";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import { Box } from "@mui/material";

import { GoProject } from "react-icons/go";
import { IoHomeOutline, IoMenu } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import TemporaryDrawer from "./TemporaryDrawer";

import DrawerList from "./DrawerList";

const navItems = [
  {
    label: "Home",
    value: "Home",
    icon: <IoHomeOutline size={22} />,
    path: "/",
  },
  {
    label: "Projects",
    value: "Projects",
    icon: <GoProject size={22} />,
    path: "/survey",
  },
  { label: "Menu", value: "Menu", icon: <IoMenu size={22} />, path: "#" },
];

export default function BasicBottomNavigation() {
  const navigate = useNavigate();

  const { pathname } = useLocation();

  const [value, setValue] = React.useState(null);

  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen) => () => {
    if (!newOpen) {
      setValue("Home");
    }

    setOpen(newOpen);
  };

  const handleChange = (event, newValue) => {
    const item = navItems?.find((i) => i.value === newValue);

    setValue(newValue);

    if (newValue === "Menu") {
      toggleDrawer(!open)();
    } else {
      navigate(item.path);
    }
  };

  React.useEffect(() => {
    const activeNav = navItems?.find((item) => item.path === pathname);

    setValue(activeNav ? activeNav.label : "");
  }, [pathname]);

  return (
    <>
      <TemporaryDrawer
        open={open}
        toggleDrawer={toggleDrawer}
        drawerList={<DrawerList toggleDrawer={toggleDrawer} />}
      />

      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={1000}
        sx={{
          backgroundColor: "#fff",
          borderTop: "1px solid #eee",
          display: "flex",
          justifyContent: "space-around",
          py: 1.2,
          boxShadow: "0 -2px 8px rgba(0,0,0,0.05)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <BottomNavigation
          sx={{
            width: "100%",
            bottom: 0,
            left: 0,
            bgcolor: "#fff",
            // boxShadow: '0 -4px 10px rgba(0,0,0,0.08)',
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",

            "& .MuiBottomNavigationAction-root": {
              color: "#9e9e9e",
              position: "relative",
              transition: "all 0.3s ease",
              "& .MuiSvgIcon-root": {
                fontSize: 26,
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: "-6px",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 0,
                height: 0,
                borderRadius: "50%",
                backgroundColor: "#fff",
                transition: "all 0.3s ease",
                zIndex: -5,
                boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.05)",
              },
              "&::after": {
                content: '""',
                position: "absolute",
                top: "-9px",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 0,
                height: 0,
                borderRadius: "50%",
                backgroundColor: "#006FFD",
                transition: "all 0.3s ease",
                zIndex: -5,
              },
            },

            "& .Mui-selected": {
              color: "#006FFD",
              fontWeight: 600,
              "&::before": {
                width: 50,
                height: 50,
              },
              "&::after": {
                width: 10,
                height: 10,
              },
            },
            "& .Mui-selected svg": { color: "#006FFD" },
          }}
          value={value}
          onChange={handleChange}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Box>
    </>
  );
}
