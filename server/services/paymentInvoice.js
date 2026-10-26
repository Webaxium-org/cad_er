import mongoose from "mongoose";
import User from "../models/user.js";
import { invoiceRecipient } from "./gstIdentity.js";
import Payment from "../models/payments.js";
import InvoiceCounter from "../models/invoiceCounter.js";

export const formatInvoiceNumber = value => `INVCAD-${String(value).padStart(5, "0")}`;

// The counter and payment update commit together. Duplicate webhook deliveries
// and concurrent requests reuse the same invoice without consuming a number.
export const ensurePaymentInvoice = async filter => {
  const existing = await Payment.findOne(filter).select("invoiceNumber status").lean();
  if (!existing || existing.status !== "SUCCESS" || existing.invoiceNumber) return existing?.invoiceNumber;
  return mongoose.connection.transaction(async session => {
    const payment = await Payment.findById(existing._id).session(session);
    if (payment.invoiceNumber) return payment.invoiceNumber;
    const counter = await InvoiceCounter.findOneAndUpdate(
      { _id: "payments" }, { $inc: { value: 1 } }, { new: true, session },
    );
    if (!counter) throw new Error("Invoice counter is not initialized");
    const user = await User.findById(payment.userId).select("name email gstin gstBusinessName gstBusinessAddress gstMobile").session(session).lean();
    if (!user) throw new Error("Invoice recipient account not found");
    payment.invoiceRecipient = invoiceRecipient(user);
    payment.invoiceNumber = formatInvoiceNumber(counter.value);
    await payment.save({ session });
    return payment.invoiceNumber;
  });
};
