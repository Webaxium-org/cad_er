import express from "express";
import { requireAuth, isAuthenticated, isAuthorized } from "../middleware/auth.js";
import { requireProfessionalSubscription } from "../services/subscriptionAccess.js";
import { heavyLimiter } from "../middleware/rateLimiter.js";
import { pdfExportTiming } from "../middleware/pdfExportTiming.js";
import { createPdfExport, listPdfExports, downloadPdfExport, acknowledgePdfExport } from "../controllers/pdfExportController.js";
const router = express.Router();
router.use(pdfExportTiming, requireAuth, isAuthenticated, isAuthorized({ types: ["Professional"] }));
router.get("/", listPdfExports);
router.get("/:id/download", downloadPdfExport);
router.patch("/:id", acknowledgePdfExport);
// Large snapshots are accepted only after authentication, on this endpoint.
router.post("/", (req, res, next) => { req.pdfExportStage = "subscription"; next(); }, requireProfessionalSubscription, heavyLimiter,
  (req, res, next) => { req.pdfExportStage = "snapshot upload"; next(); }, express.json({ limit: "9mb" }), createPdfExport);
export default router;
