import { compareProfiles, chainageValue } from "../../utils/surveyGeometry";
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
import SmallHeader from "../../components/SmallHeader";
import BasicButtons from "../../components/BasicButton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import BasicMenu from "../../components/BasicMenu";
import { BsThreeDots } from "react-icons/bs";
import { TbArrowsExchange } from "react-icons/tb";

const LEVEL_ORDER = [
  "Initial Level",
  "Proposed Level",
  "Final Earth Work",
  "Proposed Earth Work",
  "Final Quarry Muck",
  "Proposed Quarry Muck",
  "Final GSB",
  "Proposed GSB",
  "Final WMM",
  "Proposed WMM",
  "Final BM",
  "Proposed BM",
  "Final BC",
  "Proposed BC",
  "Final Tile Top",
  "Proposed Tile Top",
  "Final Level",
];

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
  {
    label: (
      <Stack direction={"row"} alignItems={"center"} gap={0.5}>
        Spread Sheet
        <MdDownload />
      </Stack>
    ),
    value: "spread sheet",
  },
  {
    label: (
      <Stack direction={"row"} alignItems={"center"} gap={0.5}>
        Calculation Mode
        <TbArrowsExchange />
      </Stack>
    ),
    value: "calculation mode",
  },
];

const initialDetails = {
  initialEntry: "",
  secondaryEntry: "",
};

const exportVolumeReportPdf = ({ tableData, reportDetails, showArea }) => {
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
            halign: "left", // Usually, long messages look better left-aligned
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

      ...(showArea?.cutting
        ? [
            row.cuttingAreaSqMtr,
            row.cuttingPrevArea,
            row.cuttingAvgSqrMtr,
            row.cuttingVolumeCubicMtr,
          ]
        : []),

      ...(showArea?.filling
        ? [
            row.fillingAreaSqMtr,
            row.fillingPrevArea,
            row.fillingAvgSqrMtr,
            row.fillingVolumeCubicMtr,
          ]
        : []),
    ]);
  });

  // ===== TOTAL ROW =====
  body.push([
    "",
    "",
    "",
    "",
    "",
    { content: "Total", styles: { fontStyle: "bold", halign: "center" } },

    ...(showArea?.cutting
      ? [
          { content: "", colSpan: 2 },
          {
            content: Number(tableData?.totalCuttingVolume)?.toFixed(3),
            styles: { fontStyle: "bold", halign: "center" },
          },
        ]
      : []),

    ...(showArea?.filling
      ? [
          { content: "", colSpan: showArea?.cutting ? 3 : 2 },
          {
            content: Number(tableData?.totalFillingVolume)?.toFixed(3),
            styles: { fontStyle: "bold", halign: "center" },
          },
        ]
      : []),
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
        ...(showArea?.cutting
          ? [{ content: "Cutting Volume", colSpan: 4 }]
          : []),
        ...(showArea?.filling
          ? [{ content: "Filling Volume", colSpan: 4 }]
          : []),
      ],
      [
        ...(showArea?.cutting
          ? ["Area Sq. Mtrs", "Prev Area", "Avg Sq. Mtrs", "Vol (m³)"]
          : []),
        ...(showArea?.filling
          ? ["Area Sq. Mtrs", "Prev Area", "Avg Sq. Mtrs", "Vol (m³)"]
          : []),
      ],
    ],
    body,
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: 0,
      lineWidth: 0.1,
      valign: "middle",
      halign: "center", // <--- THIS ALIGNS ALL BODY CELLS TO CENTER
    },
    headStyles: {
      fontSize: 7.5,
      fontStyle: "bold",
      halign: "center", // <--- THIS ALIGNS ALL HEADER CELLS TO CENTER
      valign: "middle",
      fillColor: [240, 240, 240], // Light gray header looks cleaner than 'false'
      textColor: 0,
      lineWidth: 0.1,
    },
    didDrawPage: (data) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        `Volume Report: ${reportDetails.initialEntry} to ${reportDetails.secondaryEntry}`,
        doc.internal.pageSize.width / 2,
        15,
        { align: "center" },
      );
    },
  });

  doc.save("volume-report.pdf");
};

const VolumeReport = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const reportDetails = useRef(initialDetails);

  const tokenClientRef = useRef(null);

  const tableDataRef = useRef([]);

  const { state } = useLocation();

  const dispatch = useDispatch();

  const { global } = useSelector((state) => state.loading);

  const [survey, setSurvey] = useState([]);

  const [showArea, setShowArea] = useState({ cutting: true, filling: true });

  const [calculationMode, setCalculationMode] = useState(false);

  const calculationModeRef = useRef(calculationMode);

  const handleMenuSelect = (item) => {
    if (tableDataRef.current?.missingSections?.length) {
      handleFormError(new Error("Quantity is incomplete. Resolve the missing or invalid cross-section profiles before exporting."), null, dispatch, navigate);
      return;
    }
    if (item.value === "excel download") {
      exportToExcel();
    }

    if (item.value === "spread sheet") {
      if (!tokenClientRef.current) {
        console.error("Token client not ready");
        return;
      }

      tokenClientRef.current.requestAccessToken();
    }

    if (item.value === "pdf download") {
      exportVolumeReportPdf({
        tableData,
        reportDetails: reportDetails.current,
        showArea,
      });
    }
    if (item.value === "calculation mode") {
      setCalculationMode(!calculationMode);
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
    const sortedEntries = [];
    let initialEntry = null;
    let secondaryEntry = null;
    let isBreak = false;
    let breakMessage = "";
    const deductions = (state && state?.rows) || [];
    const isDeduction = deductions.length;

    if (state && state?.selectedPurposeIds?.length) {
      const initial = survey?.purposes?.find(
        (p) => String(p._id) === String(state.selectedPurposeIds[0]),
      );
      const secondary = survey?.purposes?.find(
        (p) => String(p._id) === String(state.selectedPurposeIds[1]),
      );

      sortedEntries.push(initial, secondary);
    } else {
      const initial = survey?.purposes?.find((p) => p.type === "Initial Level");
      const secondary = survey?.purposes?.find(
        (p) => p.type === "Proposed Level",
      );

      sortedEntries.push(initial, secondary);
    }

    sortedEntries.sort(
      (a, b) => LEVEL_ORDER.indexOf(a.type) - LEVEL_ORDER.indexOf(b.type),
    );

    initialEntry = sortedEntries[0];
    secondaryEntry = sortedEntries[1];

    if (!survey || !initialEntry || !secondaryEntry) return [];

    reportDetails.current = {
      initialEntry: shortType(initialEntry.type),
      secondaryEntry: shortType(secondaryEntry.type),
      secondaryEntryQuantity: secondaryEntry.quantity,
    };

    const initialRows = initialEntry?.rows ?? [];
    const secondaryRows = secondaryEntry?.rows ?? [];
    const isBottomWidthFixed =
      secondaryEntry?.proposalMethod === "Bottom Width Fixed";
    const fixedBottomWidth = Number(
      secondaryEntry?.bottomWidth ?? secondaryEntry?.width,
    );
    const missingSections = [];
    const useChannelGeometry = survey.type === "Water Way" && !isBottomWidthFixed;
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

    // Process only Chainage section rows. Water Level is a point reading, not a CS row.
    const filteredInitialRows = initialRows.filter(
      (row) => row.type === "Chainage" || row.type === "Break",
    );

    filteredInitialRows.forEach((row) => {
      if (row.type === "Break") {
        isBreak = true;
        breakMessage = row.remarks[0];
        prevSection = null;
        return;
      }

      const secondaryRow = secondaryRows?.find(
        (p) => p.chainage === row.chainage,
      );

      const chainage = useChannelGeometry ? chainageValue(row.chainage, survey?.separator || "/") : row.chainage?.split(survey?.separator || "/")?.[1] ?? "";

      let prevReadings = [];

      const data = useChannelGeometry ? compareProfiles(row, secondaryRow) : (secondaryRow?.offsets ?? []).map((entry, idx) => {
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
          !isCutting || idx === 0
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
            3,
          ),
          fillingMtr,
          fillingAvgMtr,
          fillingWMtr: widthMtr,
          fillingAreaSqMtr: (Number(fillingAvgMtr) * Number(widthMtr)).toFixed(
            3,
          ),
        };

        prevReadings.push(dataDoc);
        return dataDoc;
      });

      if (useChannelGeometry && !data.length) {
        missingSections.push(row.chainage);
        prevSection = null;
        cuttingPrevArea = "0.000";
        fillingPrevArea = "0.000";
        return;
      }

      // --- Total area for this section ---
      let cuttingAreaSqMtr = data.reduce(
        (acc, curr) => acc + Number(curr.cuttingAreaSqMtr || 0),
        0,
      );
      let fillingAreaSqMtr = data.reduce(
        (acc, curr) => acc + Number(curr.fillingAreaSqMtr || 0),
        0,
      );

      if (isBottomWidthFixed && Number.isFinite(fixedBottomWidth)) {
        const centerOffset = Number(
          secondaryEntry?.pls ?? initialEntry?.pls ?? 0,
        );
        const initialOffsets = row?.offsets ?? [];
        const centerIndex = initialOffsets.reduce(
          (closestIndex, offset, index) =>
            Math.abs(Number(offset) - centerOffset) <
            Math.abs(Number(initialOffsets[closestIndex] ?? 0) - centerOffset)
              ? index
              : closestIndex,
          0,
        );
        const centerInitialRL = Number(row?.reducedLevels?.[centerIndex]);
        const proposalLevels = (secondaryRow?.reducedLevels ?? [])
          .map(Number)
          .filter(Number.isFinite);
        const bedRL = proposalLevels.length
          ? Math.min(...proposalLevels)
          : Number.NaN;

        if (Number.isFinite(centerInitialRL) && Number.isFinite(bedRL)) {
          const levelDifference = centerInitialRL - bedRL;
          cuttingAreaSqMtr =
            Math.max(levelDifference, 0) * fixedBottomWidth;
          fillingAreaSqMtr =
            Math.max(-levelDifference, 0) * fixedBottomWidth;
        }
      }

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

          difference = prevSection !== null
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

            difference = prevSection !== null
              ? (currentChainage - prevChainage).toFixed(3)
              : "0.000";
          }
        } else {
          difference = prevSection !== null
            ? (currentChainage - prevChainage).toFixed(3)
            : "0.000";
        }
      } else {
        difference = isBreak
          ? "0.000"
          : prevSection !== null
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
        Number(difference) * (useChannelGeometry ? (cuttingAreaSqMtr + Number(cuttingPrevArea)) / 2 : Number(cuttingAvgSqrMtr))
      ).toFixed(3);

      const fillingVolumeCubicMtr = (
        Number(difference) * (useChannelGeometry ? (fillingAreaSqMtr + Number(fillingPrevArea)) / 2 : Number(fillingAvgSqrMtr))
      ).toFixed(3);

      const initialRoadWidth =
        Math.abs(Number(row?.offsets[0])) +
        Number(row?.offsets[row?.offsets?.length - 1]);
      const reportWidth =
        isBottomWidthFixed && Number.isFinite(fixedBottomWidth)
          ? fixedBottomWidth
          : useChannelGeometry ? Number(data.at(-1).offset) - Number(data[0].offset) : initialRoadWidth;

      // --- Push row ---
      rows.push({
        section: currentChainage.toFixed(3),
        prevSection: prevSection !== null ? prevChainage.toFixed(3) : "-",
        difference,
        width: Number(reportWidth).toFixed(3),
        cuttingAreaSqMtr: cuttingAreaSqMtr.toFixed(3),
        data,
        cuttingPrevArea: Number(cuttingPrevArea).toFixed(3),
        cuttingAvgSqrMtr,
        cuttingVolumeCubicMtr,
        fillingAreaSqMtr: fillingAreaSqMtr.toFixed(3),
        fillingPrevArea: Number(fillingPrevArea).toFixed(3),
        fillingAvgSqrMtr,
        fillingVolumeCubicMtr,
        deductionMessage,
        isDeductionRow: flag,
        isBreak,
        message: breakMessage,
      });

      // if (!showArea.cutting && Number(totals.totalCuttingVolume) > 0) {
      //   setShowArea((prev) => ({ ...prev, cutting: true }));
      // }

      // if (!showArea.filling && Number(totals.totalFillingVolume) > 0) {
      //   setShowArea((prev) => ({ ...prev, filling: true }));
      // }

      // --- Prepare for next iteration ---
      cuttingPrevArea = useChannelGeometry ? cuttingAreaSqMtr : Number(cuttingAreaSqMtr)?.toFixed(3);
      fillingPrevArea = useChannelGeometry ? fillingAreaSqMtr : Number(fillingAreaSqMtr)?.toFixed(3);
      totals.totalCuttingVolume += Number(cuttingVolumeCubicMtr);
      totals.totalFillingVolume += Number(fillingVolumeCubicMtr);
      prevSection = chainage;
      isBreak = false;
      breakMessage = "";
    });

    return { ...totals, rows, missingSections };
  }, [survey, state]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Volume Report");

    // ===== Title =====
    sheet.mergeCells(
      showArea?.cutting && showArea?.filling ? "A1:M1" : "A1:I1",
    );
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
      ...(showArea?.cutting ? ["Cutting Volume", "", "", ""] : []),
      ...(showArea?.filling ? ["Filling Volume", "", "", ""] : []),
    ]);

    sheet.addRow([
      "",
      "",
      "",
      "",
      "",
      ...(showArea?.cutting
        ? [
            "Area Sq. Mtrs",
            "Previous Area",
            "Average Sq. Mtrs",
            "Volume Cubic Meters",
          ]
        : []),
      ...(showArea?.filling
        ? [
            "Area Sq. Mtrs",
            "Previous Area",
            "Average Sq. Mtrs",
            "Volume Cubic Meters",
          ]
        : []),
    ]);

    // ===== Merge Header Cells =====
    sheet.mergeCells("F2:I2"); // Cutting Area

    if (showArea?.cutting && showArea?.filling) {
      sheet.mergeCells("J2:M2"); // Filling Area
    }

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

        ...(showArea?.cutting
          ? [
              entry.cuttingAreaSqMtr,
              entry.cuttingPrevArea,
              entry.cuttingAvgSqrMtr,
              entry.cuttingVolumeCubicMtr,
            ]
          : []),
        ...(showArea?.filling
          ? [
              entry.fillingAreaSqMtr,
              entry.fillingPrevArea,
              entry.fillingAvgSqrMtr,
              entry.fillingVolumeCubicMtr,
            ]
          : []),
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

      ...(showArea?.cutting
        ? [
            "",
            "", // colSpan={2}
            Number(tableData?.totalCuttingVolume)?.toFixed(3),
          ]
        : []),

      ...(showArea?.filling
        ? [
            ...(showArea?.cutting ? ["", "", ""] : ["", ""]), // dynamic colSpan
            Number(tableData?.totalFillingVolume)?.toFixed(3),
          ]
        : []),
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

  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const createSheet = async (accessToken, isCalc) => {
    const tableData = tableDataRef.current;
    if (!tableData || !tableData.rows?.length) return;

    // Detect visibility based on data totals
    const showCutting = Number(tableData.totalCuttingVolume) > 0;
    const showFilling = Number(tableData.totalFillingVolume) > 0;

    // 1️⃣ Create Spreadsheet
    const createRes = await fetch(
      "https://sheets.googleapis.com/v4/spreadsheets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: { title: "Volume Report" },
        }),
      },
    );

    const sheet = await createRes.json();
    const spreadsheetId = sheet.spreadsheetId;
    const sheetId = sheet.sheets[0].properties.sheetId;

    // ===============================
    // 2️⃣ BUILD DATA
    // ===============================

    const values = [];

    // Title
    values.push(["Volume Report"]);

    // Header Row 1
    values.push([
      "Sl.No.",
      "Section From",
      "Previous Section",
      "Difference",
      "Width",
      ...(showCutting ? ["Cutting Volume", "", "", ""] : []),
      ...(showFilling ? ["Filling Volume", "", "", ""] : []),
    ]);

    // Header Row 2
    values.push([
      "",
      "",
      "",
      "",
      "",
      ...(showCutting
        ? [
            "Area Sq. Mtrs",
            "Previous Area",
            "Average Sq. Mtrs",
            "Volume Cubic Meters",
          ]
        : []),
      ...(showFilling
        ? [
            "Area Sq. Mtrs",
            "Previous Area",
            "Average Sq. Mtrs",
            "Volume Cubic Meters",
          ]
        : []),
    ]);

    // Data Rows
    tableData.rows.forEach((row, idx) => {
      // Handle Deduction Rows
      if (row.isDeductionRow) {
        values.push([row.deductionMessage]);
        return;
      }

      // Calculation Formatter Helpers
      const formatArea = (val, type) => {
        if (!isCalc || !row.data) return val;
        const parts = row.data.map((x) => x[`${type}AreaSqMtr`]).join(" + ");
        return `(${parts}) = ${val}`;
      };

      const formatAvg = (val, area, prev) => {
        if (!isCalc) return val;
        return `(${area} + ${prev}) / 2 = ${val}`;
      };

      const formatVol = (val, avg, diff) => {
        if (!isCalc) return val;
        return `(${avg} * ${diff}) = ${val}`;
      };

      values.push([
        idx + 1,
        row.section,
        row.prevSection,
        row.difference,
        row.width,
        ...(showCutting
          ? [
              formatArea(row.cuttingAreaSqMtr, "cutting"),
              row.cuttingPrevArea,
              formatAvg(
                row.cuttingAvgSqrMtr,
                row.cuttingAreaSqMtr,
                row.cuttingPrevArea,
              ),
              formatVol(
                row.cuttingVolumeCubicMtr,
                row.cuttingAvgSqrMtr,
                row.difference,
              ),
            ]
          : []),
        ...(showFilling
          ? [
              formatArea(row.fillingAreaSqMtr, "filling"),
              row.fillingPrevArea,
              formatAvg(
                row.fillingAvgSqrMtr,
                row.fillingAreaSqMtr,
                row.fillingPrevArea,
              ),
              formatVol(
                row.fillingVolumeCubicMtr,
                row.fillingAvgSqrMtr,
                row.difference,
              ),
            ]
          : []),
      ]);
    });

    // Totals Row
    values.push([
      "",
      "",
      "",
      "",
      "TOTAL",
      ...(showCutting
        ? ["", "", "", Number(tableData.totalCuttingVolume).toFixed(3)]
        : []),
      ...(showFilling
        ? ["", "", "", Number(tableData.totalFillingVolume).toFixed(3)]
        : []),
    ]);

    const totalColumns = 5 + (showCutting ? 4 : 0) + (showFilling ? 4 : 0);
    const totalRows = values.length;

    // 3️⃣ Send Values to Sheet
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values }),
      },
    );

    // ===============================
    // 4️⃣ FORMATTING
    // ===============================

    const requests = [];

    // Merge Title
    requests.push({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: totalColumns,
        },
        mergeType: "MERGE_ALL",
      },
    });

    // Merge "Cutting Volume" Header
    if (showCutting) {
      requests.push({
        mergeCells: {
          range: {
            sheetId,
            startRowIndex: 1,
            endRowIndex: 2,
            startColumnIndex: 5,
            endColumnIndex: 9,
          },
          mergeType: "MERGE_ALL",
        },
      });
    }

    // Merge "Filling Volume" Header
    if (showFilling) {
      const start = showCutting ? 9 : 5;
      requests.push({
        mergeCells: {
          range: {
            sheetId,
            startRowIndex: 1,
            endRowIndex: 2,
            startColumnIndex: start,
            endColumnIndex: start + 4,
          },
          mergeType: "MERGE_ALL",
        },
      });
    }

    // Apply Styles (Title & Headers)
    requests.push(
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              horizontalAlignment: "CENTER",
              textFormat: { bold: true, fontSize: 14 },
            },
          },
          fields: "userEnteredFormat(horizontalAlignment,textFormat)",
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 1, endRowIndex: 3 },
          cell: {
            userEnteredFormat: {
              horizontalAlignment: "CENTER",
              verticalAlignment: "MIDDLE",
              textFormat: { bold: true },
              backgroundColor: { red: 0.95, green: 0.96, blue: 0.97 },
            },
          },
          fields:
            "userEnteredFormat(horizontalAlignment,verticalAlignment,textFormat,backgroundColor)",
        },
      },
    );

    // Borders
    requests.push({
      updateBorders: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: totalRows,
          startColumnIndex: 0,
          endColumnIndex: totalColumns,
        },
        top: { style: "SOLID" },
        bottom: { style: "SOLID" },
        left: { style: "SOLID" },
        right: { style: "SOLID" },
        innerHorizontal: { style: "SOLID" },
        innerVertical: { style: "SOLID" },
      },
    });

    // Dynamic Column Width
    // If Calculation Mode is ON, we need much wider columns (approx 250px)
    requests.push(
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 5 },
          properties: { pixelSize: 80 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: {
            sheetId,
            dimension: "COLUMNS",
            startIndex: 5,
            endIndex: totalColumns,
          },
          properties: { pixelSize: isCalc ? 250 : 130 },
          fields: "pixelSize",
        },
      },
    );

    // Execute Batch Update
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
      },
    );

    window.open(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      "_blank",
    );
  };

  useEffect(() => {
    const initClient = async () => {
      await new Promise((resolve) => {
        window.gapi.load("client", resolve);
      });

      await window.gapi.client.init({
        discoveryDocs: [
          "https://sheets.googleapis.com/$discovery/rest?version=v4",
        ],
      });

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        callback: async (tokenResponse) => {
          if (!tokenResponse.access_token) return;

          await createSheet(
            tokenResponse.access_token,
            calculationModeRef.current,
          );
        },
      });
    };

    initClient();
  }, []);

  useEffect(() => {
    calculationModeRef.current = calculationMode;
  }, [calculationMode]);

  useEffect(() => {
    tableDataRef.current = tableData;
  }, [tableData]);

  useEffect(() => {
    fetchSurvey();
  }, []);

  return (
    <>
    <SmallHeader />
    <Box p={2}>
      {tableData?.missingSections?.length > 0 && <Typography color="error" sx={{ mb: 2 }}>
        Quantity is incomplete: matching valid ground and proposal profiles are missing at chainage(s) {tableData.missingSections.join(", ")}.
        The figures below cover valid sections only. Export is disabled until these sections are resolved.
      </Typography>}
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
        Volume Report Between {reportDetails.current.initialEntry} and{" "}
        {reportDetails.current.secondaryEntry}
      </Typography>
      {console.log(survey)}
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
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2} align="center">
                Sl.No.
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2} align="center">
                Section From
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2} align="center">
                Previous Section
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2} align="center">
                Difference
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2} align="center">
                Width
              </TableCell>

              {showArea?.cutting && (
                <TableCell sx={{ fontWeight: 700 }} colSpan={4} align="center">
                  Cutting Volume
                </TableCell>
              )}

              {showArea?.filling && (
                <TableCell sx={{ fontWeight: 700 }} colSpan={4} align="center">
                  Filling Volume
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              {showArea?.cutting && (
                <>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Area Sq. Mtrs
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Previous Area
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Average Sq. Mtrs
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Volume Cubic Meters
                  </TableCell>
                </>
              )}

              {showArea?.filling && (
                <>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Area Sq. Mtrs
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Previous Area
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Average Sq. Mtrs
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Volume Cubic Meters
                  </TableCell>
                </>
              )}
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

                {row.isBreak && (
                  <TableRow>
                    <TableCell colSpan={13}>{row.message}</TableCell>
                  </TableRow>
                )}

                <TableRow>
                  <TableCell align="center">{index + 1}</TableCell>
                  <TableCell align="center">{row.section}</TableCell>
                  <TableCell align="center">{row.prevSection}</TableCell>
                  <TableCell align="center">{row.difference}</TableCell>
                  <TableCell align="center">{row.width}</TableCell>
                  {showArea?.cutting && (
                    <>
                      <TableCell align="center">
                        {calculationMode && (
                          <>
                            (
                            {row.data?.map((x, idx) => {
                              return (
                                <Box key={idx}>
                                  {x.cuttingAreaSqMtr}{" "}
                                  {idx === row?.data?.length - 1 ? "" : "+"}
                                </Box>
                              );
                            })}
                            ) =
                          </>
                        )}{" "}
                        {row.cuttingAreaSqMtr}
                      </TableCell>
                      <TableCell align="center">
                        {row.cuttingPrevArea}
                      </TableCell>
                      <TableCell align="center">
                        {calculationMode && (
                          <>
                            ({row.cuttingAreaSqMtr} + {row.cuttingPrevArea}) / 2
                            =
                          </>
                        )}
                        {row.cuttingAvgSqrMtr}
                      </TableCell>
                      <TableCell align="center">
                        {calculationMode && (
                          <>
                            ({row.cuttingAvgSqrMtr} * {row.difference}) =
                          </>
                        )}
                        {row.cuttingVolumeCubicMtr}
                      </TableCell>
                    </>
                  )}
                  {showArea?.filling && (
                    <>
                      <TableCell align="center">
                        {calculationMode && (
                          <>
                            (
                            {row.data?.map((x, idx) => {
                              return (
                                <Box key={idx}>
                                  {x.fillingAreaSqMtr}{" "}
                                  {idx === row?.data?.length - 1 ? "" : "+"}
                                </Box>
                              );
                            })}
                            ) =
                          </>
                        )}{" "}
                        {row.fillingAreaSqMtr}
                      </TableCell>
                      <TableCell align="center">
                        {row.fillingPrevArea}
                      </TableCell>
                      <TableCell align="center">
                        {calculationMode && (
                          <>
                            ({row.fillingAreaSqMtr} + {row.fillingPrevArea}) / 2
                            =
                          </>
                        )}
                        {row.fillingAvgSqrMtr}
                      </TableCell>
                      <TableCell align="center">
                        {calculationMode && (
                          <>
                            ({row.fillingAvgSqrMtr} * {row.difference}) =
                          </>
                        )}
                        {row.fillingVolumeCubicMtr}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              </React.Fragment>
            ))}

            <TableRow>
              <TableCell colSpan={5}></TableCell>

              <TableCell sx={{ fontWeight: "bold" }} align="center">
                Total
              </TableCell>

              {showArea?.cutting && (
                <>
                  <TableCell colSpan={2}></TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">
                    {Number(tableData?.totalCuttingVolume)?.toFixed(3)}
                  </TableCell>
                </>
              )}

              {showArea?.filling && (
                <>
                  <TableCell colSpan={showArea?.cutting ? 3 : 2}></TableCell>

                  <TableCell sx={{ fontWeight: "bold" }} align="center">
                    {Number(tableData?.totalFillingVolume)?.toFixed(3)}
                  </TableCell>
                </>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* 🚧 DEV ONLY — Remove before production */}
      <Typography
        sx={{
          mt: 2,
          px: 1.5,
          py: 0.75,
          display: "inline-block",
          fontSize: 12,
          fontFamily: "monospace",
          bgcolor: "#fff8e1",
          border: "1px dashed #f9a825",
          borderRadius: 1,
          color: "#e65100",
        }}
      >
        🚧 DEV ONLY &nbsp;|&nbsp; Quantity:{" "}
        <strong>
          {JSON.stringify(reportDetails.current.secondaryEntryQuantity)}
        </strong>
      </Typography>
    </Box>
    </>
  );
};

export default VolumeReport;
