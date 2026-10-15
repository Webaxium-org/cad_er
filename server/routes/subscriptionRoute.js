import express from "express";
import { requireAuth, isAuthenticated } from "../middleware/auth.js";
import { listPlans, getSubscription, createCheckout, verifyCheckout, cancelSubscription, razorpayWebhook } from "../controllers/subscriptionController.js";

const router = express.Router();

router.post("/webhook", razorpayWebhook);
router.get("/plans", listPlans);
router.use(requireAuth, isAuthenticated);
router.get("/me", getSubscription);
router.post("/checkout", createCheckout);
router.post("/verify", verifyCheckout);
router.post("/cancel", cancelSubscription);

export default router;
