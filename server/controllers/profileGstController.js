import mongoose from "mongoose";
import createHttpError from "http-errors";
import User from "../models/user.js";
import Payment from "../models/payments.js";
import Subscription from "../models/subscription.js";
import { invoicePricing } from "../services/invoicePricing.js";
import { validateGstProfile } from "../services/gstIdentity.js";
import { fetchGstDetails, gstLookupConfigured } from "../services/gstLookup.js";
import { ensurePaymentInvoice } from "../services/paymentInvoice.js";

const fields = "gstin gstBusinessName gstBusinessAddress gstMobile gstFetchedAt gstLookupProvider name";
const publicProfile = user => ({ gstin: user.gstin || "", gstBusinessName: user.gstBusinessName || "",
  gstBusinessAddress: user.gstBusinessAddress || "", gstMobile: user.gstMobile || "", gstFetchedAt: user.gstFetchedAt || null,
  gstLookupProvider: user.gstLookupProvider || "", accountName: user.name, lookupConfigured: gstLookupConfigured() });
export const getMyGstProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select(fields).lean();
    if (!user) throw createHttpError(404, "Account not found");
    res.set("Cache-Control", "no-store").json(publicProfile(user));
  } catch (error) { next(error); }
};
export const saveMyGstProfile = async (req, res, next) => {
  try {
    const { gstin } = validateGstProfile(req.body);
    const existing = await User.findById(req.user.userId).select(fields).lean();
    if (!existing) throw createHttpError(404, "Account not found");
    // Reuse this account's recent fetched data instead of spending another free
    // credit on an identical save. Explicit refresh always asks the provider.
    const age = existing.gstFetchedAt ? Date.now() - new Date(existing.gstFetchedAt).getTime() : Infinity;
    if (gstin && existing.gstin === gstin && existing.gstLookupProvider === "gstinapi.in" && age >= 0 && age < 86400000 && req.body.refresh !== true) {
      return res.set("Cache-Control", "no-store").json({ ...publicProfile(existing), reused: true });
    }
    const updates = gstin ? await fetchGstDetails(gstin) : { gstin: "", gstBusinessName: "", gstBusinessAddress: "", gstMobile: "", gstFetchedAt: null, gstLookupProvider: "" };
    // All firm details come from the server-side lookup, never browser fields.
    const user = await User.findByIdAndUpdate(req.user.userId, { $set: updates }, { new: true, runValidators: true }).select(fields).lean();
    if (!user) throw createHttpError(404, "Account not found");
    res.set("Cache-Control", "no-store").json({ ...publicProfile(user), reused: false });
  } catch (error) { next(error); }
};
export const getMyInvoice = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw createHttpError(404, "Invoice not found");
    const filter = { _id: req.params.id, userId: req.user.userId, purpose: "SUBSCRIPTION", status: "SUCCESS", currency: "INR" };
    const invoiceFields = "invoiceNumber invoiceRecipient amount createdAt razorpayPaymentId billingPhase addOnQuantity subscriptionId checkoutBreakdown";
    let payment = await Payment.findOne(filter).select(invoiceFields).lean();
    if (!payment) throw createHttpError(404, "Invoice not found");
    if (!payment.invoiceNumber) {
      await ensurePaymentInvoice(filter);
      payment = await Payment.findOne(filter).select(invoiceFields).lean();
    }
    if (!payment?.invoiceNumber) throw createHttpError(409, "Invoice is not ready. Try again shortly");
    // Never attach today's GSTIN to an older issued invoice that lacks a snapshot.
    const legacy = !payment.invoiceRecipient;
    const user = legacy ? await User.findById(req.user.userId).select("name email").lean() : null;
    const subscription = payment.subscriptionId ? await Subscription.findOne({ _id: payment.subscriptionId, userId: req.user.userId }).select("pricingSnapshot").lean() : null;
    res.set("Cache-Control", "no-store").json({ number: payment.invoiceNumber, date: payment.createdAt,
      description: payment.billingPhase === "project_addon" ? `Additional project capacity (${payment.addOnQuantity || 1})` : "CADer subscription payment",
      amountPaise: payment.amount, paymentId: payment.razorpayPaymentId,
      breakdown: invoicePricing(payment, subscription),
      recipient: payment.invoiceRecipient || { name: user?.name || "CADer account holder", email: user?.email || "", gstin: "" },
      legacy });
  } catch (error) { next(error); }
};
