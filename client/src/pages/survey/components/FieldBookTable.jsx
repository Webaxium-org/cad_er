import React, { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
} from "@mui/material";
import { MdKeyboardArrowDown } from "react-icons/md";
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
  themed = false,
}) {
  const head = ["CH", "BS", "IS", "FS", "HI", "RL", "OFFSET", "REMARKS"];
  const [collapsedSections, setCollapsedSections] = useState(() => new Set());
  const sectionGroups = useMemo(() => {
    const groups = new Map();
    let current = null;

    tableData.forEach((row, index) => {
      if (row.rowType !== "Chainage") {
        current = null;
        return;
      }
      if (!current || current.rowIndex !== row.rowIndex || current.isBranch !== row.isBranch) {
        current = {
          start: index,
          rowIndex: row.rowIndex,
          isBranch: row.isBranch,
          title: row.CH !== "" && row.CH != null ? row.CH : `#${row.rowIndex + 1}`,
          count: 0,
        };
      }
      current.count += 1;
      groups.set(index, current);
    });
    return groups;
  }, [tableData]);

  const toggleSection = (start) => {
    setCollapsedSections((previous) => {
      const next = new Set(previous);
      if (next.has(start)) next.delete(start);
      else next.add(start);
      return next;
    });
  };

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
      stickyHeader={!themed}
      sx={{
        minWidth: themed ? 820 : undefined,
        borderCollapse: "separate",
        borderSpacing: 0,
        border: themed ? 0 : "1px solid #475569",
        "& td, & th": {
          border: 0,
          borderRight: themed ? 0 : "1px solid #475569",
          borderBottom: themed ? "1px solid #e5eaf3" : "1px solid #475569",
          textAlign: "center",
          fontFamily: themed ? "inherit" : "Calibri, Arial, sans-serif",
          fontSize: "13px",
          py: themed ? 1.2 : 0.75,
          px: themed ? 1.5 : 1,
          fontWeight: themed ? 500 : "bold",
          fontVariantNumeric: themed ? "tabular-nums" : undefined,
          whiteSpace: themed ? "nowrap" : undefined,
        },
        "& tr > :last-child": { borderRight: 0 },
        "& tbody tr:last-child > *": { borderBottom: 0 },
        ...(themed && {
          "& tbody .field-book-data-row td": { color: "#34436b" },
          "& tbody .field-book-data-row:hover": { bgcolor: "#f5f6ff" },
          "& tbody .field-book-section-row td": {
            bgcolor: "#eff0ff",
            color: "#211bb5",
            fontWeight: 800,
            borderTop: "10px solid white",
            borderBottom: 0,
            borderRadius: "5px",
            py: 1.05,
            textAlign: "left",
          },
          "& tbody .field-book-closure-row td:not(:last-child)": {
            bgcolor: "#eff0ff",
            color: "#211bb5",
            fontWeight: 800,
            borderTop: "1px solid #d6ddf4",
          },
        }),
      }}
    >
      <TableHead sx={themed ? {
        position: "sticky",
        top: 0,
        zIndex: 2,
        "& .MuiTableCell-root": {
          bgcolor: "#f0f2fa",
          color: "#34436b",
          fontWeight: 800,
          borderBottom: "1px solid #dce2f0",
          borderRight: "1px solid #e4e8f2",
          fontSize: "0.78rem",
        },
        "& tr:first-of-type .MuiTableCell-root[colspan]": {
          bgcolor: "#dedfff",
          color: "#211bb5",
        },
        "& tr:nth-of-type(2) .MuiTableCell-root": {
          bgcolor: "#f0f1ff",
          color: "#34436b",
          fontSize: "0.73rem",
        },
      } : undefined}>
        {themed ? (
          <>
            <TableRow>
              <TableCell rowSpan={2}>CH</TableCell>
              <TableCell colSpan={5}>Sight readings and levels</TableCell>
              <TableCell rowSpan={2}>OFFSET</TableCell>
              <TableCell rowSpan={2}>REMARKS</TableCell>
            </TableRow>
            <TableRow>
              {head.slice(1, 6).map((label) => <TableCell key={label}>{label}</TableCell>)}
            </TableRow>
          </>
        ) : (
          <TableRow>
            {head.map((label) => (
              <TableCell key={label} sx={{ fontWeight: 700, fontStyle: "italic", bgcolor: "#6366f1", color: "#fff", zIndex: 2 }}>
                {label}
              </TableCell>
            ))}
          </TableRow>
        )}
      </TableHead>

      <TableBody>
        {tableData.map((row, idx) => (
          <React.Fragment key={idx}>
          {themed && sectionGroups.get(idx)?.start === idx && (
            <TableRow className="field-book-section-row">
              <TableCell colSpan={8}>
                <Stack
                  component="button"
                  type="button"
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  onClick={() => toggleSection(idx)}
                  aria-expanded={!collapsedSections.has(idx)}
                  aria-label={`Section ${sectionGroups.get(idx).title}`}
                  sx={{
                    width: "100%",
                    p: 0,
                    border: 0,
                    bgcolor: "transparent",
                    color: "inherit",
                    cursor: "pointer",
                    font: "inherit",
                    textAlign: "left",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <MdKeyboardArrowDown
                      size={20}
                      style={{ transform: collapsedSections.has(idx) ? "rotate(-90deg)" : "none", transition: "transform 0.2s" }}
                    />
                    <Box component="span">Section {sectionGroups.get(idx).title}</Box>
                  </Stack>
                  <Typography variant="caption" sx={{ color: "#687594", fontWeight: 500 }}>
                    {sectionGroups.get(idx).count} measurements
                  </Typography>
                </Stack>
              </TableCell>
            </TableRow>
          )}
          {themed && (row.rowType === "Break" || row.rowType === "-") ? (
            <TableRow className="field-book-section-row">
              <TableCell colSpan={8}>{row.remarks}</TableCell>
            </TableRow>
          ) : (!themed || !sectionGroups.has(idx) || !collapsedSections.has(sectionGroups.get(idx).start)) && (
          <TableRow
            className={
              themed && row.rowType === "Closure"
                  ? "field-book-closure-row"
                  : "field-book-data-row"
            }
          >
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
          )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
