import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import BasicSelect from "../../../components/BasicSelect";
import { IoAdd } from "react-icons/io5";
import { IoIosRemove } from "react-icons/io";
import BasicButton from "../../../components/BasicButton";
import BasicInput from "../../../components/BasicInput";

const initialRow = {
  from: "",
  to: "",
  remark: "",
};

const addButtonSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  px: 1.5,
  py: 0.75,
  borderRadius: 2,
  bgcolor: "primary.50",
  color: "primary.main",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  transition: "all 0.2s",
  "&:hover": {
    bgcolor: "primary.100",
  },
};

const DeductionContent = ({ purpose, onCancel, onSubmit }) => {
  const [rows, setRows] = useState([initialRow]);
  const [selectableItems, setSelectableItems] = useState([]);

  /* -------------------- Helpers -------------------- */

  const getIndex = (value) =>
    selectableItems.findIndex((i) => i.value === value);

  // FROM options: allow previous `to`
  const getFromOptions = (rowIndex) => {
    if (rowIndex === 0) return selectableItems;

    const prevTo = rows[rowIndex - 1]?.to;
    if (!prevTo) return [];

    const prevToIndex = getIndex(prevTo);
    return selectableItems.slice(prevToIndex);
  };

  // TO options: strictly after FROM
  const getToOptions = (rowIndex) => {
    const fromValue = rows[rowIndex]?.from;
    if (!fromValue) return [];

    const fromIndex = getIndex(fromValue);
    return selectableItems.slice(fromIndex + 1);
  };

  /* -------------------- Handlers -------------------- */

  // 🔥 Cascading update — removes all rows after the changed row
  const handleInputChange = (index, field, value) => {
    setRows((prev) => {
      const updatedRow = {
        ...prev[index],
        [field]: value,
        ...(field === "from" ? { to: "" } : {}),
      };

      // If TO is not selected yet, drop rows after
      if (!updatedRow.to) {
        return [...prev.slice(0, index), updatedRow];
      }

      const updatedToIndex = getIndex(updatedRow.to);

      const validNextRows = prev.slice(index + 1).filter((row) => {
        if (!row.from) return false;
        return getIndex(row.from) >= updatedToIndex;
      });

      return [...prev.slice(0, index), updatedRow, ...validNextRows];
    });
  };

  const handleAddRow = () => {
    setRows((prev) => {
      const lastRow = prev[prev.length - 1];
      return [
        ...prev,
        {
          from: lastRow.to || "",
          to: "",
        },
      ];
    });
  };

  const handleRemoveRow = (index) => {
    if (rows.length === 1) return;

    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClickCancel = () => {
    setRows([{ ...initialRow }]);
    onCancel();
  };
  /* -------------------- Effects -------------------- */

  useEffect(() => {
    const items =
      purpose?.rows
        ?.filter((r) => r.type === "Chainage")
        ?.map((s) => ({
          label: s.chainage,
          value: s.chainage,
        })) || [];

    setSelectableItems(items);
  }, [purpose]);

  /* -------------------- Render -------------------- */

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography
          variant="h2"
          component="h6"
          fontWeight={500}
          fontSize={"20px"}
        >
          Deduction
        </Typography>

        <Box onClick={handleAddRow} sx={addButtonSx}>
          <IoAdd size={18} />
          Add Range
        </Box>
      </Stack>

      {/* Rows */}
      {rows.map((row, idx) => (
        <Stack direction="row" alignItems="end" spacing={2} key={idx}>
          <BasicSelect
            label="From"
            value={row.from}
            options={getFromOptions(idx)}
            onChange={(e) => handleInputChange(idx, "from", e.target.value)}
          />

          <BasicSelect
            label="To"
            value={row.to}
            options={getToOptions(idx)}
            onChange={(e) => handleInputChange(idx, "to", e.target.value)}
            disabled={!row.from}
          />

          <BasicInput
            label="Remark"
            value={row.remark}
            onChange={(e) => handleInputChange(idx, "remark", e.target.value)}
            disabled={!row.from}
          />

          <Box
            onClick={() => handleRemoveRow(idx)}
            sx={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              bgcolor: "error.50",
              color: "error.main",
              cursor: rows.length === 1 ? "not-allowed" : "pointer",
              opacity: rows.length === 1 ? 0.4 : 1,
              transition: "all 0.15s",
              "&:hover":
                rows.length === 1
                  ? {}
                  : {
                      bgcolor: "error.100",
                      transform: "scale(1.05)",
                    },
            }}
          >
            <IoIosRemove size={18} />
          </Box>
        </Stack>
      ))}

      {/* Footer */}
      <Stack direction="row" justifyContent="end">
        <BasicButton
          value="Cancel"
          variant="text"
          onClick={handleClickCancel}
        />
        <BasicButton
          value="Generate"
          variant="text"
          onClick={() => onSubmit(rows)}
        />
      </Stack>
    </Stack>
  );
};

export default DeductionContent;
