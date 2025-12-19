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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import BasicButtons from "../../../components/BasicButton";
import { MdArrowBackIosNew, MdDownload } from "react-icons/md";
import { IoIosAddCircleOutline } from "react-icons/io";
import { Box, Stack, Paper, TableContainer } from "@mui/material";

import FieldBookTable, { calculateTableData } from "./FieldBookTable";
import { purposeCode } from "../../../constants";
import { showAlert } from "../../../redux/alertSlice";
import BasicMenu from "../../../components/BasicMenu";
import { BsThreeDots } from "react-icons/bs";
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineModeEdit } from "react-icons/md";
import { BiSave } from "react-icons/bi";

const menuItems = [
  {
    label: (
      <Stack direction={"row"} alignItems={"center"} gap={0.5}>
        Reports
        <TbReportSearch />
      </Stack>
    ),
    value: "reports",
  },
  {
    label: (
      <Stack direction={"row"} alignItems={"center"} gap={0.5}>
        Excel
        <MdDownload />
      </Stack>
    ),
    value: "excel download",
  },
  {
    label: (
      <Stack direction={"row"} alignItems={"center"} gap={0.5}>
        PDF
        <MdDownload />
      </Stack>
    ),
    value: "pdf download",
  },
];

const exportFieldBookPdf = ({ head, tableData }) => {
  const doc = new jsPDF("p", "mm", "a4");

  autoTable(doc, {
    margin: { top: 25 },
    theme: "grid",
    head: [head],
    body: tableData.map((row) => [
      row.CH,
      row.BS,
      row.IS,
      row.FS,
      row.HI,
      row.RL,
      row.Offset,
      row.remarks,
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: 0,
      lineWidth: 0.1,
      valign: "middle",
    },
    headStyles: {
      fontStyle: "bold",
      halign: "right",
      valign: "middle",
      fillColor: false,
      textColor: 0,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { halign: "left" }, // CH
      1: { halign: "right" }, // BS
      2: { halign: "right" }, // IS
      3: { halign: "right" }, // FS
      4: { halign: "right" }, // HI
      5: { halign: "right" }, // RL
      6: { halign: "right" }, // Offset
      7: { halign: "right" }, // Remarks
    },
    didDrawPage: () => {
      // ===== TITLE =====
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Fieldbook", 105, 15, { align: "center" });
    },
  });

  doc.save("fieldbook.pdf");
};

const head = ["CH", "BS", "IS", "FS", "HI", "RL", "Offset", "Remarks"];

export default function FieldBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { global } = useSelector((s) => s.loading);

  const [purpose, setPurpose] = useState(null);
  const [updatedRows, setUpdatedRows] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleMenuSelect = (item) => {
    if (item.value === "reports") {
      navigate(`/survey/${purpose?.surveyId?._id}/report`);
    }
    if (item.value === "excel download") {
      exportToExcel();
    }
    if (item.value === "pdf download") {
      exportFieldBookPdf({ head, tableData });
    }
  };

  // --- Fetch purpose data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!global) dispatch(startLoading());
        const { data } = await getSurveyPurpose(id);

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
            variant="outlined"
            sx={{ py: 1, px: 2, fontSize: 12 }}
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            value={
              isEditing ? (
                <Stack direction="row" gap={0.5} alignItems="center">
                  <BiSave fontSize={16} />
                  {saving ? "Saving..." : "Save"}
                </Stack>
              ) : (
                <Stack direction="row" gap={0.5} alignItems="center">
                  <MdOutlineModeEdit fontSize={16} />
                  Edit
                </Stack>
              )
            }
            loading={saving}
          />

          <BasicButtons
            variant="outlined"
            sx={{ py: 1, px: 2, fontSize: 12, minWidth: "78px" }}
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

          <Box textAlign={"end"}>
            <BasicMenu
              label={<BsThreeDots />}
              items={menuItems}
              onSelect={handleMenuSelect}
              sx={{ minWidth: "fit-content", p: 1 }}
            />
          </Box>
        </Stack>
      </Stack>

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
