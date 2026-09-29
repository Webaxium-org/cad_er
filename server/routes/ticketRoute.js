import { Router } from "express";
import * as ticketController from "../controllers/ticketController.js";
import multer from "multer";
import {
  isAuthenticated,
  isAuthorized,
  requireAuth,
} from "../middleware/auth.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 5, fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      const error = new Error("Only JPEG, PNG, WebP or GIF images are allowed");
      error.status = 400;
      return cb(error);
    }
    cb(null, true);
  },
});

router.use(requireAuth, isAuthenticated);

router.get("/", ticketController.getAllTickets);
router.get("/:id", ticketController.getTicketById);
router.get("/:id/images/:imageId", ticketController.getTicketImage);
router.post("/", upload.array("images", 5), ticketController.createTicket);
router.patch(
  "/:id/status",
  isAuthorized({ roles: ["Super Admin"] }),
  ticketController.updateTicketStatus
);

export default router;
