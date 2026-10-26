import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/user.js";
import Payment from "../models/payments.js";
import { validGstin, validateGstProfile, invoiceRecipient } from "../services/gstIdentity.js";
import { saveMyGstProfile, getMyInvoice } from "../controllers/profileGstController.js";

const res = () => ({ set() { return this; }, json(value) { this.body = value; return this; } });
const user = { name: "CADer user", email: "user@example.com", gstin: "27AAPFU0939F1ZV", gstBusinessName: "Example firm" };

test("optional GSTIN is normalized and validated, including its check digit", () => {
  assert.equal(validGstin(user.gstin), true);
  assert.deepEqual(validateGstProfile({ gstin: " 27aapfu0939f1zv ", gstBusinessName: " Example firm " }), { gstin: user.gstin });
  assert.throws(() => validateGstProfile({ gstin: "27AAPFU0939F1ZA", gstBusinessName: "" }), /GSTIN/);
  assert.throws(() => validateGstProfile({ gstin: { $ne: null }, gstBusinessName: "" }), /text/);
  assert.deepEqual(validateGstProfile({ gstin: user.gstin, gstBusinessName: "ignored" }), { gstin: user.gstin });
  assert.deepEqual(validateGstProfile({ gstin: " ", gstBusinessName: "Old firm" }), { gstin: "" });
});

test("recipient uses the business name with GST and falls back to the CADer name", () => {
  assert.equal(invoiceRecipient(user).name, "Example firm");
  assert.equal(invoiceRecipient({ ...user, gstin: "" }).name, "CADer user");
  assert.equal(invoiceRecipient({ ...user, gstBusinessName: "" }).name, "CADer user");
  const original = invoiceRecipient(user);
  const changed = { ...user, name: "Edited user", gstin: "", gstBusinessName: "" };
  assert.equal(original.gstin, user.gstin);
  assert.equal(original.name, "Example firm");
  assert.equal(invoiceRecipient(changed).name, "Edited user");
});

test("profile save fetches firm details server-side and only updates the authenticated account", async t => {
  const oldKey = process.env.GSTIN_API_KEY;
  process.env.GSTIN_API_KEY = "test-key";
  t.after(() => { if (oldKey === undefined) delete process.env.GSTIN_API_KEY; else process.env.GSTIN_API_KEY = oldKey; });
  t.mock.method(User, "findById", () => ({ select: () => ({ lean: async () => user }) }));
  t.mock.method(globalThis, "fetch", async () => ({ ok: true, status: 200, json: async () => ({ success: true, gstin: user.gstin, data: { gstin: user.gstin, legal_name: "Fetched firm", status: "Active", address: "Fetched address" } }) }));
  let target, update;
  t.mock.method(User, "findByIdAndUpdate", (id, fields, options) => {
    target = id; update = fields;
    assert.equal(options.runValidators, true);
    return { select: () => ({ lean: async () => ({ ...user, ...fields.$set }) }) };
  });
  const response = res();
  await saveMyGstProfile({ user: { userId: "self" }, body: { ...user, userId: "other", role: "Super Admin", gstBusinessName: "Forged firm", gstBusinessAddress: "Forged address", gstMobile: "1234567890" } }, response, error => { throw error; });
  assert.equal(target, "self");
  assert.equal(update.$set.gstBusinessName, "Fetched firm");
  assert.equal(update.$set.gstBusinessAddress, "Fetched address");
  assert.equal(update.$set.gstMobile, "");
  assert.equal(update.$set.role, undefined);
  assert.equal(response.body.gstLookupProvider, "gstinapi.in");
  assert.ok(response.body.gstFetchedAt instanceof Date);
});

test("invalid GSTIN is rejected before any account update", async t => {
  const write = t.mock.method(User, "findByIdAndUpdate", () => { throw Error("Unexpected write"); });
  let error;
  await saveMyGstProfile({ user: { userId: "self" }, body: { gstin: "invalid", gstBusinessName: "" } }, res(), e => { error = e; });
  assert.equal(error.status, 400);
  assert.equal(write.mock.callCount(), 0);
});

test("invoice endpoint enforces ownership and successful subscription payment", async t => {
  let filter;
  t.mock.method(Payment, "findOne", value => { filter = value; return { select: () => ({ lean: async () => null }) }; });
  let error;
  await getMyInvoice({ user: { userId: "self" }, params: { id: "012345678901234567890123" } }, res(), e => { error = e; });
  assert.equal(error.status, 404);
  assert.equal(filter.userId, "self");
  assert.equal(filter.status, "SUCCESS");
  assert.equal(filter.purpose, "SUBSCRIPTION");
});

test("issued invoices use their frozen recipient without reading today's profile", async t => {
  const saved = invoiceRecipient(user);
  t.mock.method(Payment, "findOne", () => ({ select: () => ({ lean: async () => ({ invoiceNumber: "INVCAD-00001", invoiceRecipient: saved, amount: 11916, createdAt: new Date(), razorpayPaymentId: "pay_1" }) }) }));
  const profile = t.mock.method(User, "findById", () => { throw Error("Must not read current profile"); });
  const response = res();
  await getMyInvoice({ user: { userId: "self" }, params: { id: "012345678901234567890123" } }, response, e => { throw e; });
  assert.deepEqual(response.body.recipient, saved);
  assert.equal(response.body.legacy, false);
  assert.equal(profile.mock.callCount(), 0);
});

test("older invoices never inherit a GSTIN added after issue", async t => {
  t.mock.method(Payment, "findOne", () => ({ select: () => ({ lean: async () => ({ invoiceNumber: "INVCAD-00001", amount: 11916, createdAt: new Date(), razorpayPaymentId: "pay_1" }) }) }));
  t.mock.method(User, "findById", () => ({ select: () => ({ lean: async () => user }) }));
  const response = res();
  await getMyInvoice({ user: { userId: "self" }, params: { id: "012345678901234567890123" } }, response, e => { throw e; });
  assert.equal(response.body.recipient.gstin, "");
  assert.equal(response.body.recipient.name, user.name);
  assert.equal(response.body.legacy, true);
});
