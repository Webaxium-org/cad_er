import { SUBSCRIPTION_SAC_CODE } from "../constants/index.js";

const black = [20, 20, 20];
const accent = [79, 70, 229];
const amount = paise => (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Follow the supplied invoice's plain layout; all billing values are saved values.
export const renderSubscriptionInvoice = (pdf, autoTable, data, logo) => {
  const text = (value, x, y, size = 9, weight = "normal", color = black, options = {}) => {
    pdf.setFont("helvetica", weight);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    pdf.text(String(value), x, y, options);
  };
  const rule = y => { pdf.setDrawColor(...accent); pdf.setLineWidth(.25); pdf.line(8.5, y, 201.5, y); };
  pdf.setProperties({ title: `CADer invoice ${data.number}`, author: "CADer" });
  text("I N V O I C E", 8.5, 12.5, 11, "bold", accent);
  text("O R I G I N A L  F O R  R E C I P I E N T", 201.5, 11.5, 7, "normal", black, { align: "right" });
  text("CADer", 8.5, 21, 14, "bold");
  text("GSTIN 32CZBPM1659R1ZW", 8.5, 26, 9, "bold");
  text("23/652, 1", 8.5, 30, 9);
  text("NH 66 BYPASS, OPP. HIGHWAY MASJID, NETTOOR, Maradu", 8.5, 34, 9);
  text("Ernakulam, KERALA, 682040", 8.5, 38, 9);
  pdf.addImage(logo, "PNG", 169, 24, 11, 11);
  text("CAD", 182, 29.5, 12, "bold", [100, 116, 139]);
  text("ER", 191, 29.5, 12, "bold", accent);
  text("Complexity simplified", 182, 33, 4.5, "normal", [100, 116, 139]);

  const date = new Date(data.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  autoTable(pdf, { startY: 46, theme: "plain", margin: { left: 8.5, right: 8.5 },
    body: [[`Invoice #: ${data.number}`, `Invoice Date: ${date}`, `Due Date: ${date}`]],
    styles: { fontSize: 8.5, fontStyle: "bold", textColor: black, cellPadding: { top: 1, bottom: 2, left: 0, right: 3 } },
    columnStyles: { 0: { cellWidth: 64 }, 1: { cellWidth: 64 } } });
  const recipient = data.recipient;
  const details = [recipient.name, recipient.accountName && recipient.accountName !== recipient.name ? recipient.accountName : null,
    recipient.gstin ? `GSTIN: ${recipient.gstin}` : null, recipient.email,
    recipient.mobile ? `Mobile: ${recipient.mobile}` : null].filter(Boolean);
  const margin = { left: 8.5, right: 8.5, bottom: 20 };
  autoTable(pdf, { startY: pdf.lastAutoTable.finalY + 1, theme: "plain", margin,
    head: [["Customer Details:", "Billing Address:"]],
    body: [[details.join("\n"), recipient.address || "Not provided"]],
    styles: { fontSize: 8.5, textColor: black, cellPadding: { top: 1, bottom: 1, left: 0, right: 6 }, overflow: "linebreak" },
    headStyles: { fontStyle: "normal", textColor: black },
    columnStyles: { 0: { cellWidth: 64, fontStyle: "bold" } } });

  const itemY = Math.max(90.5, pdf.lastAutoTable.finalY + 7);
  const breakdown = data.breakdown;
  autoTable(pdf, { startY: itemY, margin, theme: "plain",
    head: [["#", "Item", "Rate / Item", "Qty", "Taxable Value", "Tax Amount", "Amount"]],
    body: [["1", `${data.description}\n\nSAC: ${SUBSCRIPTION_SAC_CODE}`, amount(breakdown?.basePaise ?? data.amountPaise), "1",
      breakdown ? amount(breakdown.basePaise) : "-", breakdown ? `${amount(breakdown.gstPaise)} (18%)` : "-",
      amount(breakdown ? breakdown.basePaise + breakdown.gstPaise : data.amountPaise)]],
    styles: { fontSize: 8, textColor: black, cellPadding: { top: 2, bottom: 3, left: 1.5, right: 1.5 }, overflow: "linebreak", valign: "middle" },
    headStyles: { fontSize: 7.5, fontStyle: "bold", fillColor: [248, 249, 255] },
    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 65 }, 2: { cellWidth: 27, halign: "right" },
      3: { cellWidth: 10, halign: "center" }, 4: { cellWidth: 28, halign: "right" },
      5: { cellWidth: 26, halign: "right" }, 6: { cellWidth: 29, halign: "right" } },
    didDrawCell: cell => {
      if (cell.section === "head") {
        pdf.setDrawColor(...accent); pdf.setLineWidth(.2);
        pdf.line(cell.cell.x, cell.cell.y, cell.cell.x + cell.cell.width, cell.cell.y);
        pdf.line(cell.cell.x, cell.cell.y + cell.cell.height, cell.cell.x + cell.cell.width, cell.cell.y + cell.cell.height);
      }
    } });
  let y = pdf.lastAutoTable.finalY;
  if (y > 195) { pdf.addPage(); y = 16; }
  pdf.setDrawColor(200, 207, 220); pdf.setLineWidth(.2); pdf.line(8.5, y, 201.5, y);
  const totals = [["Taxable Amount", breakdown ? amount(breakdown.basePaise) : "Not recorded"],
    ["CGST 9.0%", breakdown ? amount(breakdown.cgstPaise) : "Not recorded"],
    ["SGST 9.0%", breakdown ? amount(breakdown.sgstPaise) : "Not recorded"],
    ...(breakdown?.processingFeePaise ? [["Processing fee", amount(breakdown.processingFeePaise)]] : [])];
  for (const [label, value] of totals) {
    y += 5;
    text(label, 163, y, 8.5, "bold", black, { align: "right" });
    text(value, 201.5, y, 8.5, "normal", black, { align: "right" });
  }
  text("Total", 163, y + 7, 11, "bold", black, { align: "right" });
  text(`INR ${amount(data.amountPaise)}`, 201.5, y + 7, 11, "bold", black, { align: "right" });
  text("Total Items / Qty : 1 / 1", 10, y + 14, 7.5);
  text(`Total amount: INR ${amount(data.amountPaise)}`, 201.5, y + 14, 7.5, "normal", black, { align: "right" });
  rule(y + 16);
  text("Amount Payable:", 163, y + 21, 9, "bold", black, { align: "right" });
  text("INR 0.00", 201.5, y + 21, 9, "bold", black, { align: "right" });
  text("For CADer", 197, y + 40, 8, "normal", black, { align: "right" });
  text("Authorized Signatory", 197, y + 60, 8, "normal", black, { align: "right" });
  if (data.legacy) {
    text(pdf.splitTextToSize("Recipient GST details were not recorded when this invoice was issued. The name shown is the current CADer account name.", 120), 8.5, y + 31, 7);
  }
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    text("CADer | Complexity simplified | getcader.com", 8.5, 284, 8, "normal", accent);
    text(`Page ${page} / ${pages}   -   This is a computer generated document and requires no signature.`, 8.5, 288, 7);
    text("Powered By", 201.5, 282, 7, "normal", black, { align: "right" });
    text("CADer", 201.5, 288, 15, "bold", accent, { align: "right" });
  }
  return pdf;
};
