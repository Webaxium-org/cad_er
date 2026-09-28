import { useMemo, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Chip, Button, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const STATUS_CONFIG = [
  { label: "All", value: "ALL", color: "default" },
  { label: "Open", value: "OPEN", color: "primary" },
  { label: "In Progress", value: "IN_PROGRESS", color: "info" },
  { label: "Postponed", value: "POSTPONED", color: "warning" },
  { label: "Resolved", value: "RESOLVED", color: "success" },
];

const TicketsGrid = ({ tickets }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("OPEN");

  /* ----------------- counts ----------------- */
  const statusCounts = useMemo(() => {
    return tickets.reduce(
      (acc, t) => {
        acc.ALL += 1;
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      },
      { ALL: 0 }
    );
  }, [tickets]);

  /* ----------------- filtered rows ----------------- */
  const filteredTickets = useMemo(() => {
    if (filter === "ALL") return tickets;
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  /* ----------------- grid columns ----------------- */
  const columns = [
    {
      field: "ticketNo",
      headerName: "Ticket No",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "feedbackType",
      headerName: "Type",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 140,
      renderCell: (params) => {
        const config = STATUS_CONFIG.find((s) => s.value === params.value);
        return (
          <Chip
            label={config?.label || params.value}
            size="small"
            color={config?.color || "default"}
          />
        );
      },
    },
    {
      field: "priority",
      headerName: "Priority",
      flex: 1,
      minWidth: 100,
    },
    {
      field: "createdBy",
      headerName: "Created By",
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Typography variant="caption" fontSize={14}>
          {params?.row?.createdBy?.name}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      minWidth: 150,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="contained"
          onClick={() => navigate(`/tickets/${params.row._id}/followup`)}
          disabled={params.row?.status === "RESOLVED"}
        >
          Followups
        </Button>
      ),
    },
  ];

  return (
    <>
      {/* ----------- STATUS FILTER CHIPS ----------- */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          overflowX: "auto",
          pb: 1,
          mb: 2,
        }}
      >
        {STATUS_CONFIG.map((s) => (
          <Chip
            key={s.value}
            label={`${s.label} (${statusCounts[s.value] || 0})`}
            clickable
            color={filter === s.value ? s.color : "default"}
            variant={filter === s.value ? "filled" : "outlined"}
            onClick={() => setFilter(s.value)}
            sx={{ borderRadius: "10px", fontWeight: 700, px: 0.5 }}
          />
        ))}
      </Box>

      {/* ---------------- DATA GRID ---------------- */}
      <Box sx={{ height: 600, width: "100%", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden" }}>
        <DataGrid
          rows={filteredTickets}
          columns={columns}
          getRowId={(row) => row._id}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          disableRowSelectionOnClick
          sx={{ border: 0, color: "#334155", "& .MuiDataGrid-columnHeaders": { bgcolor: "#f8fafc", color: "#1e293b", fontWeight: 800 }, "& .MuiDataGrid-cell": { borderColor: "#eef2f7" }, "& .MuiDataGrid-row:hover": { bgcolor: "#f8f9ff" } }}
        />
      </Box>
    </>
  );
};

export default TicketsGrid;
