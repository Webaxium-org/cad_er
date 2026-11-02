import { SUBSCRIPTION_SAC_CODE } from "../constants/index.js";

const ink = [35, 39, 55];
const muted = [105, 112, 132];
const accent = [79, 70, 229]; // CADER primary: #4f46e5
const white = [255, 255, 255];
const amount = paise => (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const renderSubscriptionInvoice = (pdf, autoTable, data, logo) => {
  const text = (value, x, y, size = 9, weight = "normal", color = ink, options = {}) => {
    pdf.setFont("helvetica", weight);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    pdf.text(Array.isArray(value) ? value : String(value), x, y, options);
  };
  const panel = (x, y, w, h, color, radius = 5) => {
    pdf.setFillColor(...color);
    pdf.roundedRect(x, y, w, h, radius, radius, "F");
  };
  const wrap = (value, width, size, weight = "normal") => {
    pdf.setFont("helvetica", weight);
    pdf.setFontSize(size);
    return pdf.splitTextToSize(String(value), width);
  };
  // Panels share a 20 mm outer margin and 6 mm internal padding.
  // Every left/right text edge follows the same inner content grid.
  const left = 20;
  const right = 190;
  const padding = 6;
  const contentLeft = left + padding;
  const contentRight = right - padding;
  const rightColumn = 115;
  const totalsLeft = rightColumn + padding;
  const margin = { left: 20, right: 20, top: 20, bottom: 28 };
  pdf.setProperties({ title: `CADER invoice ${data.number}`, author: "CADER" });

  // Keep decorative curves clipped to the header silhouette.
  panel(10, 10, 190, 80, accent, 12);
  pdf.saveGraphicsState();
  pdf.roundedRect(10, 10, 190, 80, 12, 12, null);
  pdf.clip();
  pdf.discardPath();
  pdf.setFillColor(73, 64, 211);
  pdf.ellipse(148, 3, 48, 23, "F");
  pdf.setFillColor(85, 77, 235);
  pdf.ellipse(11, 70, 12, 26, "F");
  pdf.restoreGraphicsState();

  panel(contentLeft, 22, 12, 12, white, 3);
  pdf.addImage(logo, "PNG", contentLeft + 1.5, 23.5, 9, 9);
  text("CADER", contentLeft + 16, 28, 19, "bold", white);
  text("Complexity simplified", contentLeft + 16, 33, 6.5, "normal", white);

  // Reference hierarchy: brand / contact above recipient / two date columns.
  text("CONTACT", contentRight, 28, 7, "bold", white, { align: "right" });
  text("GSTIN 32CZBPM1659R1ZW", contentRight, 34, 6.5, "bold", white, { align: "right" });
  const addressLines = wrap("23/652, 1, NH 66 BYPASS, OPP. HIGHWAY MASJID, NETTOOR, Maradu, Ernakulam, KERALA, 682040", contentRight - totalsLeft, 6.5);
  text(addressLines, contentRight, 38, 6.5, "normal", white, { align: "right" });
  text("getcader.com", contentRight, 38 + addressLines.length * 2.7 + 2, 6.5, "normal", white, { align: "right" });

  text("Invoice to", contentLeft, 57, 7, "normal", white);
  const recipientName = wrap(data.recipient.name || data.recipient.accountName || "Customer", 78, 10, "bold");
  text(recipientName.slice(0, 2), contentLeft, 63, 10, "bold", white);
  text("INVOICE", contentLeft, 76, 7, "bold", white);
  const date = new Date(data.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  text("Invoice date", contentRight - 38, 57, 7, "normal", white, { align: "right" });
  text(date, contentRight - 38, 63, 8, "bold", white, { align: "right" });
  text("Due date", contentRight, 57, 7, "normal", white, { align: "right" });
  text(date, contentRight, 63, 8, "bold", white, { align: "right" });
  text("ORIGINAL FOR RECIPIENT", contentRight, 76, 6, "normal", white, { align: "right" });

  const invoiceLines = wrap(data.number, 130, 9, "bold");
  const invoicePanelY = 82;
  const invoicePanelHeight = 20 + (invoiceLines.length - 1) * 4;
  panel(left, invoicePanelY, right - left, invoicePanelHeight, [244, 244, 252], 6);
  text("INVOICE NUMBER", contentLeft, invoicePanelY + 7, 6.5, "bold", muted);
  text(invoiceLines, contentLeft, invoicePanelY + 13, 9, "bold", accent);
  text("PAID", contentRight, invoicePanelY + 12, 10, "bold", accent, { align: "right" });

  const recipient = data.recipient;
  const details = [recipient.name, recipient.accountName && recipient.accountName !== recipient.name ? recipient.accountName : null,
    recipient.gstin ? `GSTIN: ${recipient.gstin}` : null, recipient.email,
    recipient.mobile ? `Mobile: ${recipient.mobile}` : null].filter(Boolean);
  autoTable(pdf, { startY: invoicePanelY + invoicePanelHeight + 7, theme: "plain", margin,
    head: [["INVOICE TO", "BILLING ADDRESS"]],
    body: [[details.join("\n"), recipient.address || "Not provided"]],
    styles: { fontSize: 8.5, textColor: ink, cellPadding: { top: 2, bottom: 2, left: padding, right: padding }, overflow: "linebreak" },
    headStyles: { fontSize: 7, fontStyle: "bold", textColor: muted },
    columnStyles: { 0: { cellWidth: rightColumn - left, fontStyle: "bold" } },
    didParseCell: cell => { cell.cell.styles.halign = cell.column.index === 1 ? "right" : "left"; } });

  const itemY = pdf.lastAutoTable.finalY + 8;
  const breakdown = data.breakdown;
  // All prices and tax values remain the saved invoice values.
  autoTable(pdf, { startY: itemY, margin, theme: "plain",
    head: [["NO.", "ITEM DESCRIPTION", "RATE", "QTY", "TAXABLE", "TAX", "TOTAL"]],
    body: [["1", `${data.description.replace(/\bCADer\b/g, "CADER")}\n\nSAC: ${SUBSCRIPTION_SAC_CODE}`, amount(breakdown?.basePaise ?? data.amountPaise), "1",
      breakdown ? amount(breakdown.basePaise) : "-", breakdown ? `${amount(breakdown.gstPaise)} (18%)` : "-",
      amount(breakdown ? breakdown.basePaise + breakdown.gstPaise : data.amountPaise)]],
    styles: { fontSize: 7.5, textColor: ink, cellPadding: { top: 5, bottom: 5, left: 2, right: 2 }, overflow: "linebreak", valign: "middle" },
    headStyles: { fontSize: 6.5, fontStyle: "bold", textColor: muted, fillColor: false, cellPadding: { top: 6, bottom: 6, left: 2, right: 2 } },
    columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 45 }, 2: { cellWidth: 23, halign: "right" },
      3: { cellWidth: 10, halign: "center" }, 4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 27, halign: "right" }, 6: { cellWidth: 28, halign: "right" } },
    didParseCell: cell => {
      // AutoTable columnStyles only apply to body cells; align headings explicitly.
      cell.cell.styles.halign = [2, 4, 5, 6].includes(cell.column.index)
        ? "right" : cell.column.index === 3 ? "center" : "left";
      cell.cell.styles.cellPadding = {
        ...cell.cell.styles.cellPadding,
        left: cell.column.index === 0 ? padding : 2,
        right: cell.column.index === 6 ? padding : 2,
      };
    },
    willDrawCell: cell => {
      if (cell.section === "head" && cell.column.index === 0) {
        panel(20, cell.cell.y - 2, 170, cell.cell.height + 4, [244, 244, 250], 6);
      }
    } });
  const totals = [["Taxable amount", breakdown ? amount(breakdown.basePaise) : "Not recorded"],
    ["CGST 9.0%", breakdown ? amount(breakdown.cgstPaise) : "Not recorded"],
    ["SGST 9.0%", breakdown ? amount(breakdown.sgstPaise) : "Not recorded"],
    ...(breakdown?.processingFeePaise ? [["Processing fee", amount(breakdown.processingFeePaise)]] : [])];
  const note = data.legacy
    ? "Recipient GST details were not recorded when this invoice was issued. The name shown is the current CADER account name."
    : "This is a computer generated document and requires no signature.";
  const noteLines = wrap(note, 72, 7);
  const summaryHeight = Math.max(8 + (totals.length - 1) * 7 + 6 + 14, 34 + noteLines.length * 3.5);
  let summaryY = pdf.lastAutoTable.finalY + 10;
  // Reserve the entire summary/signatory block above the footer.
  if (summaryY + summaryHeight + 35 > 268) { pdf.addPage(); summaryY = 28; }
  pdf.setDrawColor(225, 227, 237);
  pdf.setLineWidth(.25);
  pdf.line(left, summaryY - 6, right, summaryY - 6);

  panel(left, summaryY, 84, summaryHeight, [248, 248, 252], 5);
  text("PAYMENT SUMMARY", contentLeft, summaryY + 8, 7, "bold", accent);
  text("Total items / qty: 1 / 1", contentLeft, summaryY + 16, 8);
  text(`Total amount: INR ${amount(data.amountPaise)}`, contentLeft, summaryY + 23, 8);
  text(noteLines, contentLeft, summaryY + 32, 7, "normal", muted);

  totals.forEach(([label, value], index) => {
    const rowY = summaryY + 8 + index * 7;
    text(label, totalsLeft, rowY, 8, "normal", muted);
    text(value, contentRight, rowY, 8, "normal", ink, { align: "right" });
  });
  const totalY = summaryY + summaryHeight - 14;
  panel(rightColumn, totalY, right - rightColumn, 14, accent, 4);
  text("Total", totalsLeft, totalY + 9, 10, "bold", white);
  text(`INR ${amount(data.amountPaise)}`, contentRight, totalY + 9, 10, "bold", white, { align: "right" });
  text("Amount payable", totalsLeft, totalY + 23, 8, "bold", accent);
  text("INR 0.00", contentRight, totalY + 23, 8, "bold", accent, { align: "right" });

  const signY = summaryY + summaryHeight + 20;
  text("For CADER", contentRight, signY, 8, "normal", muted, { align: "right" });
  pdf.line(contentRight - 42, signY + 10, contentRight, signY + 10);
  text("Authorized Signatory", contentRight, signY + 15, 8, "normal", muted, { align: "right" });

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    panel(20, 275, 170, 10, accent, 5);
    text("Thank you for your business", 105, 281.5, 8, "normal", white, { align: "center" });
    text("CADER | Complexity simplified | getcader.com", contentLeft, 291, 7, "normal", muted);
  }
  return pdf;
};
