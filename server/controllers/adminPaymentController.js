import Payment from "../models/payments.js";
import { ensurePaymentInvoice } from "../services/paymentInvoice.js";
import User from "../models/user.js";
import "../models/subscription.js";
import "../models/planVersion.js";
import createHttpError from "http-errors";

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const adminSubscriptionPayments = async (req, res, next) => {
  try {
    const range = ["today", "week", "month", "custom", "all"].includes(req.query.range) ? req.query.range : "month";
    const phase = ["initial", "recurring"].includes(req.query.phase) ? req.query.phase : "all";
    const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
    const search = String(req.query.search || "").trim().slice(0, 80);
    const base = { purpose: "SUBSCRIPTION", status: "SUCCESS", currency: "INR",
      razorpayPaymentId: { $exists: true, $ne: null } };
    if (range !== "all") {
      const from = new Date(req.query.from);
      const to = new Date(req.query.to);
      if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from >= to ||
          to.getTime() - from.getTime() > 10 * 366 * 24 * 60 * 60 * 1000) {
        throw createHttpError(400, "Choose a valid payment date range");
      }
      base.createdAt = { $gte: from, $lt: to };
    }
    if (phase !== "all") base.billingPhase = phase;

    const metricsPipeline = [
      { $match: base },
      { $group: { _id: null, grossPaise: { $sum: "$amount" }, count: { $sum: 1 },
        customerIds: { $addToSet: "$userId" },
        initialPaise: { $sum: { $cond: [{ $eq: ["$billingPhase", "initial"] }, "$amount", 0] } },
        initialCount: { $sum: { $cond: [{ $eq: ["$billingPhase", "initial"] }, 1, 0] } },
        recurringPaise: { $sum: { $cond: [{ $eq: ["$billingPhase", "recurring"] }, "$amount", 0] } },
        recurringCount: { $sum: { $cond: [{ $eq: ["$billingPhase", "recurring"] }, 1, 0] } },
      } },
      { $project: { _id: 0, grossPaise: 1, count: 1, customers: { $size: "$customerIds" },
        initialPaise: 1, initialCount: 1, recurringPaise: 1, recurringCount: 1 } },
    ];

    let searchFilter = base;
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const users = await User.find({ $or: [{ name: regex }, { email: regex }] }).select("_id").lean();
      searchFilter = { $and: [base, { $or: [
        { razorpayPaymentId: regex }, { razorpayOrderId: regex }, { razorpaySubscriptionId: regex }, { invoiceNumber: regex },
        { userId: { $in: users.map(user => user._id) } },
      ] }] };
    }

    const [summary, total, rows] = await Promise.all([
      Payment.aggregate(metricsPipeline),
      Payment.countDocuments(searchFilter),
      Payment.find(searchFilter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 20).limit(20)
        .select("userId subscriptionId planVersionId billingPhase amount createdAt razorpayPaymentId razorpayOrderId razorpaySubscriptionId invoiceNumber")
        .populate("userId", "name email")
        .populate("subscriptionId", "planCode pricingSnapshot")
        .populate("planVersionId", "name")
        .lean(),
    ]);

    for (const row of rows) {
      if (!row.invoiceNumber) row.invoiceNumber = await ensurePaymentInvoice({ _id: row._id });
    }
    res.json({ range, phase, page, pageSize: 20, total,
      metrics: summary[0] || { grossPaise: 0, count: 0, customers: 0,
        initialPaise: 0, initialCount: 0, recurringPaise: 0, recurringCount: 0 },
      payments: rows.map(row => ({ id: row._id, customer: row.userId
        ? { name: row.userId.name, email: row.userId.email } : null,
        planName: row.subscriptionId?.pricingSnapshot?.name || row.planVersionId?.name ||
          row.subscriptionId?.planCode?.replaceAll("_", " ") || "Subscription",
        phase: row.billingPhase || "legacy", amountPaise: row.amount, createdAt: row.createdAt,
        paymentId: row.razorpayPaymentId, orderId: row.razorpayOrderId, invoiceNumber: row.invoiceNumber,
        subscriptionId: row.razorpaySubscriptionId,
      })) });
  } catch (error) { next(error); }
};
