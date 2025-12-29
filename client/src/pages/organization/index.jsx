import { useEffect, useState, useMemo } from "react";
import { Box, Grid, Card, CardContent, Typography, Stack } from "@mui/material";

import { MdAdd, MdBusiness } from "react-icons/md";
import BasicDataGrid from "../../components/SmartDataGrid";
import { useDispatch } from "react-redux";
import { stopLoading } from "../../redux/loadingSlice";
import SmallHeader from "../../components/SmallHeader";

const OrganizationsDashboard = () => {
  const dispatch = useDispatch();

  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(false);

  const fetchOrgs = async () => {
    setLoading(true);
    // TODO: Replace with API
    const mock = Array.from({ length: 35 }).map((_, i) => ({
      id: i + 1,
      name: `Organization ${i + 1}`,
      status: i % 2 === 0 ? "Active" : "Inactive",
      email: `org${i + 1}@mail.com`,
      code: `ORG${i + 1}`,
    }));
    setTimeout(() => {
      setRows(mock);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchOrgs();

    dispatch(stopLoading());
  }, []);

  // Summary card stats
  const total = rows.length;
  const active = rows.filter((x) => x.status === "Active").length;
  const inactive = rows.filter((x) => x.status === "Inactive").length;

  // DataGrid columns
  const columns = useMemo(
    () => [
      { field: "name", headerName: "Organization", flex: 1 },
      { field: "code", headerName: "Code", width: 120 },
      { field: "email", headerName: "Email", flex: 1 },
      { field: "status", headerName: "Status", width: 120 },
    ],
    []
  );

  return (
    <>
      <SmallHeader />

      <Box p={2} className="overlapping-header">
        {/* HEADER */}
        <Typography variant="h5">Organizations</Typography>

        {/* SUMMARY CARDS */}
        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <MdBusiness size={22} />
                  <Typography variant="h6">{total}</Typography>
                  <Typography variant="body2">Total Organizations</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <MdBusiness size={22} color="green" />
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
                  <MdBusiness size={22} color="orange" />
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
                  <Typography variant="h6">Create</Typography>
                  <Typography variant="body2">Add New Org</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* DATAGRID */}
        <BasicDataGrid rows={rows} columns={columns} loading={loading} />
      </Box>
    </>
  );
};

export default OrganizationsDashboard;
