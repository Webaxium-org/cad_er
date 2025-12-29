import { Router } from "express";
import * as ticketController from "../controllers/ticketController.js";
import {
  isAuthenticated,
  isAuthorized,
  requireAuth,
} from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, isAuthenticated);

router.get("/", ticketController.getAllTickets);
router.get("/:id", ticketController.getTicketById);
router.post("/", ticketController.createTicket);
router.patch(
  "/:id/status",
  isAuthorized({ roles: ["Super Admin"] }),
  ticketController.updateTicketStatus
);

export default router;
