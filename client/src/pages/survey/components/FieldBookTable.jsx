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
  "Instrument setup": ["BS", "remarks"],
  Chainage: ["CH", "IS", "Offset", "remarks"],
  CP: ["BS", "FS", "remarks"],
  TBM: ["IS", "remarks"],
};

/**
 * calculateTableData(purpose)
 * Returns rows with sanitized fields and also keeps:
 * - rowIndex: index in purpose.rows (so edits map back to original)
 * - index: nested index (for intermediateSight / offsets) if applicable
 */
export function calculateTableData(purpose) {
  if (!purpose) return [];

  const survey = purpose.surveyId || {};
  let hi = 0;
  let rl = 0;
  const rows = [];

  for (let rIndex = 0; rIndex < (purpose.rows || []).length; rIndex++) {
    const row = purpose.rows[rIndex];
    if (!row) continue;

    switch (row.type) {
      case "Instrument setup": {
        rl = Number(survey.reducedLevel || 0);
        hi = rl + Number(row.backSight || 0);
        rows.push({
          rowIndex: rIndex,
          rowType: row.type,
          CH: "-",
          BS: row.backSight ?? "",
          IS: "-",
          FS: "-",
          HI: hi.toFixed(3),
          RL: rl.toFixed(3),
          Offset: "-",
          remarks: (row.remarks && row.remarks[0]) ?? "",
        });
        break;
      }

      case "Chainage": {
        const inter = row.intermediateSight || [];
        for (let i = 0; i < inter.length; i++) {
          const isVal = inter[i];
          const rlValue = (hi - Number(isVal || 0)).toFixed(3);
          rows.push({
            rowIndex: rIndex,
            rowType: row.type,
            index: i,
            CH: i === 0 ? row.chainage ?? "" : "",
            BS: "-",
            IS: isVal ?? "",
            FS: "-",
            HI: hi.toFixed(3),
            RL: rlValue,
            Offset: (row.offsets && row.offsets[i]) ?? "",
            remarks: (row.remarks && row.remarks[i]) ?? "",
          });
        }
        break;
      }

      case "TBM": {
        const inter = row.intermediateSight || [];
        for (let i = 0; i < inter.length; i++) {
          const isVal = inter[i];
          const rlValue = (hi - Number(isVal || 0)).toFixed(3);
          rows.push({
            rowIndex: rIndex,
            rowType: row.type,
            index: i,
            CH: "-",
            BS: "-",
            IS: isVal ?? "",
            FS: "-",
            HI: hi.toFixed(3),
            RL: rlValue,
            Offset: "-",
            remarks: (row.remarks && row.remarks[i]) ?? "",
          });
        }
        break;
      }

      case "CP": {
        rl = Number(hi) - Number(row.foreSight || 0);
        hi = rl + Number(row.backSight || 0);
        rows.push({
          rowIndex: rIndex,
          rowType: row.type,
          CH: "-",
          BS: row.backSight ?? "",
          IS: "-",
          FS: row.foreSight ?? "",
          HI: hi.toFixed(3),
          RL: rl.toFixed(3),
          Offset: "-",
          remarks: (row.remarks && row.remarks[0]) ?? "",
        });
        break;
      }

      default:
        break;
    }
  }

  // final closure row
  const finalForeSight = Number(purpose.finalForesight || 0);
  const lastHI = rows.length ? Number(rows[rows.length - 1].HI || 0) : 0;
  const finalRl = lastHI - finalForeSight;
  const diff =
    finalRl - Number((purpose.surveyId && purpose.surveyId.reducedLevel) || 0);

  rows.push({
    rowIndex: purpose.rows ? purpose.rows.length - 1 : 0,
    rowType: null,
    CH: "",
    BS: "",
    IS: "",
    FS: finalForeSight ? finalForeSight.toFixed(3) : "",
    HI: "",
    RL: Number(finalRl).toFixed(3),
    Offset: "",
    diff,
    remarks: `Closed on Starting TBM at ${
      diff === 0 ? "±0.000" : diff < 0 ? diff.toFixed(3) : `+${diff.toFixed(3)}`
    }`,
  });

  return rows;
}

export default function FieldBookTable({
  tableData = [],
  isEditing = false,
  onFieldChange = () => {},
}) {
  const head = ["CH", "BS", "IS", "FS", "HI", "RL", "Offset", "Remarks"];

  const renderEditable = (row, key, value) => {
    const editableForRow = editableFields[row.rowType] || [];
    if (!isEditing || !editableForRow.includes(key)) return value;

    // For nested array fields (IS, Offset, remarks), pass nested index
    const nestedIndex = row.index != null ? row.index : undefined;

    return (
      <BasicInput
        value={value ?? ""}
        onChange={(e) =>
          onFieldChange(row.rowIndex, key, nestedIndex, e.target.value)
        }
        sx={{ minWidth: "90px" }}
      />
    );
  };

  return (
    <Table size="small">
      <TableHead sx={{ backgroundColor: "#f4f6f8" }}>
        <TableRow>
          {head.map((h) => (
            <TableCell
              key={h}
              sx={{ fontWeight: 700 }}
              align={h === "CH" ? "left" : "right"}
            >
              {h}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>

      <TableBody>
        {tableData.map((row, idx) => (
          <TableRow key={idx}>
            <TableCell>{renderEditable(row, "CH", row.CH)}</TableCell>
            <TableCell align="right">
              {renderEditable(row, "BS", row.BS)}
            </TableCell>
            <TableCell align="right">
              {renderEditable(row, "IS", row.IS)}
            </TableCell>
            <TableCell align="right">
              {renderEditable(row, "FS", row.FS)}
            </TableCell>
            <TableCell align="right">{row.HI}</TableCell>
            <TableCell align="right">{row.RL}</TableCell>
            <TableCell align="right">
              {renderEditable(row, "Offset", row.Offset)}
            </TableCell>
            <TableCell
              align="right"
              sx={{
                color:
                  row.diff !== undefined && row.diff !== null
                    ? row.diff === 0
                      ? "green"
                      : "red"
                    : "",
              }}
            >
              {renderEditable(row, "remarks", row.remarks)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
