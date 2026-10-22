import mongoose from "mongoose";
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
    payment.invoiceNumber = formatInvoiceNumber(counter.value);
    await payment.save({ session });
    return payment.invoiceNumber;
  });
};
