import { jsPDF } from "jspdf";
import { sectionPages } from "./sectionDrawing.js";

export function createSectionPdf(sections, scales) {
  const pages = sections.flatMap((section) => sectionPages(section, scales));
  if (!pages.length) throw new Error("No sections to export.");
  let pdf;
  pages.forEach((page) => {
    const orientation = page.width > page.height ? "landscape" : "portrait";
    if (!pdf) pdf = new jsPDF({ orientation, unit: "mm", format: [page.width, page.height], compress: true });
    else pdf.addPage([page.width, page.height], orientation);
    for (const item of page.commands) {
      if (item.kind === "line") {
        pdf.setDrawColor(item.color || "#000000"); pdf.setLineWidth(item.width);
        pdf.line(item.x1, item.y1, item.x2, item.y2);
      } else {
        pdf.setTextColor(item.color || "#000000"); pdf.setFontSize(item.size * 72 / 25.4);
        pdf.text(item.value, item.x, item.y, { angle: item.angle, align: item.align });
      }
    }
  });
  return pdf;
}
