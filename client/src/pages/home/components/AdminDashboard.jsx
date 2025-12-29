import {
  Box,
  Stack,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
} from "@mui/material";
import {
  MdPeople,
  MdSchool,
  MdAttachMoney,
  MdNotifications,
} from "react-icons/md";
import BackgroundImage from "../../../assets/background-img.png";
import logo from "../../../assets/logo/CADer logo-main.png";
import Sidebar from "../../../components/Sidebar";
import ImageAvatars from "../../../components/ImageAvatar";
import { useNavigate } from "react-router-dom";

const AdminDashboard = ({ user, data }) => {
  const navigate = useNavigate();

  return (
    <Stack spacing={3} sx={{ userSelect: "none" }} overflow="hidden">
      {/* ================= HEADER ================= */}
      <Stack
        p={2}
        height="155px"
        sx={{
          position: "relative",
          background:
            "linear-gradient(217.64deg, #0A3BAF -5.84%, #0025A0 106.73%)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${BackgroundImage})`,
            backgroundSize: "200%",
            backgroundPosition: "center",
            opacity: 0.25,
            zIndex: 0,
            height: "60dvh",
            minHeight: "165px",
          }}
        />

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          zIndex={2}
          color="white"
        >
          <img src={logo} alt="CADer" style={{ width: 65 }} />
          <Sidebar />
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          mt={2}
          zIndex={2}
        >
          <ImageAvatars
            sx={{
              width: 48,
              height: 48,
              backgroundColor: "#fff",
              color: "rgba(40, 151, 255, 1)",
            }}
          />
          <Box color="white">
            <Typography fontSize={14} fontWeight={700}>
              Hello,
            </Typography>
            <Typography fontSize={14} fontWeight={700}>
              {user.name}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* ================= CONTENT ================= */}
      <Box px={2} className="overlapping-header">
        {/* -------- KPI CARDS -------- */}
        <Grid container spacing={2}>
          {[
            {
              label: "Total Users",
              value: data?.users || 0,
              icon: <MdPeople />,
            },
            // { label: "Active Courses", value: "56", icon: <MdSchool /> },
            // { label: "Revenue (₹)", value: "3.2L", icon: <MdAttachMoney /> },
            // {
            //   label: "Pending Requests",
            //   value: "14",
            //   icon: <MdNotifications />,
            // },
          ].map((item, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Box fontSize={22} color="primary.main">
                      {item.icon}
                    </Box>
                    <Typography variant="h6">{item.value}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* -------- QUICK ACTIONS -------- */}
        <Card sx={{ mt: 3, borderRadius: 3 }}>
          <CardContent>
            <Typography fontWeight={700} mb={1}>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={() => navigate("/users")}>
                View Users
              </Button>
              <Button variant="outlined">Create Org</Button>
              {/* <Button variant="outlined">View Payments</Button> */}
            </Stack>
          </CardContent>
        </Card>

        {/* -------- ACTIVITY + STATUS -------- */}
        <Grid container spacing={2} mt={1}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ borderRadius: 3, height: "100%" }}>
              <CardContent>
                <Typography fontWeight={700} mb={1}>
                  Recent Activity
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={1}>
                  <Typography variant="body2">• New user registered</Typography>
                  <Typography variant="body2">
                    • Course “AutoCAD Pro” published
                  </Typography>
                  <Typography variant="body2">
                    • Payment received from Student
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography fontWeight={700} mb={1}>
                  System Status
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={1}>
                  <Typography variant="body2">🟢 API: Online</Typography>
                  <Typography variant="body2">
                    🟢 Database: Connected
                  </Typography>
                  <Typography variant="body2">🟢 Payments: Healthy</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid> */}
        </Grid>
      </Box>
    </Stack>
  );
};

export default AdminDashboard;
