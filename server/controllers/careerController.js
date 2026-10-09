import { send_mail } from "../utils/mailer.js";

const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

const positions = new Set(["Tele Callers", "Marketing Executives", "Survey Engineer"]);
const experienceLevels = new Set(["junior", "mid", "senior"]);

export const careerApplication = async (req, res, next) => {
  try {
    const { position, name, email, phone, experience, portfolio, coverLetter } = req.body;
    const values = [position, name, email, phone, portfolio, coverLetter];
    const fileHeader = req.file?.buffer.subarray(0, 4).toString("hex");
    const expectedHeader = req.file?.mimetype === "application/pdf" ? "25504446" : "504b0304";
    if (values.some((value) => typeof value !== "string" || value.length > 5000) ||
        !positions.has(position) || !name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !experienceLevels.has(experience) || !req.file || fileHeader !== expectedHeader) {
      return res.status(400).json({ success: false, message: "Please provide valid application details and a PDF or DOCX CV." });
    }
    if (!process.env.SUPPORT_EMAILS) {
      return res.status(500).json({ success: false, message: "Application email is not configured." });
    }

    const fields = [
      ["Position", position], ["Name", name], ["Email", email],
      ["Phone", phone], ["Experience", experience],
      ["LinkedIn / Portfolio", portfolio], ["Cover letter", coverLetter],
    ];
    const html = `<h2>New career application</h2>${fields.map(([label, value]) =>
      `<p><strong>${label}:</strong> ${escapeHtml(value).replace(/\r?\n/g, "<br>") || "Not provided"}</p>`
    ).join("")}`;
    const sent = await send_mail(
      process.env.SUPPORT_EMAILS,
      `Career application: ${position}`,
      html,
      {
        replyTo: email,
        attachments: [{ filename: req.file.originalname, content: req.file.buffer, contentType: req.file.mimetype }],
      },
    );
    if (!sent) return res.status(502).json({ success: false, message: "Could not send the application. Please try again." });
    res.status(200).json({ success: true, message: "Application sent successfully." });
  } catch (error) {
    next(error);
  }
};
