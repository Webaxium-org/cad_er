import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import BasicInput from "../../../components/BasicInput";

// editable config by row.type
const editableFields = {
  "Instrument setup": ["BS", "RL", "remarks"],
  Chainage: ["CH", "IS", "Offset", "remarks"],
  CP: ["BS", "FS", "remarks"],
  TBM: ["IS", "remarks"],
  "Water Level": ["IS", "remarks"],
};

export default function FieldBookTable({
  tableData = [],
  isEditing = false,
  onFieldChange = () => {},
  onRLChange = () => {},
}) {
  const head = ["CH", "BS", "IS", "FS", "HI", "RL", "OFFSET", "REMARKS"];

  const renderEditable = (row, key, value, isBranch) => {
    const editableForRow = editableFields[row.rowType] || [];
    if (!isEditing || !editableForRow.includes(key) || isBranch) return value;

    // For nested array fields (IS, Offset, remarks), pass nested index
    const nestedIndex = row.index != null ? row.index : undefined;

    return (
      <BasicInput
        value={value ?? ""}
        onChange={(e) =>
          key === "RL"
            ? onRLChange(row.rowIndex, e.target.value)
            : onFieldChange(row.rowIndex, key, nestedIndex, e.target.value)
        }
        sx={{ minWidth: "90px" }}
      />
    );
  };

  return (
    <Table
      size="small"
      stickyHeader
      sx={{
        borderCollapse: "separate",
        borderSpacing: 0,
        border: "1px solid #475569",
        "& td, & th": {
          border: 0,
          borderRight: "1px solid #475569",
          borderBottom: "1px solid #475569",
          textAlign: "center",
          fontFamily: "Calibri, Arial, sans-serif",
          fontSize: "13px",
          py: 0.75,
          px: 1,
          fontWeight: "bold",
        },
        "& tr > :last-child": { borderRight: 0 },
        "& tbody tr:last-child > *": { borderBottom: 0 },
      }}
    >
      <TableHead>
        <TableRow>
          {head.map((h) => (
            <TableCell
              key={h}
              sx={{
                fontWeight: 700,
                fontStyle: "italic",
                bgcolor: "#6366f1",
                color: "#fff",
                zIndex: 2,
              }}
            >
              {h}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>

      <TableBody>
        {tableData.map((row, idx) => (
          <TableRow key={idx}>
            <TableCell>
              {renderEditable(row, "CH", row.CH, row.isBranch)}
            </TableCell>
            <TableCell>
              {renderEditable(row, "BS", row.BS, row.isBranch)}
            </TableCell>
            <TableCell>
              {renderEditable(row, "IS", row.IS, row.isBranch)}
            </TableCell>
            <TableCell>
              {renderEditable(row, "FS", row.FS, row.isBranch)}
            </TableCell>
            <TableCell>{row.HI}</TableCell>
            <TableCell>
              {renderEditable(row, "RL", row.RL, row.isBranch)}
            </TableCell>
            <TableCell>
              {row.rowType === "Instrument setup"
                ? "▣"
                : renderEditable(row, "Offset", row.Offset, row.isBranch)}
            </TableCell>
            <TableCell
              sx={{
                color:
                  row.diff !== undefined && row.diff !== null
                    ? row.diff === 0
                      ? "green"
                      : "red"
                    : "",
              }}
            >
              {renderEditable(row, "remarks", row.remarks, row.isBranch)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
