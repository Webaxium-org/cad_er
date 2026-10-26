export const graphInfoFields = survey => {
  const fields = [["Project title", survey.project], ["Agreement number", survey.agreementNo]];
  if (["Public", "Government"].includes(survey.projectType)) fields.push(["Department", survey.department]);
  if (survey.projectType === "Private") fields.push(["Contractor", survey.contractor]);
  fields.push(["Work zone", ""], ["Remark", ""]);
  return fields.map(([label, value]) => ({ label, value: String(value ?? "").trim() }));
};

// Local coordinates follow the landscape title block, rotated onto the right
// edge of the portrait drawing. Signature cells remain open for handwriting.
export const createGraphInfoPanel = (pdf, survey, length) => {
  const labelWidth = 31;
  const detailsWidth = length * .53;
  const valueWidth = detailsWidth - labelWidth;
  const rightFields = ["Public", "Government"].includes(survey.projectType)
    ? [["Division", survey.division], ["Sub division", survey.subDivision], ["Section", survey.section]]
    : survey.projectType === "Private" ? [["Consultant", survey.consultant], ["Client", survey.client]]
    : [["Surveyed by", ""], ["Checked by", ""], ["Approved by", ""]];
  const fontSize = 7;
  const lineHeight = 3.2;
  const fit = (value, width) => {
    const lines = pdf.splitTextToSize(value || " ", width);
    if (lines.length <= 4) return lines;
    return [...lines.slice(0, 3), `${lines[3].slice(0, -3)}...`];
  };
  pdf.setFont("helvetica", "normal").setFontSize(fontSize);
  const rows = graphInfoFields(survey).map((field, index) => {
    const lines = fit(field.value, (index === 0 ? length - labelWidth : valueWidth) - 4);
    return { ...field, lines, height: Math.max(6, lines.length * lineHeight + 2.5) };
  });
  const height = Math.max(42, rows.reduce((total, row) => total + row.height, 0));
  const extra = (height - rows.reduce((total, row) => total + row.height, 0)) / rows.length;
  return { height, draw(left, bottom) {
    const line = (x1, y1, x2, y2) => pdf.line(left + y1, bottom - x1, left + y2, bottom - x2);
    const text = (value, x, y, options = {}) => {
      const start = options.align === "center" ? x - pdf.getTextWidth(value) / 2 : x;
      pdf.text(value, left + y, bottom - start, { angle: 90 });
    };
    pdf.setTextColor(0).setDrawColor(0).setLineWidth(.2);
    line(0, 0, length, 0); line(0, height, length, height);
    line(0, 0, 0, height); line(length, 0, length, height);
    const titleHeight = rows[0].height + extra;
    line(labelWidth, 0, labelWidth, height);
    line(detailsWidth, titleHeight, detailsWidth, height);
    let y = 0;
    rows.forEach((row, index) => {
      const rowHeight = row.height + extra;
      pdf.setFont("helvetica", "bold").setFontSize(fontSize);
      text(row.label, 2, y + rowHeight / 2 + 1);
      pdf.setFont("helvetica", "normal");
      const firstLine = y + (rowHeight - (row.lines.length - 1) * lineHeight) / 2 + 1;
      row.lines.forEach((value, index) => text(value, labelWidth + 2, firstLine + index * lineHeight));
      y += rowHeight;
      if (y < height - .01) line(0, y, index === 0 ? length : detailsWidth, y);
    });
    const signatureWidth = (length - detailsWidth) / rightFields.length;
    const headerHeight = titleHeight + 7;
    line(detailsWidth, headerHeight, length, headerHeight);
    rightFields.forEach(([label, value], index) => {
      const x = detailsWidth + signatureWidth * index;
      if (index) line(x, titleHeight, x, height);
      pdf.setFont("helvetica", "bold").setFontSize(7);
      text(label, x + signatureWidth / 2, titleHeight + 4.5, { align: "center" });
      pdf.setFont("helvetica", "normal").setFontSize(7);
      const lines = fit(String(value ?? ""), signatureWidth - 4);
      lines.forEach((line, row) => text(line, x + 2, headerHeight + 4 + row * lineHeight));
      pdf.setFontSize(6);
      text("Signature", x + signatureWidth / 2, height - 3, { align: "center" });
    });
  } };
};
