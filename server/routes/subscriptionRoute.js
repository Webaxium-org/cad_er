import express from "express";
import { requireAuth, isAuthenticated, isAuthorized } from "../middleware/auth.js";
import { adminPlans, planHistory, publishPlan } from "../controllers/planController.js";
import { adminSubscriptionPayments } from "../controllers/adminPaymentController.js";
import { listPlans, getSubscription, createCheckout, verifyCheckout, cancelSubscription, razorpayWebhook, setupAutopay } from "../controllers/subscriptionController.js";

const router = express.Router();

router.post("/webhook", razorpayWebhook);
router.get("/plans", requireAuth, listPlans);
router.use(requireAuth, isAuthenticated);
router.get("/admin/plans", isAuthorized({ roles: ["Super Admin"] }), adminPlans);
router.get("/admin/payments", isAuthorized({ roles: ["Super Admin"] }), adminSubscriptionPayments);
router.get("/admin/plans/:code/history", isAuthorized({ roles: ["Super Admin"] }), planHistory);
router.post("/admin/plans/:code/versions", isAuthorized({ roles: ["Super Admin"] }), publishPlan);
router.get("/me", getSubscription);
router.post("/checkout", createCheckout);
router.post("/verify", verifyCheckout);
router.post("/autopay", setupAutopay);
router.post("/cancel", cancelSubscription);

export default router;
