import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createGraphInfoPanel } from "./graphInfoPanel";
import { printedGraphScale, graphScaleLabel } from "./graphScale";
import { createChartCaptureSession } from "./chartCaptureSession";
import { canvasJpegBytes, GRAPH_EXPORT_SCALE } from "./graphCapture";
import { formatReportNumber } from "./reportNumber";

const drawPDFHeader = (doc, surveyInfo, reportDetails, tableData) => {
  // 1. Header
  const layerName = reportDetails?.initialEntry || "INITIAL LEVEL";
  const headerText = `${layerName} - PROFILE, SECTIONS & QUANTITY`.toUpperCase();
  
  const isInitial = layerName.toLowerCase().includes("initial");
  
  doc.setFont("helvetica", "bold").setFontSize(16);
  if (isInitial) {
    doc.setTextColor(0, 128, 0); // green
  } else {
    doc.setTextColor(255, 0, 0); // red
  }
  
  doc.text(headerText, 105, 30, { align: "center" });

  // 2. Department or Client Details
  doc.setFont("helvetica", "normal").setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  const hasProjectDetails = surveyInfo?.projectType !== "None";
  const isGovt = surveyInfo?.projectType !== "Private" && surveyInfo?.projectType !== "private";
  const deptOrClient = isGovt ? (surveyInfo?.department || "IRRIGATION DEPARTMENT") : (surveyInfo?.client || "CLIENT DETAILS");
  if (hasProjectDetails) doc.text(deptOrClient.toUpperCase(), 105, 40, { align: "center" });

  // 3. Instrument Model and Serial No.
  doc.setFontSize(10);
  if (hasProjectDetails) {
    const instrumentModel = surveyInfo?.instrumentModel || surveyInfo?.instrumentNo || "—";
    const serialNo = "122240174"; // Defaulting to the one in previous code if not in surveyInfo
    doc.text(`INSTRUMENT MODEL: ${instrumentModel}`, 15, 55);
    doc.text(`SERIAL NO: ${serialNo}`, 195, 55, { align: "right" });
  }

  // 4. Name of work
  doc.setFont("helvetica", "bold").setFontSize(14);
  const workName = surveyInfo?.project || "NAME OF WORK";
  const splitWorkName = doc.splitTextToSize(workName.toUpperCase(), 180);
  doc.text(splitWorkName, 105, 70, { align: "center" });
  
  let currentY = 70 + (splitWorkName.length * 6) + 15;
  
  // 5. LF Book Registered No & 6. Agreement No
  doc.setFont("helvetica", "normal").setFontSize(11);
  doc.text("LF Book Registered No:", 15, currentY);
  doc.text("__________________________________________________", 65, currentY);
  currentY += 10;
  
  if (hasProjectDetails) {
    doc.text("Agreement No:", 15, currentY);
    const agreementText = surveyInfo?.agreementNo || "__________________________________________________";
    doc.text(agreementText, 65, currentY);
    currentY += 15;

    // 7. Client Management / Hierarchy node
    doc.text("Division:", 15, currentY);
    doc.text(surveyInfo?.division || "________________________________", 45, currentY);
    currentY += 8;

    doc.text("Sub-Division:", 15, currentY);
    doc.text(surveyInfo?.subDivision || "________________________________", 45, currentY);
    currentY += 8;

    doc.text("Section:", 15, currentY);
    doc.text(surveyInfo?.section || "________________________________", 45, currentY);
    currentY += 8;

    doc.text("Contractor:", 15, currentY);
    doc.text(surveyInfo?.contractor || "________________________________", 45, currentY);
    currentY += 20;
  } else {
    currentY += 12;
  }

  // 8. QUANTITY STATEMENT / ABSTRACT Table
  let quantityText = "-";
  if (tableData) {
     const cut = Number(tableData?.totalCuttingVolume || 0);
     const fill = Number(tableData?.totalFillingVolume || 0);
     if (cut > 0 && fill > 0) {
       quantityText = `Cut: ${cut.toFixed(3)}, Fill: ${fill.toFixed(3)}`;
     } else if (cut > 0) {
       quantityText = `${cut.toFixed(3)}`;
     } else if (fill > 0) {
       quantityText = `${fill.toFixed(3)}`;
     } else {
       quantityText = "0.000";
     }
  }

  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text("QUANTITY STATEMENT / ABSTRACT", 105, currentY, { align: "center" });
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    margin: { left: 15, right: 15 },
    head: [['SL. No.', 'Page No.', 'Layers / Profiles', 'Quantity / QTY', 'Units']],
    body: [
      ['1', '', layerName, quantityText, 'Cubic Meters']
    ],
    theme: 'grid',
    styles: { fontSize: 10, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });

  currentY = doc.lastAutoTable.finalY + 40;

  // 9. Signatory
  doc.setFont("helvetica", "bold").setFontSize(10);
  doc.text("Assistant Engineer", 30, currentY, { align: "center" });
  doc.text("Assistant Executive Engineer", 105, currentY, { align: "center" });
  doc.text("Executive Engineer", 180, currentY, { align: "center" });
};

export const exportPlottingPdf = async ({
  tableData,
  reportDetails,
  surveyInfo,
  showArea,
  setLoading,
  download = true,
  setProgress,
  onError,
  getChart,
  chartCount,
}) => {
  if (setLoading) setLoading(true);
  if (setProgress) setProgress({ percent: 0, message: "Initializing document...", estimatedTimeLeft: null });

  let captureSession;
  try {
    const chartItems = document.querySelectorAll(".pdf-chart-item");
    const count = getChart ? chartCount : chartItems.length;
    let totalSteps = 1; // Cover page
    if (tableData?.rows?.length > 0) totalSteps++;
    if (tableData?.areaReport?.length > 0) totalSteps++;
    totalSteps += count;

    let currentStep = 0;
    let chartStartTime = null, completedCharts = 0;

    const updateProgress = (message, advance = true) => {
      if (advance) currentStep++;
      const percent = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
      
      let estimatedTimeLeft = null;
      if (chartStartTime !== null && completedCharts > 0 && completedCharts < count) {
        const averageChartTime = (Date.now() - chartStartTime) / completedCharts;
        estimatedTimeLeft = Math.max(1, Math.ceil(averageChartTime * (count - completedCharts) / 1000));
      } else if (completedCharts === count && count > 0) {
        estimatedTimeLeft = 0;
      }
      
      if (setProgress) {
        setProgress({ percent, message, estimatedTimeLeft });
      }
    };

    // Skip PDF stream compression; graph JPEGs are already encoded.
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: false,
    });

    const pageTotalWidth = doc.internal.pageSize.getWidth();
    const pageTotalHeight = doc.internal.pageSize.getHeight();

    // Draw the cover page alone on the first page
    drawPDFHeader(doc, surveyInfo, reportDetails, tableData);
    updateProgress("Cover page generated");

    // ===== VOLUME REPORT =====
    if (tableData?.rows?.length > 0) {
      const volumeBody = [];
      tableData.rows.forEach((row, index) => {
        if (row.isBreak) {
          volumeBody.push([{ content: row.message, colSpan: 13, styles: { fontStyle: "bold" } }]);
        }
        if (row.isDeductionRow) {
          volumeBody.push([
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
        volumeBody.push([
          index + 1,
          row.section,
          row.prevSection,
          row.difference,
          row.width,
          ...(showArea?.cutting
            ? [
                formatReportNumber(row.cuttingAreaSqMtr),
                row.cuttingPrevArea,
                row.cuttingAvgSqrMtr,
                row.cuttingVolumeCubicMtr,
              ]
            : []),
          ...(showArea?.filling
            ? [
                formatReportNumber(row.fillingAreaSqMtr),
                row.fillingPrevArea,
                row.fillingAvgSqrMtr,
                row.fillingVolumeCubicMtr,
              ]
            : []),
        ]);
      });

      volumeBody.push([
        "",
        "",
        "",
        "",
        "",

        { content: "Total", styles: { fontStyle: "bold" } },

        ...(showArea?.cutting
          ? [
              { content: "", colSpan: 2 },
              {
                content: Number(tableData?.totalCuttingVolume)?.toFixed(3),
                styles: { fontStyle: "bold" },
              },
            ]
          : []),

        ...(showArea?.filling
          ? [
              { content: "", colSpan: showArea?.cutting ? 3 : 2 },
              {
                content: Number(tableData?.totalFillingVolume)?.toFixed(3),
                styles: { fontStyle: "bold" },
              },
            ]
          : []),
      ]);

      doc.addPage();

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
          ],
        ],
        body: volumeBody,
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
          fillColor: false,
          textColor: 0,
          lineWidth: 0.1,
        },
        didDrawPage: () => {
          doc.setFont("helvetica", "bold").setFontSize(10);
          doc.text(
            `Volume Report ${reportDetails.initialEntry} and ${reportDetails.secondaryEntry}`,
            105,
            15,
            { align: "center" },
          );
        },
      });
      updateProgress("Volume report table generated");
    }

    // ===== AREA REPORT =====
    if (tableData?.areaReport?.length > 0) {
      const areaBody = [];
      tableData.areaReport.forEach((section) => {
        if (section.type === "Break") {
          areaBody.push([{ content: section.message, colSpan: 12, styles: { fontStyle: "bold" } }]);
          return;
        }
        areaBody.push([
          {
            content: `Section: ${section.section}`,
            colSpan: 12,
            styles: { fontStyle: "bold" },
          },
        ]);
        areaBody.push([{ content: "", colSpan: 12 }]);
        section.data.forEach((row, idx) => {
          areaBody.push([
            idx + 1,
            formatReportNumber(row.offset),
            formatReportNumber(row.initialEntryRL),
            formatReportNumber(row.secondaryEntryRL),
            ...(showArea?.cutting
              ? [
                  formatReportNumber(row.cuttingMtr),
                  formatReportNumber(row.cuttingAvgMtr),
                  formatReportNumber(row.cuttingWMtr),
                  formatReportNumber(row.cuttingAreaSqMtr),
                ]
              : []),
            ...(showArea?.filling
              ? [
                  formatReportNumber(row.fillingMtr),
                  formatReportNumber(row.fillingAvgMtr),
                  formatReportNumber(row.fillingWMtr),
                  formatReportNumber(row.fillingAreaSqMtr),
                ]
              : []),
          ]);
        });
        areaBody.push([
          { content: "", colSpan: 4 },

          { content: "Total", styles: { fontStyle: "bold" } },

          ...(showArea?.cutting
            ? [
                { content: "", colSpan: 2 },
                {
                  content: Number(section?.totalCuttingAreaSqMtr)?.toFixed(3),
                  styles: { fontStyle: "bold" },
                },
              ]
            : []),

          ...(showArea?.filling
            ? [
                { content: "", colSpan: showArea?.cutting ? 3 : 2 },
                {
                  content: Number(section?.totalFillingAreaSqMtr)?.toFixed(3),
                  styles: { fontStyle: "bold" },
                },
              ]
            : []),
        ]);
      });

      doc.addPage();

      autoTable(doc, {
        margin: { top: 20 },
        theme: "grid",
        head: [
          [
            { content: "Sl.No.", rowSpan: 2 },
            { content: "Distance Meters", rowSpan: 2 },
            { content: `${reportDetails.initialEntry} Meters`, rowSpan: 2 },
            { content: `${reportDetails.secondaryEntry} Meters`, rowSpan: 2 },
            ...(showArea?.cutting
              ? [{ content: "Cutting Area", colSpan: 4 }]
              : []),
            ...(showArea?.filling
              ? [{ content: "Filling Area", colSpan: 4 }]
              : []),
          ],
          [
            ...(showArea?.cutting
              ? [
                  "Cutting Meters",
                  "Avg Meters",
                  "Width Meters",
                  "Area Sq. Mtrs",
                ]
              : []),
            ...(showArea?.filling
              ? [
                  "Filling Meters",
                  "Avg Meters",
                  "Width Meters",
                  "Area Sq. Mtrs",
                ]
              : []),
          ],
        ],
        body: areaBody,
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
          fillColor: false,
          textColor: 0,
          lineWidth: 0.1,
        },
        didDrawPage: () => {
          doc.setFont("helvetica", "bold").setFontSize(10);
          doc.text(
            `Area Report Between ${reportDetails.initialEntry} and ${reportDetails.secondaryEntry}`,
            105,
            15,
            { align: "center" },
          );
        },
      });
      updateProgress("Area report table generated");
    }

    // ===== CHARTS & GRAPHS SECTION =====
    const chartPageMargin = 8;
    const chartContentWidth = pageTotalWidth - chartPageMargin * 2;
    const graphTop = chartPageMargin + 14;
    const graphBottom = pageTotalHeight - chartPageMargin;
    const infoPanel = createGraphInfoPanel(doc, surveyInfo || {}, graphBottom - graphTop);
    const infoBoxHeight = infoPanel.height;
    const chartGap = 4;
    const drawGraphInfoSection = bottom => infoPanel.draw(pageTotalWidth - chartPageMargin - infoBoxHeight, bottom);

    chartStartTime = Date.now();
    for (let i = 0; i < count; i++) {
      updateProgress(`Processing chart ${i + 1} of ${count}: rendering...`, false);
      const el = getChart ? await getChart(i) : chartItems[i];
      if (!captureSession) captureSession = await createChartCaptureSession();

      await new Promise(resolve => setTimeout(resolve, 0));
      updateProgress(`Processing chart ${i + 1} of ${count}: capturing image...`, false);
      const { canvas, plots } = await captureSession.capture(el);
      const sourceWidth = canvas.width, sourceHeight = canvas.height;

      // Rotate canvas -90 degrees so it fits portrait page vertically
      const rotatedCanvas = document.createElement("canvas");
      rotatedCanvas.width = canvas.height;
      rotatedCanvas.height = canvas.width;
      const ctx = rotatedCanvas.getContext("2d");
      ctx.translate(0, canvas.width);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(canvas, 0, 0);
      canvas.width = canvas.height = 0;

      // Encode at high quality without an extra base64 copy.
      updateProgress(`Processing chart ${i + 1} of ${count}: encoding image...`, false);
      const imgData = await canvasJpegBytes(rotatedCanvas);
      doc.addPage();

      const availableTop = chartPageMargin + 14;
      const availableBottom = pageTotalHeight - chartPageMargin;
      const availableHeight = availableBottom - availableTop;

      doc.setFont("helvetica", "bold").setFontSize(11);
      // doc.text(
      //   "Plotting and Quantity Report",
      //   pageTotalWidth / 2,
      //   chartPageMargin + 8,
      //   { align: "center" },
      // );

      // Master Border around the entire content area (chart + table)
      doc.setDrawColor(0).setLineWidth(0.4);
      doc.rect(
        chartPageMargin,
        availableTop,
        chartContentWidth,
        availableHeight
      );

      const availableLeft = chartPageMargin;
      const tableWidth = infoBoxHeight;
      const availableRight = pageTotalWidth - chartPageMargin - tableWidth - chartGap;
      const availableWidth = availableRight - availableLeft;

      let imgWidth = availableWidth - 2;
      let imgHeight = (rotatedCanvas.height * imgWidth) / rotatedCanvas.width;

      if (imgHeight > availableHeight - 2) {
        imgHeight = availableHeight - 2;
        imgWidth = (rotatedCanvas.width * imgHeight) / rotatedCanvas.height;
      }

      const x = availableLeft + (availableWidth - imgWidth) / 2;
      const y = availableTop + (availableHeight - imgHeight) / 2;
      const printedScales = plots.map(plot => printedGraphScale(plot.plotArea,
        imgHeight * plot.plotWidthPx / (sourceWidth / GRAPH_EXPORT_SCALE),
        imgWidth * plot.plotHeightPx / (sourceHeight / GRAPH_EXPORT_SCALE)));

      // Embed the encoded JPEG without recompressing it.
      doc.addImage(
        imgData,
        "JPEG",
        x,
        y,
        imgWidth,
        imgHeight,
        undefined,
        "NONE",
      );

      // The drawing is rotated onto the portrait sheet. Keep its scale in the
      // upper-left corner inside the frame, with the same reading direction.
      const scaleLines = printedScales.flatMap(scale => graphScaleLabel(scale).split("    "));
      scaleLines.push("Print at 100% / Actual size");
      doc.setFont("helvetica", "normal").setTextColor(0);
      scaleLines.forEach((line, lineIndex) => {
        doc.setFontSize(lineIndex === scaleLines.length - 1 ? 7 : 8);
        doc.text(line, chartPageMargin + 6 + lineIndex * 3.5, availableTop + 32, { angle: 90 });
      });

      drawGraphInfoSection(availableBottom);

      // Cleanup to free memory
      canvas.width = 0;
      canvas.height = 0;
      rotatedCanvas.width = rotatedCanvas.height = 0;
      completedCharts++;
      updateProgress(`Chart ${i + 1} of ${count} completed`);
    }

    if (setProgress) {
      setProgress({ percent: 100, message: "Saving PDF document...", estimatedTimeLeft: 0 });
    }
    if (download) doc.save(`plotting-and-quantity-report.pdf`);
    else return doc.output("blob");
  } catch (err) {
    console.error("Export error:", err);
    if (onError) onError(err);
    else throw err;
  } finally {
    captureSession?.dispose();
    if (setLoading) setLoading(false);
  }
};

