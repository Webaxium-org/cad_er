import { Box, Button, Stack, Typography, Divider } from "@mui/material";
import { useEffect, useState, useMemo } from "react";
import BasicSelect from "../../../components/BasicSelect";
import { IoAdd } from "react-icons/io5";
import { IoIosRemove } from "react-icons/io";
import { IoTrashOutline } from "react-icons/io5";
import BasicButton from "../../../components/BasicButton";
import BasicInput from "../../../components/BasicInput";

const initialRow = {
  from: "",
  to: "",
  remark: "",
};

const addButtonSx = {
  color: "#4f46e5",
  px: 1.5,
  "&:hover": {
    bgcolor: "rgba(99, 102, 241, 0.08)",
  },
};

const DeductionContent = ({ purpose, onCancel, onSubmit }) => {
  const [rows, setRows] = useState([initialRow]);
  const [history, setHistory] = useState([]);
  const [selectableItems, setSelectableItems] = useState([]);

  /* -------------------- Storage Key -------------------- */

  const storageKey = useMemo(() => {
    const projectId = purpose?.projectId || "default";
    return `deduction_history_${projectId}`;
  }, [purpose]);

  /* -------------------- Helpers -------------------- */

  const getIndex = (value) =>
    selectableItems.findIndex((i) => i.value === value);

  const getFromOptions = (rowIndex) => {
    if (rowIndex === 0) return selectableItems;
    const prevTo = rows[rowIndex - 1]?.to;
    if (!prevTo) return [];
    const prevToIndex = getIndex(prevTo);
    return selectableItems.slice(prevToIndex);
  };

  const getToOptions = (rowIndex) => {
    const fromValue = rows[rowIndex]?.from;
    if (!fromValue) return [];
    const fromIndex = getIndex(fromValue);
    return selectableItems.slice(fromIndex + 1);
  };

  /* -------------------- Handlers -------------------- */

  const handleInputChange = (index, field, value) => {
    setRows((prev) => {
      const updatedRow = {
        ...prev[index],
        [field]: value,
        ...(field === "from" ? { to: "" } : {}),
      };

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
          remark: "",
        },
      ];
    });
  };

  const handleRemoveRow = (index) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveHistory = (id) => {
    const updated = history.filter((item) => item.id !== id);

    setHistory(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  /* -------------------- Generate & Save -------------------- */

  const handleGenerate = () => {
    if (!rows.length) return;

    const newEntry = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      rows,
    };

    const updatedHistory = [newEntry, ...history];

    setHistory(updatedHistory);
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory));

    onSubmit(rows);
  };

  const handleSelectHistory = (entry) => {
    onSubmit(entry.rows);
  };

  /* -------------------- Effects -------------------- */

  useEffect(() => {
    const items =
      purpose?.rows
        ?.filter((r) => r.type === "Chainage" || r.type === "Water Level")
        ?.map((s) => ({
          label: s.chainage,
          value: s.chainage,
        })) || [];

    setSelectableItems(items);
  }, [purpose]);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistory(Array.isArray(parsed) ? parsed : []);
      } catch {
        setHistory([]);
      }
    }
  }, [storageKey]);

  /* -------------------- Render -------------------- */

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography
          variant="h2"
          component="h6"
          fontWeight={500}
          fontSize={"20px"}
        >
          Deduction
        </Typography>

        <BasicButton
          value="Add Range"
          variant="text"
          startIcon={<IoAdd size={18} />}
          sx={addButtonSx}
          onClick={handleAddRow}
        />
      </Stack>

      {/* ----------- History Section ----------- */}

      {history.length > 0 && (
        <>
          <Typography fontWeight={500}>Previously Used</Typography>

          <Stack spacing={1}>
            {history.map((entry) => (
              <Box
                key={entry.id}
                onClick={() => handleSelectHistory(entry)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "grey.100",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  "&:hover": { bgcolor: "grey.200" },
                }}
              >
                <Box>
                  <Typography fontSize={13}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </Typography>

                  <Typography fontSize={12} color="text.secondary">
                    {entry.rows.map((r) => `${r.from} → ${r.to}`).join(", ")}
                  </Typography>
                </Box>

                {/* DELETE ICON */}
                <Box
                  onClick={(e) => {
                    e.stopPropagation(); // 🔥 prevents report generation
                    handleRemoveHistory(entry.id);
                  }}
                  sx={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 2,
                    bgcolor: "error.50",
                    color: "error.main",
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: "error.100",
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <IoTrashOutline size={16} />
                </Box>
              </Box>
            ))}
          </Stack>

          <Divider />
        </>
      )}

      {/* ----------- New Deduction Builder ----------- */}

      {rows.map((row, idx) => (
        <Stack direction="row" spacing={2} alignItems="end" key={idx}>
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
          />

          <Box onClick={() => handleRemoveRow(idx)}>
            <IoIosRemove />
          </Box>
        </Stack>
      ))}

      <Stack direction="row" justifyContent="end" gap={1}>
        <Button onClick={onCancel} variant="outlined" sx={{ borderRadius: "12px", borderColor: "#cbd5e1", color: "#475569", fontWeight: 700, textTransform: "none" }}>
          Cancel
        </Button>
        <Button onClick={handleGenerate} variant="contained" sx={{ borderRadius: "12px", bgcolor: "#6366f1", fontWeight: 800, textTransform: "none", "&:hover": { bgcolor: "#4f46e5" } }}>
          Generate
        </Button>
      </Stack>
    </Stack>
  );
};

export default DeductionContent;
