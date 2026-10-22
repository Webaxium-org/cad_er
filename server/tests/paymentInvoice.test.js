import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Payment from "../models/payments.js";
import Counter from "../models/invoiceCounter.js";
import { ensurePaymentInvoice, formatInvoiceNumber } from "../services/paymentInvoice.js";

test("invoice numbers start at one and expand beyond five digits", () => {
  assert.equal(formatInvoiceNumber(1), "INVCAD-00001");
  assert.equal(formatInvoiceNumber(2), "INVCAD-00002");
  assert.equal(formatInvoiceNumber(100000), "INVCAD-100000");
});

test("pending payments do not receive invoices, and existing invoices are reused", async t => {
  let record = { status: "CREATED" };
  t.mock.method(Payment, "findOne", () => ({ select: () => ({ lean: async () => record }) }));
  const transaction = t.mock.method(mongoose.connection, "transaction", () => { throw Error("Unexpected transaction"); });
  assert.equal(await ensurePaymentInvoice({}), undefined);
  record = { status: "SUCCESS", invoiceNumber: "INVCAD-00015" };
  assert.equal(await ensurePaymentInvoice({}), "INVCAD-00015");
  assert.equal(transaction.mock.callCount(), 0);
});

test("concurrent retries share one invoice and use the same transaction for counter and payment", async t => {
  let invoiceNumber;
  let counter = 0;
  const session = {};
  let queue = Promise.resolve();
  t.mock.method(mongoose.connection, "transaction", callback => {
    const result = queue.then(() => callback(session));
    queue = result.catch(() => {});
    return result;
  });
  t.mock.method(Payment, "findOne", () => ({ select: () => ({ lean: async () => ({ _id: "payment", status: "SUCCESS", invoiceNumber }) }) }));
  t.mock.method(Payment, "findById", () => ({ session: async passed => {
    assert.equal(passed, session);
    return { invoiceNumber, async save(options) {
      assert.equal(options.session, session);
      invoiceNumber = this.invoiceNumber;
    } };
  } }));
  t.mock.method(Counter, "findOneAndUpdate", async (filter, update, options) => {
    assert.equal(filter._id, "payments");
    assert.equal(update.$inc.value, 1);
    assert.equal(options.session, session);
    return { value: ++counter };
  });
  const numbers = await Promise.all(Array.from({ length: 10 }, () => ensurePaymentInvoice({ _id: "payment" })));
  assert.deepEqual([...new Set(numbers)], ["INVCAD-00001"]);
  assert.equal(counter, 1);
});
