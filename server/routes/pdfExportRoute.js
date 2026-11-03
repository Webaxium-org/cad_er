import express from "express";
import { requireAuth, isAuthenticated, isAuthorized } from "../middleware/auth.js";
import { requireProfessionalSubscription } from "../services/subscriptionAccess.js";
import { heavyLimiter } from "../middleware/rateLimiter.js";
import { createPdfExport, listPdfExports, downloadPdfExport, acknowledgePdfExport } from "../controllers/pdfExportController.js";
const router = express.Router();
router.use(requireAuth, isAuthenticated, isAuthorized({ types: ["Professional"] }));
router.get("/", listPdfExports);
router.get("/:id/download", downloadPdfExport);
router.patch("/:id", acknowledgePdfExport);
// Large snapshots are accepted only after authentication, on this endpoint.
router.post("/", requireProfessionalSubscription, heavyLimiter, express.json({ limit: "9mb" }), createPdfExport);
export default router;
