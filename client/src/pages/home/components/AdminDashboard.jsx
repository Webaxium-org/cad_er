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
    <Stack spacing={2} sx={{ userSelect: "none" }} overflow="hidden">
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
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            overflowX: "auto",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {[
            {
              label: "Total Users",
              value: data?.totalUsers || 0,
              icon: <MdPeople />,
              bg: "linear-gradient(135deg,#1976d2,#42a5f5)",
            },
            {
              label: "Professionals",
              value: data?.professionals || 0,
              icon: <MdPeople />,
              bg: "linear-gradient(135deg,#2e7d32,#66bb6a)",
            },
            {
              label: "Students",
              value: data?.students || 0,
              icon: <MdPeople />,
              bg: "linear-gradient(135deg,#ed6c02,#ff9800)",
            },
          ].map((item, idx) => (
            <Card
              key={idx}
              sx={{
                minWidth: 130,
                height: 70, // 🔥 controlled height
                borderRadius: 2.5,
                flexShrink: 0,
                background: item.bg,
                color: "#fff",
                display: "flex",
                alignItems: "center",
              }}
              onClick={() => navigate("/users")}
            >
              <CardContent
                sx={{
                  p: 1.5, // 🔥 reduced padding
                  "&:last-child": { pb: 1.5 },
                  width: "100%",
                }}
              >
                <Stack spacing={0.2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box fontSize={20} opacity={0.9}>
                      {item.icon}
                    </Box>
                    <Typography fontSize={18} fontWeight={700}>
                      {item.value}
                    </Typography>
                  </Stack>

                  <Typography fontSize={11} sx={{ opacity: 0.9 }}>
                    {item.label}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* -------- QUICK ACTIONS -------- */}
        <Card sx={{ mt: 2, borderRadius: 3 }}>
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
        <Grid container spacing={2} mt={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ borderRadius: 3, height: "100%" }}>
              <CardContent>
                <Typography fontWeight={700} mb={1}>
                  Recent Activity
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {/* <Stack spacing={1}>
                  <Typography variant="body2">• New user registered</Typography>
                  <Typography variant="body2">
                    • Course “AutoCAD Pro” published
                  </Typography>
                  <Typography variant="body2">
                    • Payment received from Student
                  </Typography>
                </Stack> */}
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
