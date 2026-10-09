import { compareProfiles } from "../../utils/surveyGeometry.js";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import { getSurvey } from "../../services/surveyServices";
import { handleFormError } from "../../utils/handleFormError";
import {
  Box,
  Container,
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
import { MdDownload, MdKeyboardArrowDown, MdOutlineAssessment } from "react-icons/md";
import SmallHeader from "../../components/SmallHeader";
import PageHeroHeader from "../../components/PageHeroHeader";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import BasicMenu from "../../components/BasicMenu";
import { BsThreeDots } from "react-icons/bs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

const exportAreaReportPdf = ({ tableData, reportDetails, showArea }) => {
  const doc = new jsPDF("p", "mm", "a4");

  // ===== BUILD BODY =====
  const body = [];

  tableData.forEach((section) => {
    body.push([
      {
        content: `Section: ${section.section}`,
        colSpan: 12,
        styles: {
          fontStyle: "bold",
          halign: "left",
          fillColor: [240, 240, 240],
        },
      },
    ]);

    // Data rows
    section.data.forEach((row, idx) => {
      body.push([
        idx + 1,
        row.offset,
        row.initialEntryRL,
        row.secondaryEntryRL,

        ...(showArea?.cutting
          ? [
            row.cuttingMtr,
            row.cuttingAvgMtr,
            row.cuttingWMtr,
            row.cuttingAreaSqMtr,
          ]
          : []),

        ...(showArea?.filling
          ? [
            row.fillingMtr,
            row.fillingAvgMtr,
            row.fillingWMtr,
            row.fillingAreaSqMtr,
          ]
          : []),
      ]);
    });

    // Total row (Center aligned)
    body.push([
      { content: "", colSpan: 4 },
      { content: "Total", styles: { fontStyle: "bold", halign: "center" } },

      ...(showArea?.cutting
        ? [
          { content: "", colSpan: 2 },
          {
            content: Number(section?.totalCuttingAreaSqMtr)?.toFixed(3),
            styles: { fontStyle: "bold", halign: "center" },
          },
        ]
        : []),

      ...(showArea?.filling
        ? [
          { content: "", colSpan: showArea?.cutting ? 3 : 2 },
          {
            content: Number(section?.totalFillingAreaSqMtr)?.toFixed(3),
            styles: { fontStyle: "bold", halign: "center" },
          },
        ]
        : []),
    ]);

    // Optional: Add a small empty spacer row between sections
    body.push([{ content: "", colSpan: 12, styles: { cellPadding: 0.5 } }]);
  });

  autoTable(doc, {
    margin: { top: 20 },
    theme: "grid",
    head: [
      [
        { content: "Sl.No.", rowSpan: 2 },
        { content: "Distance Meters", rowSpan: 2 },
        { content: `${reportDetails.initialEntry} Meters`, rowSpan: 2 },
        { content: `${reportDetails.secondaryEntry} Meters`, rowSpan: 2 },

        ...(showArea?.cutting ? [{ content: "Cutting Area", colSpan: 4 }] : []),
        ...(showArea?.filling ? [{ content: "Filling Area", colSpan: 4 }] : []),
      ],
      [
        ...(showArea?.cutting
          ? ["Cutting Meters", "Avg Meters", "Width Meters", "Area Sq. Mtrs"]
          : []),

        ...(showArea?.filling
          ? ["Filling Meters", "Avg Meters", "Width Meters", "Area Sq. Mtrs"]
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
      halign: "center", // <--- Centers all body cells
    },
    headStyles: {
      fontSize: 7.5,
      fontStyle: "bold",
      halign: "center", // <--- Centers all header cells
      valign: "middle",
      fillColor: [240, 240, 240],
      textColor: 0,
      lineWidth: 0.1,
    },
    didDrawPage: () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        `Area Report: ${reportDetails.initialEntry} to ${reportDetails.secondaryEntry}`,
        doc.internal.pageSize.width / 2,
        15,
        { align: "center" },
      );
    },
  });

  doc.save("area-report.pdf");
};

const AreaReport = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const reportDetails = useRef(initialDetails);

  const tokenClientRef = useRef(null);

  const tableDataRef = useRef([]);

  const { state } = useLocation();

  const dispatch = useDispatch();

  const { global } = useSelector((state) => state.loading);

  const [survey, setSurvey] = useState([]);

  const [calculationMode, setCalculationMode] = useState(false);

  const [showArea, setShowArea] = useState({ cutting: false, filling: false });
  const [collapsedSections, setCollapsedSections] = useState(() => new Set());

  const toggleSection = (index) => {
    setCollapsedSections((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleMenuSelect = (item) => {
    if (item.value === "excel download") {
      exportToExcel();
    }

    if (item.value === "calculation mode") {
      setCalculationMode(!calculationMode);
    }

    if (item.value === "spread sheet") {
      if (!tokenClientRef.current) {
        console.error("Token client not ready");
        return;
      }

      tokenClientRef.current.requestAccessToken();
    }

    if (item.value === "pdf download") {
      exportAreaReportPdf({
        tableData,
        reportDetails: reportDetails.current,
        showArea,
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
    const sortedEntries = [];
    let initialEntry = null;
    let secondaryEntry = null;

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
    };

    const initialRows = initialEntry?.rows ?? [];
    const proposedRows = secondaryEntry?.rows ?? [];
    const rows = [];

    // Process only Chainage section rows. Water Level is a point reading, not a CS row.
    initialRows
      .filter((row) => row.type === "Chainage" || row.type === "Break")
      .forEach((row) => {
        const proposedRow = proposedRows?.find(
          (p) => p.chainage === row.chainage,
        );

        const value = row.type === "Break" ? row?.from : row.chainage;

        const chainage = value?.split(survey?.separator || "/")?.[1] ?? "";

        let prevReadings = [];

        const data = survey.type === "Water Way" && secondaryEntry?.proposalMethod !== "Bottom Width Fixed"
          ? compareProfiles(row, proposedRow) : (proposedRow?.offsets ?? []).map((entry, idx) => {
          const initialEntryRL = row?.reducedLevels?.[idx] ?? 0;
          const secondaryEntryRL = proposedRow?.reducedLevels?.[idx] ?? 0;

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

          const cuttingAreaSqMtr = Number(cuttingAvgMtr) * Number(widthMtr);

          const fillingAreaSqMtr = Number(fillingAvgMtr) * Number(widthMtr);

          if (!showArea.cutting && cuttingAreaSqMtr > 0) {
            setShowArea((prev) => ({ ...prev, cutting: true }));
          }

          if (!showArea.filling && fillingAreaSqMtr > 0) {
            setShowArea((prev) => ({ ...prev, filling: true }));
          }

          const dataDoc = {
            initRL,
            propRL,
            offset: entry,
            initialEntryRL,
            secondaryEntryRL,
            cuttingMtr,
            cuttingAvgMtr,
            cuttingWMtr: widthMtr,
            cuttingAreaSqMtr: cuttingAreaSqMtr.toFixed(3),
            fillingMtr,
            fillingAvgMtr,
            fillingWMtr: widthMtr,
            fillingAreaSqMtr: fillingAreaSqMtr.toFixed(3),
          };

          prevReadings.push(dataDoc);
          return dataDoc;
        });

        if (data.some((point) => Number(point.cuttingAreaSqMtr) > 0) && !showArea.cutting) setShowArea((prev) => ({ ...prev, cutting: true }));
        if (data.some((point) => Number(point.fillingAreaSqMtr) > 0) && !showArea.filling) setShowArea((prev) => ({ ...prev, filling: true }));

        const totalCuttingAreaSqMtr = data.reduce(
          (acc, curr) => acc + Number(curr.cuttingAreaSqMtr || 0),
          0,
        );
        const totalFillingAreaSqMtr = data.reduce(
          (acc, curr) => acc + Number(curr.fillingAreaSqMtr || 0),
          0,
        );

        rows.push({
          section: Number(chainage),
          type: row.type,
          data,
          totalCuttingAreaSqMtr,
          totalFillingAreaSqMtr,
        });
      });

    return rows;
  }, [survey]);

  const reportTotals = useMemo(() => tableData.reduce(
    (totals, section) => {
      if (section.type === "Break") return totals;
      totals.sections += 1;
      totals.cutting += Number(section.totalCuttingAreaSqMtr || 0);
      totals.filling += Number(section.totalFillingAreaSqMtr || 0);
      return totals;
    },
    { sections: 0, cutting: 0, filling: 0 },
  ), [tableData]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Area Report");

    // ===== Title =====
    sheet.mergeCells(
      showArea?.cutting && showArea?.filling ? "A1:L1" : "A1:H1",
    );
    const titleCell = sheet.getCell("A1");
    titleCell.value = "Area Report";
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };

    // ===== Header Rows =====
    sheet.addRow([
      "Sl.No.",
      "Distance Meters",
      "Initial Level Meters",
      "Prop. Level Meters",
      ...(showArea?.cutting ? ["Cutting Area", "", "", ""] : []),
      ...(showArea?.filling ? ["Filling Area", "", "", ""] : []),
    ]);

    sheet.addRow([
      "",
      "",
      "",
      "",

      ...(showArea?.cutting
        ? ["Cutting Meters", "Avg Meters", "Width Meters", "Area Sq. Mtrs"]
        : []),
      ...(showArea?.filling
        ? ["Filling Meters", "Avg Meters", "Width Meters", "Area Sq. Mtrs"]
        : []),
    ]);

    // ===== Merge Header Cells =====
    sheet.mergeCells("E2:H2"); // Cutting Area
    if (showArea?.cutting && showArea?.filling) {
      sheet.mergeCells("I2:L2"); // Filling Area
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

    tableData.forEach((section) => {
      // Section Header
      const sectionRow = sheet.addRow([`Section: ${section.section}`]);
      sectionRow.eachCell((cell) => {
        cell.font = { bold: true };

        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "left", vertical: "middle" };
      });
      currentRow++;

      // Empty row
      sheet.addRow([]);
      currentRow++;

      // Data rows
      section.data.forEach((entry, idx) => {
        const dataRow = sheet.addRow([
          idx + 1,
          entry.offset,
          entry.initialEntryRL,
          entry.secondaryEntryRL,

          ...(showArea?.cutting
            ? [
              entry.cuttingMtr,
              entry.cuttingAvgMtr,
              entry.cuttingWMtr,
              entry.cuttingAreaSqMtr,
            ]
            : []),
          ...(showArea?.filling
            ? [
              entry.fillingMtr,
              entry.fillingAvgMtr,
              entry.fillingWMtr,
              entry.fillingAreaSqMtr,
            ]
            : []),
        ]);

        dataRow.eachCell((cell, colNumber) => {
          // Common border + alignment for all cells
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
        });

        currentRow++;
      });

      // Totals Row
      const totalRow = sheet.addRow([
        "",
        "",
        "",
        "", // colSpan={4}

        "Total",

        ...(showArea?.cutting
          ? [
            "",
            "", // colSpan={2}
            Number(section.totalCuttingAreaSqMtr)?.toFixed(3),
          ]
          : []),

        ...(showArea?.filling
          ? [
            ...(showArea?.cutting ? ["", "", ""] : ["", ""]), // dynamic colSpan
            Number(section.totalFillingAreaSqMtr)?.toFixed(3),
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
    });

    // ===== Column Widths =====
    const colWidths = [12, 16, 18, 18, 14, 14, 14, 14, 14, 14, 14, 14];
    colWidths.forEach((w, i) => (sheet.getColumn(i + 1).width = w));

    // ===== Save File =====
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Area_Report.xlsx");
  };

  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const createSheet = async (accessToken) => {
    const tableData = tableDataRef.current;

    if (!tableData || tableData.length === 0) return;

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
          properties: { title: "Area Report" },
        }),
      },
    );

    const sheet = await createRes.json();
    const spreadsheetId = sheet.spreadsheetId;
    const sheetId = sheet.sheets[0].properties.sheetId;

    // ===============================
    // 2️⃣ BUILD ALL ROW DATA
    // ===============================

    const values = [];

    // Title Row
    values.push(["Area Report"]);

    // Header Row 1
    values.push([
      "Sl.No.",
      "Distance Meters",
      "Initial Level Meters",
      "Prop. Level Meters",
      "Cutting Area",
      "",
      "",
      "",
      "Filling Area",
      "",
      "",
      "",
    ]);

    // Header Row 2
    values.push([
      "",
      "",
      "",
      "",
      "Cutting Meters",
      "Avg Meters",
      "Width Meters",
      "Area Sq. Mtrs",
      "Filling Meters",
      "Avg Meters",
      "Width Meters",
      "Area Sq. Mtrs",
    ]);

    let currentRowIndex = 3;

    tableData.forEach((section) => {
      // Section header
      values.push([`Section: ${section.section}`]);
      currentRowIndex++;

      // Empty row
      values.push([]);
      currentRowIndex++;

      section.data.forEach((entry, idx) => {
        values.push([
          idx + 1,
          entry.offset,
          entry.initialEntryRL,
          entry.secondaryEntryRL,
          entry.cuttingMtr,
          entry.cuttingAvgMtr,
          entry.cuttingWMtr,
          entry.cuttingAreaSqMtr,
          entry.fillingMtr,
          entry.fillingAvgMtr,
          entry.fillingWMtr,
          entry.fillingAreaSqMtr,
        ]);
        currentRowIndex++;
      });

      // Totals row
      values.push([
        "",
        "",
        "",
        "",
        "Total",
        "",
        "",
        Number(section.totalCuttingAreaSqMtr)?.toFixed(3),
        "",
        "",
        "",
        Number(section.totalFillingAreaSqMtr)?.toFixed(3),
      ]);
      currentRowIndex++;

      // Empty row
      values.push([]);
      currentRowIndex++;
    });

    const totalRows = values.length;

    // ===============================
    // 3️⃣ INSERT DATA
    // ===============================

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
    // 4️⃣ FORMATTING (MERGE + STYLE)
    // ===============================

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            // Merge Title A1:L1
            {
              mergeCells: {
                range: {
                  sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 12,
                },
                mergeType: "MERGE_ALL",
              },
            },

            // Merge Cutting Area Header
            {
              mergeCells: {
                range: {
                  sheetId,
                  startRowIndex: 1,
                  endRowIndex: 2,
                  startColumnIndex: 4,
                  endColumnIndex: 8,
                },
                mergeType: "MERGE_ALL",
              },
            },

            // Merge Filling Area Header
            {
              mergeCells: {
                range: {
                  sheetId,
                  startRowIndex: 1,
                  endRowIndex: 2,
                  startColumnIndex: 8,
                  endColumnIndex: 12,
                },
                mergeType: "MERGE_ALL",
              },
            },

            // Bold + Center Title
            {
              repeatCell: {
                range: {
                  sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    horizontalAlignment: "CENTER",
                    textFormat: { bold: true, fontSize: 16 },
                  },
                },
                fields: "userEnteredFormat(horizontalAlignment,textFormat)",
              },
            },

            // Bold + Center Headers
            {
              repeatCell: {
                range: {
                  sheetId,
                  startRowIndex: 1,
                  endRowIndex: 3,
                },
                cell: {
                  userEnteredFormat: {
                    horizontalAlignment: "CENTER",
                    verticalAlignment: "MIDDLE",
                    textFormat: { bold: true },
                  },
                },
                fields:
                  "userEnteredFormat(horizontalAlignment,verticalAlignment,textFormat)",
              },
            },

            // Add Borders for Full Table
            {
              updateBorders: {
                range: {
                  sheetId,
                  startRowIndex: 1,
                  endRowIndex: totalRows,
                  startColumnIndex: 0,
                  endColumnIndex: 12,
                },
                top: { style: "SOLID" },
                bottom: { style: "SOLID" },
                left: { style: "SOLID" },
                right: { style: "SOLID" },
                innerHorizontal: { style: "SOLID" },
                innerVertical: { style: "SOLID" },
              },
            },

            // Column Widths
            {
              updateDimensionProperties: {
                range: {
                  sheetId,
                  dimension: "COLUMNS",
                  startIndex: 0,
                  endIndex: 12,
                },
                properties: { pixelSize: 120 },
                fields: "pixelSize",
              },
            },
          ],
        }),
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
          if (!tokenResponse.access_token) {
            console.error("No access token received");
            return;
          }

          await createSheet(tokenResponse.access_token);
        },
      });
    };

    initClient();
  }, []);

  useEffect(() => {
    tableDataRef.current = tableData;
  }, [tableData]);

  useEffect(() => {
    fetchSurvey();
  }, []);

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 8 }}>
      <SmallHeader />
      <PageHeroHeader
        icon={MdOutlineAssessment}
        title="Area Report"
        subtitle="Review section measurements and area calculations."
        action={
          <BasicMenu
            label={<BsThreeDots />}
            items={menuItems}
            onSelect={handleMenuSelect}
            sx={{
              width: 44,
              height: 44,
              minWidth: 44,
              p: 1,
              color: "white",
              borderColor: "rgba(255, 255, 255, 0.45)",
              bgcolor: "rgba(255, 255, 255, 0.16)",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.26)", borderColor: "white" },
            }}
          />
        }
      />
      <Container maxWidth={false} sx={{ mt: -8, position: "relative" }}>
      <Box sx={{ px: { xs: 1, sm: 2 }, py: 2, bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: "20px", background: "linear-gradient(to right, #6366f1 0 6px, #ffffff 6px)" }}>
      <Box id="area-report" sx={{ bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: "20px", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)", overflow: "hidden" }}>
        <Typography
          variant="h6"
          sx={{ px: { xs: 2, sm: 3 }, py: 2.5, fontWeight: 800, color: "#1e293b", borderBottom: "1px solid #e2e8f0" }}
        >
          Area Report Between {reportDetails.current.initialEntry} and{" "}
          {reportDetails.current.secondaryEntry}
        </Typography>

        {tableData?.length > 0 ? (
          <>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ maxHeight: "min(75vh, 760px)", borderRadius: 0, overflowX: "auto", px: 0.5 }}
          >
            <Table
              size="small"
              sx={{
                minWidth: showArea?.cutting && showArea?.filling ? 1180 : 800,
                borderCollapse: "separate",
                borderSpacing: 0,
                "& .MuiTableCell-root": {
                  px: 1.5,
                  py: 0.95,
                  borderBottom: "1px solid #e5eaf3",
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                },
                "& .area-data-row:hover": { bgcolor: "#f5f6ff" },
                "& .area-data-row .MuiTableCell-root": { color: "#34436b", fontWeight: 500 },
                "& .area-section-row .MuiTableCell-root": {
                  bgcolor: "#eff0ff",
                  color: "#211bb5",
                  fontWeight: 800,
                  borderTop: "10px solid white",
                  borderBottom: 0,
                  borderRadius: "5px",
                  py: 1.05,
                },
                "& .area-total-row .MuiTableCell-root": {
                  bgcolor: "#eff0ff",
                  color: "#211bb5",
                  fontWeight: 800,
                  borderTop: "1px solid #d6ddf4",
                  borderBottom: 0,
                  py: 1.15,
                },
                "& .area-total-row .area-total-value": { bgcolor: "#dfdfff", textAlign: "right", fontWeight: 900 },
              }}
            >
              <TableHead
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                  "& .MuiTableCell-root": {
                    borderBottom: "1px solid #dce2f0",
                    borderRight: "1px solid #e4e8f2",
                    bgcolor: "#f0f2fa",
                    color: "#34436b",
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    lineHeight: 1.35,
                    whiteSpace: "normal",
                    minWidth: 92,
                    py: 1.35,
                  },
                  "& tr:first-of-type .MuiTableCell-root[colspan]": {
                    bgcolor: "#dedfff",
                    color: "#211bb5",
                  },
                  "& tr:nth-of-type(2) .MuiTableCell-root": {
                    bgcolor: "#f0f1ff",
                    color: "#34436b",
                    borderRight: "1px solid #dce2f0",
                    borderBottom: "1px solid #dce2f0",
                    fontWeight: 700,
                    fontSize: "0.73rem",
                  },
                }}
              >
                <TableRow>
                  <TableCell
                    sx={{ fontWeight: 700 }}
                    rowSpan={2}
                    align="center"
                  >
                    No.
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700 }}
                    rowSpan={2}
                    align="center"
                  >
                    Distance (m)
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700 }}
                    rowSpan={2}
                    align="center"
                  >
                    {reportDetails?.current?.initialEntry || "Initial level"} (m)
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700 }}
                    rowSpan={2}
                    align="center"
                  >
                    {reportDetails?.current?.secondaryEntry || "Proposed level"} (m)
                  </TableCell>
                  {showArea?.cutting && (
                    <TableCell
                      sx={{ fontWeight: 700 }}
                      colSpan={4}
                      align="center"
                    >
                      Cutting area
                    </TableCell>
                  )}
                  {showArea?.filling && (
                    <TableCell
                      sx={{ fontWeight: 700 }}
                      colSpan={4}
                      align="center"
                    >
                      Filling area
                    </TableCell>
                  )}
                </TableRow>
                <TableRow>
                  {showArea?.cutting && (
                    <>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Cut depth (m)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Average (m)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Width (m)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Area (m²)
                      </TableCell>
                    </>
                  )}

                  {showArea?.filling && (
                    <>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Fill depth (m)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Average (m)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Width (m)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Area (m²)
                      </TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {tableData.map((row, index) => (
                  <Fragment key={index}>
                    <TableRow className="area-section-row">
                      <TableCell colSpan={4 + (showArea?.cutting ? 4 : 0) + (showArea?.filling ? 4 : 0)}>
                        <Stack
                          component="button"
                          type="button"
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          onClick={() => toggleSection(index)}
                          aria-expanded={!collapsedSections.has(index)}
                          aria-label={`Section ${row.section}`}
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
                              style={{ transform: collapsedSections.has(index) ? "rotate(-90deg)" : "none", transition: "transform 0.2s" }}
                            />
                            <Box component="span">Section {row.section}</Box>
                          </Stack>
                          <Typography variant="caption" sx={{ color: "#687594", fontWeight: 500 }}>
                            {row?.data?.length || 0} measurements
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {!collapsedSections.has(index) && row?.data?.map((entry, idx) => (
                      <TableRow
                        className="area-data-row"
                        key={`${index}-${idx}`}
                      >
                        <TableCell align="center">{idx + 1}</TableCell>
                        <TableCell align="center">{entry.offset}</TableCell>
                        <TableCell align="center">
                          {entry.initialEntryRL}
                        </TableCell>
                        <TableCell align="center">
                          {entry.secondaryEntryRL}
                        </TableCell>

                        {showArea?.cutting && (
                          <>
                            <TableCell align="center">
                              {entry.cuttingMtr}
                            </TableCell>
                            <TableCell align="center">
                              {entry.cuttingAvgMtr}
                            </TableCell>
                            <TableCell align="center">
                              {entry.cuttingWMtr}
                            </TableCell>
                            <TableCell align="center">
                              {entry.cuttingAreaSqMtr}
                            </TableCell>
                          </>
                        )}

                        {showArea?.filling && (
                          <>
                            <TableCell align="center">
                              {entry.fillingMtr}
                            </TableCell>
                            <TableCell align="center">
                              {entry.fillingAvgMtr}
                            </TableCell>
                            <TableCell align="center">
                              {entry.fillingWMtr}
                            </TableCell>
                            <TableCell align="center">
                              {entry.fillingAreaSqMtr}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}

                    {!collapsedSections.has(index) && row.type !== "Break" && (
                      <TableRow className="area-total-row">
                        <TableCell colSpan={showArea?.cutting ? 7 : 4}>
                          Section total
                        </TableCell>
                        {showArea?.cutting && (
                          <>
                            <TableCell
                              className="area-total-value"
                            >
                              {Number(row?.totalCuttingAreaSqMtr)?.toFixed(3)}
                            </TableCell>
                          </>
                        )}
                        {showArea?.filling && (
                          <>
                            <TableCell colSpan={3}></TableCell>
                            <TableCell
                              className="area-total-value"
                            >
                              {Number(row?.totalFillingAreaSqMtr)?.toFixed(3)}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ px: { xs: 2, sm: 3 }, py: 2.25, borderTop: "1px solid #dce2f0" }}
          >
            <Typography variant="body2" sx={{ color: "#687594" }}>
              Showing {reportTotals.sections} sections
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              {showArea?.cutting && (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography variant="body2" fontWeight={800} color="#34436b">Total cutting area</Typography>
                  <Box sx={{ px: 2, py: 0.75, borderRadius: "5px", bgcolor: "#eff0ff", color: "#211bb5", fontWeight: 900 }}>
                    {reportTotals.cutting.toFixed(3)} m²
                  </Box>
                </Stack>
              )}
              {showArea?.filling && (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography variant="body2" fontWeight={800} color="#34436b">Total filling area</Typography>
                  <Box sx={{ px: 2, py: 0.75, borderRadius: "5px", bgcolor: "#eff0ff", color: "#211bb5", fontWeight: 900 }}>
                    {reportTotals.filling.toFixed(3)} m²
                  </Box>
                </Stack>
              )}
            </Stack>
          </Stack>
          </>
        ) : (
          <Typography sx={{ p: 3, color: "#64748b" }}>Loading ...</Typography>
        )}
      </Box>
      </Box>
      </Container>
    </Box>
  );
};

export default AreaReport;
