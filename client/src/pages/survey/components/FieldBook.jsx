// FieldBook.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { startLoading, stopLoading } from "../../../redux/loadingSlice";
import {
  editSurveyPurpose,
  getSurveyPurpose,
} from "../../../services/surveyServices";
import { handleFormError } from "../../../utils/handleFormError";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import BasicButtons from "../../../components/BasicButton";
import BasicInput from "../../../components/BasicInput";

import { MdArrowBackIosNew, MdDownload } from "react-icons/md";
import { IoIosAddCircleOutline } from "react-icons/io";
import { Box, Stack, Paper, TableContainer } from "@mui/material";

import FieldBookTable, { calculateTableData } from "./FieldBookTable";
import { purposeCode } from "../../../constants";
import { showAlert } from "../../../redux/alertSlice";

export default function FieldBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { global } = useSelector((s) => s.loading);

  const [purpose, setPurpose] = useState(null);
  const [updatedRows, setUpdatedRows] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- Fetch purpose data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!global) dispatch(startLoading());
        const { data } = await getSurveyPurpose(id);
        console.log(data);
        if (data?.success) {
          setPurpose(data.purpose);
        } else {
          throw new Error("Failed to load purpose");
        }
      } catch (err) {
        handleFormError(err, null, dispatch, navigate);
      } finally {
        dispatch(stopLoading());
      }
    };
    fetchData();
  }, [id]);

  // --- Derived table data (recomputes when `purpose` changes) ---
  const tableData = useMemo(() => {
    if (!purpose) return [];
    return calculateTableData(purpose);
  }, [purpose]);

  // --- Handle field edits from the table (immutable updates) ---
  const handleFieldChange = useCallback(
    (rowIndex, fieldKey, nestedIndex, value) => {
      setPurpose((prev) => {
        if (!prev) return prev;

        const newRows = prev.rows.map((r, i) => {
          if (i !== rowIndex) return r;

          let updatedRow = { ...r };

          switch (fieldKey) {
            case "CH":
              updatedRow.chainage = value;
              break;
            case "BS":
              updatedRow.backSight = value;
              break;
            case "FS":
              updatedRow.foreSight = value;
              break;

            case "IS":
              const isArr = Array.isArray(updatedRow.intermediateSight)
                ? [...updatedRow.intermediateSight]
                : [];
              isArr[nestedIndex] = value;
              updatedRow.intermediateSight = isArr;
              break;

            case "Offset":
              const offArr = Array.isArray(updatedRow.offsets)
                ? [...updatedRow.offsets]
                : [];
              offArr[nestedIndex] = value;
              updatedRow.offsets = offArr;
              break;

            case "remarks":
              const rmArr = Array.isArray(updatedRow.remarks)
                ? [...updatedRow.remarks]
                : [];
              rmArr[nestedIndex ?? 0] = value;
              updatedRow.remarks = rmArr;
              break;
          }

          return updatedRow;
        });

        return { ...prev, rows: newRows };
      });

      // Track only updated rows here
      setUpdatedRows((prev) => ({
        ...prev,
        [rowIndex]: true, // mark row index as changed
      }));
    },
    []
  );

  // --- Save handler (placeholder) ---
  const handleSave = async () => {
    setSaving(true);
    try {
      // Extract only changed rows
      const changed = Object.keys(updatedRows).map((i) => ({
        index: Number(i),
        data: purpose.rows[Number(i)],
      }));

      if (!changed.length) {
        setIsEditing(false);
        setSaving(false);

        dispatch(
          showAlert({
            type: "error",
            message: "No changes made to save.",
          })
        );
        return;
      }

      // Example payload sent to API
      const payload = {
        surveyId: purpose.surveyId._id,
        purposeId: purpose._id,
        updatedRows: changed,
      };

      await editSurveyPurpose(payload);

      // clear edit mode
      setIsEditing(false);
      setUpdatedRows({});
    } catch (err) {
      handleFormError(err, null, dispatch, navigate);
    } finally {
      setSaving(false);
    }
  };

  // --- Excel export (keeps your original style/formatting) ---
  const exportToExcel = useCallback(async () => {
    if (!purpose) return;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      `${purposeCode[purpose.type] || "Survey"} AE`
    );

    // Title
    sheet.mergeCells("A1:H1");
    const title = sheet.getCell("A1");
    title.value = purpose?.surveyId?.project || "";
    title.font = { size: 18, bold: true };
    title.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(1).height = 28;

    // Header rows (simple)
    sheet.addRow([]);
    const headers = ["CH", "BS", "IS", "FS", "HI", "RL", "Offset", "Remarks"];
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
    });

    // Table rows
    tableData.forEach((r) => {
      sheet.addRow([r.CH, r.BS, r.IS, r.FS, r.HI, r.RL, r.Offset, r.remarks]);
    });

    // widths
    [12, 12, 12, 12, 12, 12, 12, 36].forEach(
      (w, i) => (sheet.getColumn(i + 1).width = w)
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Survey_${purpose?.type || "Report"}.xlsx`);
  }, [purpose, tableData]);

  return (
    <Box p={2}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        mb={2}
      >
        <BasicButtons
          variant="outlined"
          sx={{ height: 40, width: 40, minWidth: 40 }}
          onClick={() => navigate(-1)}
          value={<MdArrowBackIosNew fontSize={16} />}
        />

        <Stack direction="row" alignItems="center" spacing={1}>
          <BasicButtons
            variant="contained"
            sx={{ py: 1, px: 2, fontSize: 12, minWidth: 82 }}
            onClick={exportToExcel}
            value={
              <Stack direction="row" alignItems="center">
                Excel <MdDownload fontSize={16} />
              </Stack>
            }
          />

          <BasicButtons
            variant="contained"
            sx={{ py: 1, px: 2, fontSize: 12, minWidth: 82 }}
            onClick={() => navigate(`/survey/${purpose?.surveyId?._id}/report`)}
            value="Reports"
          />

          <BasicButtons
            variant="contained"
            sx={{ py: 1, px: 2, fontSize: 12, minWidth: 82 }}
            onClick={() =>
              navigate(`/survey/road-survey/${purpose?.surveyId?._id}`)
            }
            value={
              <Stack direction="row" gap={0.5} alignItems="center">
                <IoIosAddCircleOutline fontSize={16} />
                PL
              </Stack>
            }
          />
        </Stack>
      </Stack>

      <BasicButtons
        variant="contained"
        sx={{ py: 1, px: 2, fontSize: 12 }}
        onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
        value={isEditing ? (saving ? "Saving..." : "Save") : "Edit"}
        loading={saving}
      />

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <FieldBookTable
          tableData={tableData}
          isEditing={isEditing}
          onFieldChange={handleFieldChange}
        />
      </TableContainer>
    </Box>
  );
}
