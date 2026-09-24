import { Box, Stack, Typography, Grid, Card, CardContent, Button, Container } from "@mui/material";
import { MdPeople, MdSchool, MdWork, MdBusiness, MdArrowForward } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../../components/AppHeader";

const AdminDashboard = ({ data }) => {
  const navigate = useNavigate();
  const stats = [
    { label: "Total users", value: data?.totalUsers, icon: MdPeople },
    { label: "Students", value: data?.students, icon: MdSchool },
    { label: "Professionals", value: data?.professionals, icon: MdWork },
  ];
  const destinations = [
    { title: "Users", description: "View and manage registered users", icon: MdPeople, path: "/users" },
    { title: "Organizations", description: "View and manage organizations", icon: MdBusiness, path: "/organizations" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", userSelect: "none" }}>
      <AppHeader showSearch={false} showNotifications={false} />
      <Box sx={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", color: "white", pt: 4, pb: 7, borderRadius: "0 0 20px 20px", boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.3)" }}>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-0.02em", fontSize: { xs: "2rem", md: "2.5rem" } }}>
            CADER Admin <Box component="span" sx={{ color: "#c7d2fe" }}>Hub</Box>
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>Manage your community and organizations in one place.</Typography>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={2} mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#1e293b">Admin overview</Typography>
            <Typography variant="body2" color="text.secondary">Your community at a glance</Typography>
          </Box>
          <Button variant="contained" endIcon={<MdArrowForward />} onClick={() => navigate("/users")}
            sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#6366f1", fontWeight: 700 }}>View users</Button>
        </Stack>
        <Grid container spacing={2}>
          {stats.map(({ label, value, icon: Icon }) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={label}>
              <Card sx={{ height: "100%", borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)" }}>
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                  <Box sx={{ display: "inline-flex", p: 1.25, borderRadius: 2, bgcolor: "#eef2ff", color: "#6366f1", mb: 2 }}><Icon size={24} /></Box>
                  <Typography variant="h4" fontWeight={800} color="#1e293b">{value ?? "—"}</Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>{label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Typography variant="h6" fontWeight={800} color="#1e293b" mt={4} mb={2}>Manage</Typography>
        <Grid container spacing={2}>
          {destinations.map(({ title, description, icon: Icon, path }) => (
            <Grid size={{ xs: 12, sm: 6 }} key={title}>
              <Card onClick={() => navigate(path)} sx={{ height: "100%", cursor: "pointer", borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none", "&:hover": { borderColor: "#6366f1", boxShadow: "0 8px 24px rgba(99, 102, 241, 0.1)" } }}>
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ display: "flex", p: 1.25, borderRadius: 2, bgcolor: "#eef2ff", color: "#6366f1" }}><Icon size={24} /></Box>
                    <Box flex={1}>
                      <Typography fontWeight={700} color="#1e293b">{title}</Typography>
                      <Typography variant="body2" color="text.secondary">{description}</Typography>
                    </Box>
                    <MdArrowForward color="#6366f1" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
