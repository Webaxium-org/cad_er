import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import { getSurvey } from "../../services/surveyServices";
import { handleFormError } from "../../utils/handleFormError";
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { MdArrowBackIosNew, MdDownload } from "react-icons/md";
import BasicButtons from "../../components/BasicButton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import BasicMenu from "../../components/BasicMenu";
import { BsThreeDots } from "react-icons/bs";

const menuItems = [
  {
    label: (
      <Stack direction={"row"} alignItems={"center"} gap={0.5}>
        PDF
        <MdDownload />
      </Stack>
    ),
    value: "pdf download",
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
];

const initialDetails = {
  initialEntry: "",
  secondaryEntry: "",
};

const exportVolumeReportPdf = ({ tableData, reportDetails }) => {
  const doc = new jsPDF("p", "mm", "a4");

  // ===== BUILD TABLE BODY =====
  const body = [];

  tableData?.rows?.forEach((row, index) => {
    /* ---------------- Deduction Row ---------------- */
    if (row.isDeductionRow) {
      body.push([
        {
          content: row.deductionMessage,
          colSpan: 13,
          styles: {
            fontStyle: "bolditalic",
            halign: "left",
            fillColor: [245, 245, 245],
          },
        },
      ]);
    }

    /* ---------------- Normal Data Row ---------------- */
    body.push([
      index + 1,
      row.section,
      row.prevSection,
      row.difference,
      row.width,

      row.cuttingAreaSqMtr,
      row.cuttingPrevArea,
      row.cuttingAvgSqrMtr,
      row.cuttingVolumeCubicMtr,

      row.fillingAreaSqMtr,
      row.fillingPrevArea,
      row.fillingAvgSqrMtr,
      row.fillingVolumeCubicMtr,
    ]);
  });

  // ===== TOTAL ROW (EXACT UI ALIGNMENT) =====
  body.push([
    "",
    "",
    "",
    "",
    "",
    { content: "Total", colSpan: 3, styles: { fontStyle: "bold" } },
    {
      content: Number(tableData?.totalCuttingVolume)?.toFixed(3),
      styles: { fontStyle: "bold" },
    },
    "",
    "",
    "",
    {
      content: Number(tableData?.totalFillingVolume)?.toFixed(3),
      styles: { fontStyle: "bold" },
    },
  ]);

  autoTable(doc, {
    margin: { top: 20 },
    theme: "grid",
    head: [
      [
        { content: "Sl.No.", rowSpan: 2 },
        { content: "Section From", rowSpan: 2 },
        { content: "Previous Section", rowSpan: 2 },
        { content: "Difference", rowSpan: 2 },
        { content: "Width", rowSpan: 2 },
        { content: "Cutting Volume", colSpan: 4 },
        { content: "Filling Volume", colSpan: 4 },
      ],
      [
        "Area Sq. Mtrs",
        "Previous Area",
        "Average Sq. Mtrs",
        "Volume Cubic Meters",

        "Area Sq. Mtrs",
        "Previous Area",
        "Average Sq. Mtrs",
        "Volume Cubic Meters",
      ],
    ],
    body,
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: 0,
      lineWidth: 0.1,
      valign: "middle",
    },
    headStyles: {
      fontSize: 7.5,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      fillColor: false,
      textColor: 0,
      lineWidth: 0.1,
    },
    didDrawPage: () => {
      // ===== REPEATING TITLE =====
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        `Volume Report ${reportDetails.initialEntry} and ${reportDetails.secondaryEntry}`,
        105,
        15,
        { align: "center" }
      );
    },
  });

  doc.save("volume-report.pdf");
};

const VolumeReport = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const reportDetails = useRef(initialDetails);

  const { state } = useLocation();

  const dispatch = useDispatch();

  const { global } = useSelector((state) => state.loading);

  const [survey, setSurvey] = useState([]);

  const handleMenuSelect = (item) => {
    if (item.value === "excel download") {
      exportToExcel();
    }
    if (item.value === "pdf download") {
      exportVolumeReportPdf({
        tableData,
        reportDetails: reportDetails.current,
      });
    }
  };

  const fetchSurvey = async () => {
    try {
      if (!global) {
        dispatch(startLoading());
      }

      const { data } = await getSurvey(id);

      if (data.success) {
        setSurvey(data.survey || []);
      } else {
        throw Error("Failed to fetch survey");
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  const shortType = (type) => {
    if (!type) return type;
    return type.replace(/^Proposed\s+/i, "Prop. ");
  };

  const tableData = useMemo(() => {
    let initialEntry = null;
    let secondaryEntry = null;
    const deductions = (state && state?.rows) || [];
    const isDeduction = deductions.length;

    if (state && state?.selectedPurposeIds?.length) {
      initialEntry = survey?.purposes?.find(
        (p) => String(p._id) === String(state.selectedPurposeIds[0])
      );
      secondaryEntry = survey?.purposes?.find(
        (p) => String(p._id) === String(state.selectedPurposeIds[1])
      );
    } else {
      initialEntry = survey?.purposes?.find((p) => p.type === "Initial Level");
      secondaryEntry = survey?.purposes?.find(
        (p) => p.type === "Proposed Level"
      );
    }

    if (!survey || !initialEntry || !secondaryEntry) return [];

    reportDetails.current = {
      initialEntry: shortType(initialEntry.type),
      secondaryEntry: shortType(secondaryEntry.type),
    };

    const initialRows = initialEntry?.rows ?? [];
    const secondaryRows = secondaryEntry?.rows ?? [];
    const rows = [];

    let prevSection = null;
    let currentDeduction = null;
    let isDeductionStarted = false;
    let isDeductionRemarkAdded = false;
    let cuttingPrevArea = "0.000";
    let fillingPrevArea = "0.000";

    const totals = {
      totalCuttingVolume: 0,
      totalFillingVolume: 0,
    };

    // Process only "Chainage" rows
    const filteredInitialRows = initialRows.filter(
      (row) => row.type === "Chainage"
    );

    filteredInitialRows.forEach((row) => {
      const secondaryRow = secondaryRows?.find(
        (p) => p.chainage === row.chainage
      );
      const chainage = row.chainage?.split(survey?.separator || "/")?.[1] ?? "";

      let prevReadings = [];

      const data = (row?.offsets ?? []).map((entry, idx) => {
        const initialEntryRL = row?.reducedLevels?.[idx] ?? 0;
        const secondaryEntryRL = secondaryRow?.reducedLevels?.[idx] ?? 0;

        const initRL = Number(initialEntryRL);
        const propRL = Number(secondaryEntryRL);
        const offsetVal = Number(entry);
        const prevOffsetVal = Number(row?.offsets?.[idx - 1] ?? 0);

        // Determine whether it's cutting or filling
        const isCutting = initRL > propRL;

        // Shared width (W) for both cutting and filling
        const widthMtr =
          idx === 0 ? "0.000" : (offsetVal - prevOffsetVal).toFixed(3);

        const cuttingMtr = isCutting ? (initRL - propRL).toFixed(3) : "0.000";

        const cuttingAvgMtr =
          isCutting || idx === 0
            ? "0.000"
            : (
                (Number(cuttingMtr) +
                  Number(prevReadings[idx - 1]?.cuttingMtr || 0)) /
                2
              ).toFixed(3);

        const fillingMtr = isCutting ? "0.000" : (propRL - initRL).toFixed(3);

        const fillingAvgMtr =
          isCutting || idx === 0
            ? "0.000"
            : (
                (Number(fillingMtr) +
                  Number(prevReadings[idx - 1]?.fillingMtr || 0)) /
                2
              ).toFixed(3);

        const dataDoc = {
          offset: entry,
          initialEntryRL,
          secondaryEntryRL,
          cuttingMtr,
          cuttingAvgMtr,
          cuttingWMtr: widthMtr,
          cuttingAreaSqMtr: (Number(cuttingAvgMtr) * Number(widthMtr)).toFixed(
            3
          ),
          fillingMtr,
          fillingAvgMtr,
          fillingWMtr: widthMtr,
          fillingAreaSqMtr: (Number(fillingAvgMtr) * Number(widthMtr)).toFixed(
            3
          ),
        };

        prevReadings.push(dataDoc);
        return dataDoc;
      });

      // --- Total area for this section ---
      const cuttingAreaSqMtr = data.reduce(
        (acc, curr) => acc + Number(curr.cuttingAreaSqMtr || 0),
        0
      );
      const fillingAreaSqMtr = data.reduce(
        (acc, curr) => acc + Number(curr.fillingAreaSqMtr || 0),
        0
      );

      // --- Compute chainage difference ---
      const currentChainage = Number(chainage) || 0;
      const prevChainage = Number(prevSection) || 0;
      let difference = null;
      let deductionMessage = null;
      let flag = false;

      if (isDeduction) {
        const isDeductionRow = deductions.find((d) => d.from === row.chainage);

        if (isDeductionRow) {
          isDeductionStarted = true;
          currentDeduction = isDeductionRow;

          difference = prevSection
            ? (currentChainage - prevChainage).toFixed(3)
            : "0.000";
        } else if (isDeductionStarted) {
          if (!isDeductionRemarkAdded) {
            const trimmedRemark = currentDeduction?.remark?.trim();

            difference = "0.000";
            flag = true;

            deductionMessage =
              "Deduction - " +
              (trimmedRemark
                ? trimmedRemark
                : `from ${currentDeduction?.from} to ${currentDeduction?.to}`);

            isDeductionRemarkAdded = true;
          } else {
            const isDeductionEndingNow = currentDeduction.to === row.chainage;

            if (isDeductionEndingNow) {
              currentDeduction = null;
              isDeductionStarted = false;
            }

            difference = "0.000";
          }
        } else {
          difference = prevSection
            ? (currentChainage - prevChainage).toFixed(3)
            : "0.000";
        }
      } else {
        difference = prevSection
          ? (currentChainage - prevChainage).toFixed(3)
          : "0.000";
      }

      // --- Average areas ---
      const cuttingAvgSqrMtr = (
        (Number(cuttingAreaSqMtr) + Number(cuttingPrevArea)) /
        2
      ).toFixed(3);
      const fillingAvgSqrMtr = (
        (Number(fillingAreaSqMtr) + Number(fillingPrevArea)) /
        2
      ).toFixed(3);

      // --- Volumes ---
      const cuttingVolumeCubicMtr = (
        Number(difference) * Number(cuttingAvgSqrMtr)
      ).toFixed(3);
      const fillingVolumeCubicMtr = (
        Number(difference) * Number(fillingAvgSqrMtr)
      ).toFixed(3);

      // --- Push row ---
      rows.push({
        section: currentChainage.toFixed(3),
        prevSection: prevSection ? prevChainage.toFixed(3) : "-",
        difference,
        width: row?.roadWidth ?? "-",
        cuttingAreaSqMtr: cuttingAreaSqMtr.toFixed(3),
        cuttingPrevArea,
        cuttingAvgSqrMtr,
        cuttingVolumeCubicMtr,
        fillingAreaSqMtr: fillingAreaSqMtr.toFixed(3),
        fillingPrevArea,
        fillingAvgSqrMtr,
        fillingVolumeCubicMtr,
        deductionMessage,
        isDeductionRow: flag,
      });

      // --- Prepare for next iteration ---
      cuttingPrevArea = Number(cuttingAreaSqMtr)?.toFixed(3);
      fillingPrevArea = Number(fillingAreaSqMtr)?.toFixed(3);
      totals.totalCuttingVolume += Number(cuttingVolumeCubicMtr);
      totals.totalFillingVolume += Number(fillingVolumeCubicMtr);
      prevSection = chainage;
    });

    return { ...totals, rows };
  }, [survey]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Volume Report");

    // ===== Title =====
    sheet.mergeCells("A1:M1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "Volume Report";
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };

    // ===== Set column widths =====
    sheet.getColumn("A").width = 100 / 7; // or 14.3

    // ===== Header Rows =====
    sheet.addRow([
      "Sl.No.",
      "Section From",
      "Previous Section",
      "Difference",
      "Width",
      "Cutting Volume",
      "",
      "",
      "",
      "Filling Volume",
      "",
      "",
      "",
    ]);

    sheet.addRow([
      "",
      "",
      "",
      "",
      "",
      "Area Sq. Mtrs",
      "Previous Area",
      "Average Sq. Mtrs",
      "Volume Cubic Meters",
      "Area Sq. Mtrs",
      "Previous Area",
      "Average Sq. Mtrs",
      "Volume Cubic Meters",
    ]);

    // ===== Merge Header Cells =====
    sheet.mergeCells("F2:I2"); // Cutting Area
    sheet.mergeCells("J2:M2"); // Filling Area

    // ===== Style Headers =====
    const headerRows = [2, 3];
    headerRows.forEach((r) => {
      const row = sheet.getRow(r);
      row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "000000" } };

        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
      });
    });

    // ===== Data =====
    let currentRow = 3;

    // ===== Data =====
    tableData?.rows?.forEach((entry, idx) => {
      /* ---------------- Deduction Row ---------------- */
      if (entry.isDeductionRow) {
        const deductionRow = sheet.addRow([entry.deductionMessage]);

        // Merge A → M (13 columns)
        sheet.mergeCells(deductionRow.number, 1, deductionRow.number, 13);

        const cell = deductionRow.getCell(1);
        cell.font = { italic: true, bold: true };
        cell.alignment = {
          horizontal: "left",
          vertical: "middle",
          wrapText: true,
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }

      /* ---------------- Normal Data Row ---------------- */
      const dataRow = sheet.addRow([
        idx + 1,
        entry.section,
        entry.prevSection,
        entry.difference,
        entry.width,
        entry.cuttingAreaSqMtr,
        entry.cuttingPrevArea,
        entry.cuttingAvgSqrMtr,
        entry.cuttingVolumeCubicMtr,
        entry.fillingAreaSqMtr,
        entry.fillingPrevArea,
        entry.fillingAvgSqrMtr,
        entry.fillingVolumeCubicMtr,
      ]);

      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };
      });
    });

    // Totals Row
    const totalRow = sheet.addRow([
      "",
      "",
      "",
      "",
      "",
      "Total",
      "",
      "",
      Number(tableData?.totalCuttingVolume)?.toFixed(3),
      "",
      "",
      "",
      Number(tableData?.totalFillingVolume)?.toFixed(3),
    ]);
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    currentRow++;

    // Empty row between sections
    sheet.addRow([]);
    currentRow++;

    // ===== Column Widths =====
    const colWidths = [8, 16, 18, 18, 14, 14, 14, 14, 14, 14, 14, 14, 14];
    colWidths.forEach((w, i) => (sheet.getColumn(i + 1).width = w));

    // ===== Save File =====
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Volume_Report.xlsx");
  };

  useEffect(() => {
    fetchSurvey();
  }, []);

  return (
    <Box p={2}>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        spacing={2}
        mb={2}
      >
        <Box
          sx={{
            border: "1px solid #EFEFEF",
            borderRadius: "9px",
            width: "40px",
            height: "40px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            mb: "24px",
          }}
          onClick={() => navigate(-1)}
        >
          <MdArrowBackIosNew />
        </Box>

        <Box textAlign={"end"}>
          <BasicMenu
            label={<BsThreeDots />}
            items={menuItems}
            onSelect={handleMenuSelect}
            sx={{ minWidth: "fit-content", p: 1 }}
          />
        </Box>
      </Stack>

      <Typography
        variant="h6"
        fontSize={18}
        fontWeight={700}
        align="center"
        mb={2}
      >
        Volume Report {reportDetails.current.initialEntry} and{" "}
        {reportDetails.current.secondaryEntry}
      </Typography>

      <TableContainer component={Paper} sx={{ maxHeight: "90vh" }}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead
            sx={{
              backgroundColor: "#f4f6f8",
              "& .MuiTableCell-root": {
                border: "1px solid rgba(224, 224, 224, 1)",
                fontWeight: 700,
              },
              position: "sticky",
              top: 0,
            }}
          >
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Sl.No.
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Section From
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Previous Section
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Difference
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Width
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} colSpan={4} align="center">
                Cutting Volume
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} colSpan={4} align="center">
                Filling Volume
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Area Sq. Mtrs</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Previous Area</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Average Sq. Mtrs</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                Volume Cubic Meters
              </TableCell>

              <TableCell sx={{ fontWeight: 700 }}>Area Sq. Mtrs</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Previous Area</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Average Sq. Mtrs</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                Volume Cubic Meters
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {tableData?.rows?.map((row, index) => (
              <React.Fragment key={index}>
                {row.isDeductionRow && (
                  <TableRow>
                    <TableCell colSpan={13}>{row.deductionMessage}</TableCell>
                  </TableRow>
                )}

                <TableRow>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.section}</TableCell>
                  <TableCell>{row.prevSection}</TableCell>
                  <TableCell>{row.difference}</TableCell>
                  <TableCell>{row.width}</TableCell>
                  <TableCell>{row.cuttingAreaSqMtr}</TableCell>
                  <TableCell>{row.cuttingPrevArea}</TableCell>
                  <TableCell>{row.cuttingAvgSqrMtr}</TableCell>
                  <TableCell>{row.cuttingVolumeCubicMtr}</TableCell>
                  <TableCell>{row.fillingAreaSqMtr}</TableCell>
                  <TableCell>{row.fillingPrevArea}</TableCell>
                  <TableCell>{row.fillingAvgSqrMtr}</TableCell>
                  <TableCell>{row.fillingVolumeCubicMtr}</TableCell>
                </TableRow>
              </React.Fragment>
            ))}

            <TableRow>
              <TableCell colSpan={5}></TableCell>

              <TableCell colSpan={3} sx={{ fontWeight: "bold" }}>
                Total
              </TableCell>

              <TableCell sx={{ fontWeight: "bold" }}>
                {Number(tableData?.totalCuttingVolume)?.toFixed(3)}
              </TableCell>
              <TableCell colSpan={3}></TableCell>

              <TableCell sx={{ fontWeight: "bold" }}>
                {Number(tableData?.totalFillingVolume)?.toFixed(3)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default VolumeReport;
