import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { startLoading, stopLoading } from "../../../redux/loadingSlice";
import {
  editSurveyPurpose,
  getFieldBook,
} from "../../../services/surveyServices";
import { handleFormError } from "../../../utils/handleFormError";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import BasicButtons from "../../../components/BasicButton";
import { MdArrowBackIosNew, MdDownload } from "react-icons/md";
import { IoIosAddCircleOutline } from "react-icons/io";
import {
  Box,
  Stack,
  Paper,
  TableContainer,
  Typography,
} from "@mui/material";

import FieldBookTable from "./FieldBookTable";
import { calculateTableData } from "./calculateTableData";
import { purposeCode } from "../../../constants";
import { showAlert } from "../../../redux/alertSlice";
import BasicMenu from "../../../components/BasicMenu";
import { BsThreeDots } from "react-icons/bs";
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineModeEdit } from "react-icons/md";
import { BiSave } from "react-icons/bi";
import SmallHeader from "../../../components/SmallHeader";

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

const exportFieldBookPdf = ({ head, tableData, survey, purpose }) => {
  const doc = new jsPDF("p", "mm", "a4");

  // Title: centered, bold, italic, uppercase
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(10);
  const projectTitle = (survey?.project || "SURVEY PROJECT REPORT").toUpperCase();
  const splitTitle = doc.splitTextToSize(projectTitle, 180); // 180mm width limit
  
  let currentY = 15;
  splitTitle.forEach((line) => {
    doc.text(line, 105, currentY, { align: "center" });
    currentY += 5;
  });
  
  currentY += 5;

  // Metadata block: Date of Survey, Designation, Zone, Stage
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  // Left Column
  const dateStr = survey?.DateOfSurvey 
    ? new Date(survey.DateOfSurvey).toLocaleDateString("en-IN") 
    : "_____________________";
  const designationStr = survey?.engineerSurveyor || "Assistant Engineer";

  doc.text(`Date of Survey : ${dateStr}`, 15, currentY);
  doc.text(`Designation    : ${designationStr}`, 15, currentY + 5);

  // Right Column
  const zoneStr = `"________________________"`;
  const isInitialLevel = !purpose?.type || purpose?.type === "Initial Level";
  const stageStr = purpose?.type ? `${purpose.type}s` : "Initial Levels";

  doc.text(`Zone  : ${zoneStr}`, 130, currentY);
  
  doc.text(`Stage : `, 130, currentY + 5);
  
  // Render stage value with green or red color
  if (isInitialLevel) {
    doc.setTextColor(16, 185, 129); // green #10b981
  } else {
    doc.setTextColor(239, 68, 68); // red #ef4444
  }
  doc.setFont("helvetica", "bold");
  doc.text(stageStr, 142, currentY + 5);
  
  // Reset text color and font
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  const tableStartY = currentY + 12;

  // Render Table
  autoTable(doc, {
    startY: tableStartY,
    margin: { left: 15, right: 15 },
    theme: "grid",
    head: [head],
    body: tableData.map((row) => {
      // If it is Instrument Setup, show the checkbox symbol ▣ in Offset
      const offsetVal = row.rowType === "Instrument setup" ? "▣" : (row.Offset || "");
      return [
        row.CH || "",
        row.BS || "",
        row.IS || "",
        row.FS || "",
        row.HI || "",
        row.RL || "",
        offsetVal,
        row.remarks || "",
      ];
    }),
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: 0,
      lineWidth: 0.1,
      valign: "middle",
      halign: "center", // Align all cell text to center!
      fontStyle: "bold", // Bold all table text!
      font: "helvetica",
    },
    headStyles: {
      fontStyle: "bolditalic", // Bold italic headers
      halign: "center",
      valign: "middle",
      fillColor: [255, 255, 255], // White background
      textColor: 0,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { halign: "center" },
      1: { halign: "center" },
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center" },
      6: { halign: "center" },
      7: { halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 7) {
        const rowData = tableData[data.row.index];
        if (rowData && rowData.diff !== undefined && rowData.diff !== null) {
          data.cell.styles.textColor = rowData.diff === 0 ? [16, 185, 129] : [239, 68, 68];
        }
      }
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
  const [survey, setSurvey] = useState(null);
  const [updatedRows, setUpdatedRows] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleMenuSelect = (item) => {
    if (item.value === "reports") {
      navigate(`/survey/${purpose?.surveyId}/report`);
    }
    if (item.value === "excel download") {
      exportToExcel();
    }
    if (item.value === "pdf download") {
      exportFieldBookPdf({ head, tableData, survey, purpose });
    }
  };

  // --- Fetch purpose data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!global) dispatch(startLoading());
        const { data } = await getFieldBook(id);

        if (data?.success) {
          // backend now returns the full survey with purposes array
          setSurvey(data.survey);
          // keep the current purpose (first matching purpose) for edits
          setPurpose(data.survey?.purposes?.[0] || null);
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
  // table rendering expects the full survey object (with purposes & branches)
  const tableData = useMemo(() => {
    if (!survey) return [];
    return calculateTableData(survey);
  }, [survey]);

  const handleRLChange = (rowIndex, value) => {
    // update purpose rows and survey reduced level for table recompute
    setPurpose((prev) => {
      if (!prev) return prev;
      const newRows = prev.rows?.map((row) =>
        row.type === "Instrument setup"
          ? { ...row, reducedLevels: [value] }
          : row,
      );

      return {
        ...prev,
        surveyId: { ...prev.surveyId, reducedLevel: value },
        rows: newRows,
      };
    });

    setSurvey((s) => {
      if (!s) return s;
      const newSurvey = { ...s, reducedLevel: value };
      newSurvey.purposes = newSurvey.purposes?.map((p) =>
        String(p._id) === String(purpose?._id)
          ? {
              ...p,
              rows: p.rows?.map((row) =>
                row.type === "Instrument setup"
                  ? { ...row, reducedLevels: [value] }
                  : row,
              ),
            }
          : p,
      );
      return newSurvey;
    });

    setUpdatedRows((prev) => ({
      ...prev,
      [rowIndex]: true,
    }));
  };

  // --- Handle field edits from the table (immutable updates) ---
  const handleFieldChange = useCallback(
    (rowIndex, fieldKey, nestedIndex, value) => {
      setPurpose((prev) => {
        if (!prev) return prev;

        const newRows = prev.rows.map((r, i) => {
          if (i !== rowIndex) return r;

          let updatedRow = { ...r };
          const isChainage = updatedRow.type === "Chainage";

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
              if (isChainage) {
                const offsetsList = Array.isArray(
                  updatedRow.intermediateOffsets,
                )
                  ? [...updatedRow.intermediateOffsets]
                  : [];
                if (offsetsList[nestedIndex]) {
                  offsetsList[nestedIndex] = {
                    ...offsetsList[nestedIndex],
                    is: value,
                  };
                }
                updatedRow.intermediateOffsets = offsetsList;
              } else {
                const isArr = Array.isArray(updatedRow.intermediateSight)
                  ? [...updatedRow.intermediateSight]
                  : [];
                isArr[nestedIndex] = value;
                updatedRow.intermediateSight = isArr;
              }
              break;

            case "Offset":
              if (isChainage) {
                const offsetsList = Array.isArray(
                  updatedRow.intermediateOffsets,
                )
                  ? [...updatedRow.intermediateOffsets]
                  : [];
                if (offsetsList[nestedIndex]) {
                  offsetsList[nestedIndex] = {
                    ...offsetsList[nestedIndex],
                    offset: value,
                  };
                }
                updatedRow.intermediateOffsets = offsetsList;
              }
              break;

            case "remarks":
              if (isChainage) {
                const offsetsList = Array.isArray(
                  updatedRow.intermediateOffsets,
                )
                  ? [...updatedRow.intermediateOffsets]
                  : [];
                if (offsetsList[nestedIndex]) {
                  offsetsList[nestedIndex] = {
                    ...offsetsList[nestedIndex],
                    remark: value,
                  };
                }
                updatedRow.intermediateOffsets = offsetsList;
              } else {
                updatedRow.remark = value;
              }
              break;
          }

          return updatedRow;
        });

        // also reflect change inside survey.purposes for table rendering
        setSurvey((s) => {
          if (!s) return s;
          const newSurvey = { ...s };
          newSurvey.purposes = newSurvey.purposes?.map((p) =>
            String(p._id) === String(prev._id) ? { ...p, rows: newRows } : p,
          );
          return newSurvey;
        });

        return { ...prev, rows: newRows };
      });

      // Track only updated rows here
      setUpdatedRows((prev) => ({
        ...prev,
        [rowIndex]: true, // mark row index as changed
      }));
    },
    [],
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
          }),
        );
        return;
      }

      // Example payload sent to API
      const payload = {
        surveyId: survey?._id || purpose?.surveyId?._id,
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

  const exportToExcel = useCallback(async () => {
    if (!purpose) return;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      `${purposeCode[purpose.type] || "Survey"} AE`,
    );

    sheet.views = [{ showGridLines: true }];

    // --- 1. Project Title ---
    sheet.mergeCells("A1:H1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = (survey?.project || purpose?.surveyId?.project || "SURVEY PROJECT REPORT").toUpperCase();
    titleCell.font = { name: "Calibri", size: 14, bold: true, italic: true };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(1).height = 30;

    // --- 2. Metadata Block ---
    const dateStr = survey?.DateOfSurvey 
      ? new Date(survey.DateOfSurvey).toLocaleDateString("en-IN") 
      : "_____________________";
    const designationStr = survey?.engineerSurveyor || "Assistant Engineer";
    
    const zoneStr = `"________________________"`;
    const isInitialLevel = !purpose?.type || purpose?.type === "Initial Level";
    const stageStr = purpose?.type ? `${purpose.type}s` : "Initial Levels";

    // Row 3
    sheet.getCell("A3").value = "Date of Survey";
    sheet.getCell("A3").font = { name: "Calibri", italic: true, color: { argb: "FF666666" } };
    sheet.getCell("B3").value = `: ${dateStr}`;
    sheet.getCell("B3").font = { name: "Calibri", bold: true };
    
    sheet.getCell("G3").value = "Zone";
    sheet.getCell("G3").font = { name: "Calibri", italic: true, color: { argb: "FF666666" } };
    sheet.getCell("H3").value = `: ${zoneStr}`;
    sheet.getCell("H3").font = { name: "Calibri", bold: true };

    // Row 4
    sheet.getCell("A4").value = "Designation";
    sheet.getCell("A4").font = { name: "Calibri", italic: true, color: { argb: "FF666666" } };
    sheet.getCell("B4").value = `: ${designationStr}`;
    sheet.getCell("B4").font = { name: "Calibri", bold: true };
    
    sheet.getCell("G4").value = "Stage";
    sheet.getCell("G4").font = { name: "Calibri", italic: true, color: { argb: "FF666666" } };
    sheet.getCell("H4").value = `: ${stageStr}`;
    sheet.getCell("H4").font = {
      name: "Calibri",
      bold: true,
      color: { argb: isInitialLevel ? "FF10B981" : "FFEF4444" }
    };

    sheet.getRow(3).height = 20;
    sheet.getRow(4).height = 20;

    // --- 3. Table Headers ---
    const headers = ["CH", "BS", "IS", "FS", "HI", "RL", "OFFSET", "REMARKS"];
    const headerRow = sheet.getRow(6);
    headers.forEach((h, colIndex) => {
      const cell = headerRow.getCell(colIndex + 1);
      cell.value = h;
      cell.font = { name: "Calibri", bold: true, italic: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD3D3D3" } },
        left: { style: "thin", color: { argb: "FFD3D3D3" } },
        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
        right: { style: "thin", color: { argb: "FFD3D3D3" } },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
    });
    headerRow.height = 22;

    // --- 4. Table Body ---
    let currentRowNum = 7;
    tableData.forEach((row) => {
      const excelRow = sheet.getRow(currentRowNum);
      
      const chVal = row.CH || "";
      const bsVal = row.BS || "";
      const isVal = row.IS || "";
      const fsVal = row.FS || "";
      const hiVal = row.HI || "";
      const rlVal = row.RL || "";
      const offsetVal = row.rowType === "Instrument setup" ? "▣" : (row.Offset || "");
      const remarksVal = row.remarks || "";

      const rowValues = [chVal, bsVal, isVal, fsVal, hiVal, rlVal, offsetVal, remarksVal];
      
      rowValues.forEach((val, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        cell.value = val;
        
        // remarks diff color
        let textColor = "FF000000";
        if (colIndex === 7 && row.diff !== undefined && row.diff !== null) {
          textColor = row.diff === 0 ? "FF10B981" : "FFEF4444";
        }
        
        cell.font = { name: "Calibri", bold: true, color: { argb: textColor } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD3D3D3" } },
          left: { style: "thin", color: { argb: "FFD3D3D3" } },
          bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
          right: { style: "thin", color: { argb: "FFD3D3D3" } },
        };
      });
      
      excelRow.height = 20;
      currentRowNum++;
    });

    // widths
    [15, 12, 12, 12, 12, 12, 12, 36].forEach(
      (w, i) => (sheet.getColumn(i + 1).width = w),
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Survey_${purpose?.type || "Report"}.xlsx`);
  }, [purpose, tableData, survey]);

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 4 }}>
      <SmallHeader />

      <Box p={2}>
        <Typography
          variant="h5"
          fontWeight={800}
          color="#1e293b"
          sx={{ mb: 2, letterSpacing: "-0.01em" }}
        >
          Field Observations!
        </Typography>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          mb={2}
        >
          <BasicButtons
            variant="text"
            sx={{
              height: 48,
              width: 48,
              minWidth: 48,
              borderRadius: "14px",
              color: "#334155",
              bgcolor: "#f1f5f9",
              border: "none",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#e2e8f0",
                color: "#1e293b",
              },
            }}
            onClick={() => navigate(-1)}
            value={<MdArrowBackIosNew fontSize={22} />}
          />

          <Stack direction="row" alignItems="center" spacing={1}>
            <BasicButtons
              variant="contained"
              sx={{
                py: 1,
                px: 2,
                fontSize: 12,
                borderRadius: "14px",
                bgcolor: "#6366f1",
                color: "#ffffff",
                boxShadow: "0 10px 24px -12px rgba(99, 102, 241, 0.8)",
                "&:hover": { bgcolor: "#4f46e5" },
              }}
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
              sx={{
                py: 1,
                px: 2,
                fontSize: 12,
                height: 40,
                minWidth: "76px",
                borderRadius: "14px",
                borderColor: "rgba(99, 102, 241, 0.28)",
                color: "#4f46e5",
                bgcolor: "#ffffff",
                fontWeight: 800,
                boxShadow: "0 8px 20px -14px rgba(79, 70, 229, 0.55)",
                "&:hover": {
                  bgcolor: "rgba(99, 102, 241, 0.08)",
                  borderColor: "#6366f1",
                },
              }}
              onClick={() =>
                navigate(
                  `/survey/road-survey/continue-survey/${
                    purpose?.surveyId?._id || purpose?.surveyId || survey?._id
                  }`,
                  { state: { fromPL: true } },
                )
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
                sx={{
                  minWidth: "40px",
                  height: 40,
                  p: 1,
                  borderRadius: "14px",
                  border: "1px solid rgba(99, 102, 241, 0.28)",
                  color: "#4f46e5",
                  bgcolor: "#ffffff",
                  boxShadow: "0 8px 20px -14px rgba(79, 70, 229, 0.55)",
                  "&:hover": { bgcolor: "rgba(99, 102, 241, 0.08)" },
                }}
                menuSx={{
                  minWidth: 150,
                  py: 0.75,
                  "&::before": {
                    bgcolor: "#ffffff",
                    borderLeft: "1px solid rgba(226, 232, 240, 0.9)",
                    borderTop: "1px solid rgba(226, 232, 240, 0.9)",
                  },
                }}
                itemSx={{
                  mx: 0.75,
                  my: 0.25,
                  borderRadius: "10px",
                }}
              />
            </Box>
          </Stack>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            backgroundColor: "#ffffff",
            overflowX: "auto",
          }}
        >
        <TableContainer sx={{ border: "none", boxShadow: "none" }}>
          <FieldBookTable
            tableData={tableData}
            isEditing={isEditing}
            onFieldChange={handleFieldChange}
            onRLChange={handleRLChange}
          />
        </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}
