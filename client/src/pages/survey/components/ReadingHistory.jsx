import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { formatReportNumber } from "../../../utils/reportNumber";

const measurements = values => values?.length ? values.map(formatReportNumber).join("\n") : "—";
const measurement = value => value == null || value === "" ? "—" : formatReportNumber(value);

export default function ReadingHistory({ rows = [] }) {
  // The purpose's rows are in insertion order, as used by the previous-reading actions.
  const recent = rows.filter(row => !row.deleted).slice(-10).reverse();
  const headings = ["Reading type", "Chainage (m)", "BS (m)", "IS / Sounding (m)", "FS (m)", "HI (m)", "RL (m)", "Offset (m)", "Remark"];
  return <Paper elevation={0} sx={{ mt: 3, mb: 4, borderRadius: 5, border: "1px solid #e0e7ff", overflow: "hidden" }}>
    <Box sx={{ p: { xs: 2.5, md: 3 } }}>
      <Typography component="h2" variant="h6" fontWeight={850} color="#1e1b4b">Reading history</Typography>
      <Typography variant="body2" color="text.secondary">Your latest 10 saved readings for this survey level, newest first.</Typography>
    </Box>
    <TableContainer sx={{ borderTop: "1px solid #e0e7ff" }}>
      <Table sx={{ minWidth: 1000 }} aria-label="Latest saved survey readings">
        <TableHead sx={{ bgcolor: "#f5f6ff" }}><TableRow>
          {headings.map(heading => <TableCell key={heading} sx={{ color: "#4338ca", fontWeight: 800, whiteSpace: "nowrap" }}>{heading}</TableCell>)}
        </TableRow></TableHead>
        <TableBody>
          {recent.map((row, index) => {
            const points = row.intermediateOffsets || [];
            const intermediate = points.length ? points.map(point => point.is) : row.intermediateSight;
            const remarks = [row.remark, ...points.map(point => point.remark)].filter(Boolean).join("\n");
            return <TableRow key={row._id || index} hover sx={{ "& td": { verticalAlign: "top", whiteSpace: "pre-line", borderColor: "#eef2ff" } }}>
              <TableCell sx={{ fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap !important" }}>{row.type}</TableCell>
              <TableCell>{row.type === "Break" ? `${row.from ?? "—"} – ${row.to ?? "—"}` : measurement(row.chainage)}</TableCell>
              <TableCell>{measurement(row.backSight)}</TableCell>
              <TableCell>{measurements(intermediate)}</TableCell>
              <TableCell>{measurement(row.foreSight)}</TableCell>
              <TableCell>{measurement(row.heightOfInstrument)}</TableCell>
              <TableCell>{measurements(row.reducedLevels)}</TableCell>
              <TableCell>{measurements(points.map(point => point.offset))}</TableCell>
              <TableCell sx={{ minWidth: 160, overflowWrap: "anywhere" }}>{remarks || "—"}</TableCell>
            </TableRow>;
          })}
          {!recent.length && <TableRow><TableCell colSpan={headings.length} align="center" sx={{ py: 5, color: "#64748b" }}>No saved readings yet.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>;
}
