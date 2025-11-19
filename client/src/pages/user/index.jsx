import { useEffect, useState, useMemo } from 'react';
import { Box, Grid, Card, CardContent, Typography, Stack } from '@mui/material';

import { MdPerson, MdAdd } from 'react-icons/md';
import BasicDataGrid from '../../components/SmartDataGrid';
import { useDispatch } from 'react-redux';
import { stopLoading } from '../../redux/loadingSlice';

const UsersDashboard = () => {
  const dispatch = useDispatch();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);

    // TODO: Replace with real API
    const mock = Array.from({ length: 40 }).map((_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@mail.com`,
      role: i % 3 === 0 ? 'Admin' : 'User',
      status: i % 2 === 0 ? 'Active' : 'Inactive',
    }));

    setTimeout(() => {
      setRows(mock);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchUsers();
    dispatch(stopLoading());
  }, []);

  // Summary stats
  const total = rows.length;
  const active = rows.filter((u) => u.status === 'Active').length;
  const inactive = rows.filter((u) => u.status === 'Inactive').length;
  const admins = rows.filter((u) => u.role === 'Admin').length;

  // DataGrid columns
  const columns = useMemo(
    () => [
      { field: 'name', headerName: 'Name', flex: 1 },
      { field: 'email', headerName: 'Email', flex: 1 },
      { field: 'role', headerName: 'Role', width: 120 },
      { field: 'status', headerName: 'Status', width: 120 },
    ],
    []
  );

  return (
    <Box p={2}>
      <Typography variant="h5">Users</Typography>

      <Grid container spacing={2} mb={3} mt={1}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <MdPerson size={22} />
                <Typography variant="h6">{total}</Typography>
                <Typography variant="body2">Total Users</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <MdPerson size={22} color="green" />
                <Typography variant="h6">{active}</Typography>
                <Typography variant="body2">Active</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <MdPerson size={22} color="orange" />
                <Typography variant="h6">{inactive}</Typography>
                <Typography variant="body2">Inactive</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <MdAdd size={22} />
                <Typography variant="h6">{admins}</Typography>
                <Typography variant="body2">Admins</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <BasicDataGrid rows={rows} columns={columns} loading={loading} />
    </Box>
  );
};

export default UsersDashboard;
