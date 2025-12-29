import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  useMediaQuery,
  Tooltip,
  Switch,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { MdPerson, MdAdminPanelSettings } from "react-icons/md";
import BasicDataGrid from "../../components/SmartDataGrid";
import { useDispatch } from "react-redux";
import { stopLoading } from "../../redux/loadingSlice";
import SmallHeader from "../../components/SmallHeader";
import { getAllUsers, updateUserStatus } from "../../services/userServices";
import { handleFormError } from "../../utils/handleFormError";

const UsersDashboard = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [statusLoading, setStatusLoading] = useState({});

  const formatUsers = (users) =>
    users.map((user) => ({ id: user._id, ...user }));

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await getAllUsers();
      setRows(formatUsers(data.users));
    } catch (error) {
      handleFormError(error, null, dispatch);
    } finally {
      setLoading(false);
      dispatch(stopLoading());
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusToggle = async (user) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";

    setStatusLoading((prev) => ({ ...prev, [user.id]: true }));

    try {
      await updateUserStatus(user.id, newStatus);

      setRows((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch (error) {
      handleFormError(error, null, dispatch);
    } finally {
      setStatusLoading((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  /* ---------------- SUMMARY COUNTS ---------------- */
  const total = rows.length;
  const active = rows.filter((u) => u.status === "Active").length;
  const inactive = rows.filter((u) => u.status === "Inactive").length;
  const admins = rows.filter((u) => u.role === "Super Admin").length;
  const students = rows.filter((u) => u.type === "Student").length;
  const professionals = rows.filter((u) => u.type === "Professional").length;

  /* ---------------- FILTERED ROWS ---------------- */
  const filteredRows = useMemo(() => {
    switch (filter) {
      case "ACTIVE":
        return rows.filter((u) => u.status === "Active");
      case "INACTIVE":
        return rows.filter((u) => u.status === "Inactive");
      case "STUDENT":
        return rows.filter((u) => u.type === "Student");
      case "PROFESSIONAL":
        return rows.filter((u) => u.type === "Professional");
      case "ADMIN":
        return rows.filter((u) => u.role === "Super Admin");
      default:
        return rows;
    }
  }, [rows, filter]);

  /* ---------------- DATAGRID COLUMNS ---------------- */
  const columns = useMemo(
    () => [
      { field: "name", headerName: "Name", flex: 1, minWidth: 120 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 160 },
      { field: "role", headerName: "Role", width: 140 },
      { field: "type", headerName: "Type", width: 140 },

      {
        field: "status",
        headerName: "Status",
        width: 100,
        sortable: false,
        renderCell: (params) => {
          const user = params.row;
          const isActive = user.status === "Active";

          return (
            <Tooltip title={isActive ? "Deactivate user" : "Activate user"}>
              <Switch
                checked={isActive}
                color="success"
                disabled={statusLoading[user.id]}
                onChange={() => handleStatusToggle(user)}
              />
            </Tooltip>
          );
        },
      },
    ],
    [statusLoading]
  );

  /* ---------------- CARD COMPONENT ---------------- */
  const StatCard = ({ label, value, icon, onClick, active }) => (
    <Card
      onClick={onClick}
      sx={{
        cursor: "pointer",
        border: active ? "2px solid" : "1px solid",
        borderColor: active ? "primary.main" : "divider",
        transition: "0.2s",
        "&:hover": { boxShadow: 4 },
      }}
    >
      <CardContent>
        <Stack spacing={1}>
          {icon}
          <Typography variant="h6">{value}</Typography>
          <Typography variant="body2">{label}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <>
      <SmallHeader />

      <Box p={2} className="overlapping-header">
        <Typography variant="h5" mb={2}>
          Users
        </Typography>

        {/* ================= MOBILE FILTER CHIPS ================= */}
        {isMobile ? (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              overflowX: "auto",
              pb: 1,
              mb: 2,
            }}
          >
            <Chip
              label={`All (${total})`}
              clickable
              color={filter === "ALL" ? "primary" : "default"}
              onClick={() => setFilter("ALL")}
            />
            <Chip
              label={`Active (${active})`}
              clickable
              color={filter === "ACTIVE" ? "primary" : "default"}
              onClick={() => setFilter("ACTIVE")}
            />
            <Chip
              label={`Inactive (${inactive})`}
              clickable
              color={filter === "INACTIVE" ? "primary" : "default"}
              onClick={() => setFilter("INACTIVE")}
            />
            <Chip
              label={`Students (${students})`}
              clickable
              color={filter === "STUDENT" ? "primary" : "default"}
              onClick={() => setFilter("STUDENT")}
            />
            <Chip
              label={`Professionals (${professionals})`}
              clickable
              color={filter === "PROFESSIONAL" ? "primary" : "default"}
              onClick={() => setFilter("PROFESSIONAL")}
            />
            <Chip
              label={`Admins (${admins})`}
              clickable
              color={filter === "ADMIN" ? "primary" : "default"}
              onClick={() => setFilter("ADMIN")}
            />
          </Box>
        ) : (
          /* ================= DESKTOP STAT CARDS ================= */
          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard
                label="Total Users"
                value={total}
                icon={<MdPerson size={22} />}
                active={filter === "ALL"}
                onClick={() => setFilter("ALL")}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard
                label="Active"
                value={active}
                icon={<MdPerson size={22} color="green" />}
                active={filter === "ACTIVE"}
                onClick={() => setFilter("ACTIVE")}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard
                label="Inactive"
                value={inactive}
                icon={<MdPerson size={22} color="orange" />}
                active={filter === "INACTIVE"}
                onClick={() => setFilter("INACTIVE")}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard
                label="Students"
                value={students}
                icon={<MdPerson size={22} />}
                active={filter === "STUDENT"}
                onClick={() => setFilter("STUDENT")}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard
                label="Professionals"
                value={professionals}
                icon={<MdPerson size={22} />}
                active={filter === "PROFESSIONAL"}
                onClick={() => setFilter("PROFESSIONAL")}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard
                label="Admins"
                value={admins}
                icon={<MdAdminPanelSettings size={22} />}
                active={filter === "ADMIN"}
                onClick={() => setFilter("ADMIN")}
              />
            </Grid>
          </Grid>
        )}

        {/* ================= DATAGRID ================= */}
        <BasicDataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
        />
      </Box>
    </>
  );
};

export default UsersDashboard;
