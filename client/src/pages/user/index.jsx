import { useEffect, useMemo, useState } from "react";
import {
  Box, Card, CardContent, Chip, Container, Grid, InputAdornment, Stack, Switch,
  TextField, Tooltip, Typography,
} from "@mui/material";
import {
  MdAdminPanelSettings, MdPeople, MdSchool, MdWork,
  MdCheckCircleOutline, MdBlock, MdSearch,
} from "react-icons/md";
import { useDispatch } from "react-redux";
import { stopLoading } from "../../redux/loadingSlice";
import AppHeader from "../../components/AppHeader";
import AlertDialogSlide from "../../components/AlertDialogSlide";
import BasicDataGrid from "../../components/SmartDataGrid";
import { getAllUsers, updateUserStatus } from "../../services/userServices";
import { handleFormError } from "../../utils/handleFormError";

const FILTERS = [
  { key: "ALL", label: "All users", icon: MdPeople },
  { key: "ACTIVE", label: "Active", icon: MdCheckCircleOutline },
  { key: "INACTIVE", label: "Inactive", icon: MdBlock },
  { key: "STUDENT", label: "Students", icon: MdSchool },
  { key: "PROFESSIONAL", label: "Professionals", icon: MdWork },
  { key: "ADMIN", label: "Admins", icon: MdAdminPanelSettings },
];

const UsersDashboard = () => {
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [statusLoading, setStatusLoading] = useState({});
  const [pendingUser, setPendingUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await getAllUsers();
        setRows(data.users.map((user) => ({ ...user, id: user._id })));
      } catch (error) {
        handleFormError(error, null, dispatch);
      } finally {
        setLoading(false);
        dispatch(stopLoading());
      }
    };
    fetchUsers();
  }, [dispatch]);

  const handleStatusToggle = async () => {
    if (!pendingUser || statusLoading[pendingUser.id]) return;
    const user = pendingUser;
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    setStatusLoading((prev) => ({ ...prev, [user.id]: true }));
    try {
      await updateUserStatus(user.id, newStatus);
      setRows((prev) =>
        prev.map((item) => item.id === user.id ? { ...item, status: newStatus } : item),
      );
      setPendingUser(null);
    } catch (error) {
      handleFormError(error, null, dispatch);
    } finally {
      setStatusLoading((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  const counts = {
    ALL: rows.length,
    ACTIVE: rows.filter((user) => user.status === "Active").length,
    INACTIVE: rows.filter((user) => user.status === "Inactive").length,
    STUDENT: rows.filter((user) => user.type === "Student").length,
    PROFESSIONAL: rows.filter((user) => user.type === "Professional").length,
    ADMIN: rows.filter((user) => user.role === "Super Admin").length,
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return rows.filter((user) => {
      let matchesCategory;
      switch (filter) {
        case "ACTIVE": matchesCategory = user.status === "Active"; break;
        case "INACTIVE": matchesCategory = user.status === "Inactive"; break;
        case "STUDENT": matchesCategory = user.type === "Student"; break;
        case "PROFESSIONAL": matchesCategory = user.type === "Professional"; break;
        case "ADMIN": matchesCategory = user.role === "Super Admin"; break;
        default: matchesCategory = true;
      }
      if (!matchesCategory || !query) return matchesCategory;
      return [user.name, user.email, user.role, user.type, user.status, user.projectCount]
        .some((value) => String(value ?? "").toLocaleLowerCase().includes(query));
    });
  }, [rows, filter, search]);

  const columns = useMemo(() => [
    { field: "name", headerName: "Name", flex: 1, minWidth: 160 },
    { field: "email", headerName: "Email", flex: 1.3, minWidth: 210 },
    {
      field: "role", headerName: "Role", minWidth: 150,
      renderCell: ({ value }) => value ? (
        <Chip label={value} size="small" sx={{ fontWeight: 700, bgcolor: value === "Super Admin" ? "#ede9fe" : "#f1f5f9", color: value === "Super Admin" ? "#6d28d9" : "#475569" }} />
      ) : "—",
    },
    {
      field: "type", headerName: "Type", minWidth: 135,
      renderCell: ({ value }) => value ? (
        <Chip label={value} size="small" sx={{ fontWeight: 700, bgcolor: value === "Student" ? "#ecfdf5" : value === "Professional" ? "#eef2ff" : "#f1f5f9", color: value === "Student" ? "#047857" : value === "Professional" ? "#4f46e5" : "#475569" }} />
      ) : "—",
    },
    { field: "projectCount", headerName: "Projects", type: "number", width: 110,
      align: "center", headerAlign: "center",
      renderCell: ({ value }) => (
        <Chip label={value ?? "—"} size="small" sx={{ minWidth: 38, fontWeight: 800, bgcolor: "#eef2ff", color: "#4f46e5" }} />
      ),
    },
    {
      field: "status", headerName: "Status", width: 120, sortable: false,
      renderCell: (params) => {
        const user = params.row;
        const isActive = user.status === "Active";
        return (
          <Tooltip title={isActive ? "Deactivate user" : "Activate user"}>
            <Switch checked={isActive} color="success" disabled={Boolean(statusLoading[user.id])}
              onChange={() => setPendingUser(user)} inputProps={{ "aria-label": `Change status for ${user.name}` }} />
          </Tooltip>
        );
      },
    },
  ], [statusLoading]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <AlertDialogSlide
        open={Boolean(pendingUser)}
        title={`${pendingUser?.status === "Active" ? "Deactivate" : "Activate"} user`}
        description={`Are you sure you want to ${pendingUser?.status === "Active" ? "deactivate" : "activate"} ${pendingUser?.name || "this user"}?`}
        cancelButtonText="Cancel"
        submitButtonText={pendingUser?.status === "Active" ? "Deactivate" : "Activate"}
        submitDisabled={Boolean(pendingUser && statusLoading[pendingUser.id])}
        onCancel={() => {
          if (!pendingUser || !statusLoading[pendingUser.id]) setPendingUser(null);
        }}
        onSubmit={handleStatusToggle}
      />
      <AppHeader showSearch={false} showNotifications={false} />
      <Box sx={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
        color: "white", pt: 4, pb: 7, borderRadius: "0 0 20px 20px",
        boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.3)" }}>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-0.02em", fontSize: { xs: "2rem", md: "2.5rem" } }}>
            CADER Users <Box component="span" sx={{ color: "#c7d2fe" }}>Hub</Box>
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
            Manage accounts and see how many projects each user has created.
          </Typography>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight={800} color="#1e293b" mb={0.5}>Users</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Select a category to filter the list.
        </Typography>
        <Grid container spacing={2} mb={3}>
          {FILTERS.map(({ key, label, icon: Icon }) => (
            <Grid size={{ xs: 6, sm: 4, lg: 2 }} key={key}>
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
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ px: 2.5, py: 2 }}>
              <Typography fontWeight={800} color="#1e293b">User list</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField
                  size="small"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search all users"
                  aria-label="Search all users"
                  sx={{ width: { xs: "100%", sm: 280 }, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><MdSearch /></InputAdornment> } }}
                />
                <Chip label={`${filteredRows.length} users`} size="small" sx={{ bgcolor: "#eef2ff", color: "#4f46e5", fontWeight: 700 }} />
              </Stack>
            </Stack>
            <BasicDataGrid rows={filteredRows} columns={columns} loading={loading} />
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default UsersDashboard;
