import { useEffect, useMemo, useState } from "react";
import {
  Box, Card, CardContent, Chip, Container, Grid, InputAdornment,
  Stack, TextField, Typography,
} from "@mui/material";
import { MdBusiness, MdCheckCircleOutline, MdBlock, MdPauseCircleOutline, MdSearch } from "react-icons/md";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import BasicDataGrid from "../../components/SmartDataGrid";
import { stopLoading } from "../../redux/loadingSlice";
import { getAllOrganizations } from "../../services/organizationServices";
import { handleFormError } from "../../utils/handleFormError";

const FILTERS = [
  { key: "ALL", label: "All organizations", icon: MdBusiness },
  { key: "Active", label: "Active", icon: MdCheckCircleOutline },
  { key: "Inactive", label: "Inactive", icon: MdBlock },
  { key: "Suspended", label: "Suspended", icon: MdPauseCircleOutline },
];

const statusStyles = {
  Active: { bgcolor: "#ecfdf5", color: "#047857" },
  Inactive: { bgcolor: "#f1f5f9", color: "#475569" },
  Suspended: { bgcolor: "#fff7ed", color: "#c2410c" },
};

const OrganizationsDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      try {
        const { data } = await getAllOrganizations();
        setRows((data.organizations ?? []).map((organization) => ({
          ...organization,
          id: organization._id,
          userCount: organization.users?.length ?? 0,
        })));
      } catch (error) {
        handleFormError(error, null, dispatch, navigate);
      } finally {
        setLoading(false);
        dispatch(stopLoading());
      }
    };
    fetchOrganizations();
  }, [dispatch, navigate]);

  const counts = {
    ALL: rows.length,
    Active: rows.filter((org) => org.status === "Active").length,
    Inactive: rows.filter((org) => org.status === "Inactive").length,
    Suspended: rows.filter((org) => org.status === "Suspended").length,
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return rows.filter((org) => {
      if (filter !== "ALL" && org.status !== filter) return false;
      if (!query) return true;
      return [org.name, org.code, org.email, org.status, org.industryType]
        .some((value) => String(value ?? "").toLocaleLowerCase().includes(query));
    });
  }, [rows, filter, search]);

  const columns = [
    { field: "name", headerName: "Organization", flex: 1.2, minWidth: 190 },
    { field: "code", headerName: "Code", minWidth: 120, renderCell: ({ value }) => value || "—" },
    { field: "email", headerName: "Email", flex: 1, minWidth: 200, renderCell: ({ value }) => value || "—" },
    { field: "industryType", headerName: "Industry", minWidth: 150, renderCell: ({ value }) => value || "—" },
    { field: "userCount", headerName: "Users", type: "number", width: 95, align: "center", headerAlign: "center",
      renderCell: ({ value }) => <Chip label={value ?? 0} size="small" sx={{ minWidth: 38, fontWeight: 800, bgcolor: "#eef2ff", color: "#4f46e5" }} /> },
    { field: "status", headerName: "Status", width: 130,
      renderCell: ({ value }) => value ? <Chip label={value} size="small" sx={{ fontWeight: 700, ...statusStyles[value] }} /> : "—" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <AppHeader showSearch={false} showNotifications={false} />
      <Box sx={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
        color: "white", pt: 4, pb: 7, borderRadius: "0 0 20px 20px",
        boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.3)" }}>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-0.02em", fontSize: { xs: "2rem", md: "2.5rem" } }}>
            CADER Organizations <Box component="span" sx={{ color: "#c7d2fe" }}>Hub</Box>
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
            View organizations and the people connected to them.
          </Typography>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight={800} color="#1e293b" mb={0.5}>Organizations</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Select a status to filter the list.
        </Typography>
        <Grid container spacing={2} mb={3}>
          {FILTERS.map(({ key, label, icon: Icon }) => (
            <Grid size={{ xs: 6, md: 3 }} key={key}>
              <Card onClick={() => setFilter(key)} sx={{
                height: "100%", cursor: "pointer", borderRadius: 3,
                border: "1px solid", borderColor: filter === key ? "#6366f1" : "#e2e8f0",
                boxShadow: filter === key ? "0 8px 24px rgba(99, 102, 241, 0.12)" : "none",
                bgcolor: filter === key ? "#eef2ff" : "white",
                "&:hover": { borderColor: "#6366f1" },
              }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Icon size={20} color="#6366f1" />
                    <Typography variant="h6" fontWeight={800} color="#1e293b">{counts[key]}</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">{label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)" }}>
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }} sx={{ px: 2.5, py: 2 }}>
              <Typography fontWeight={800} color="#1e293b">Organization list</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField size="small" value={search} onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search organizations" aria-label="Search organizations"
                  sx={{ width: { xs: "100%", sm: 280 }, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><MdSearch /></InputAdornment> } }} />
                <Chip label={`${filteredRows.length} organizations`} size="small"
                  sx={{ bgcolor: "#eef2ff", color: "#4f46e5", fontWeight: 700 }} />
              </Stack>
            </Stack>
            <BasicDataGrid rows={filteredRows} columns={columns} loading={loading} />
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default OrganizationsDashboard;
