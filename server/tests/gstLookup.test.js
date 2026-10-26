import test from "node:test";
import assert from "node:assert/strict";
import { fetchGstDetails, normalizeGstLookup } from "../services/gstLookup.js";
import { saveMyGstProfile } from "../controllers/profileGstController.js";
import { invoiceRecipient } from "../services/gstIdentity.js";
import User from "../models/user.js";

const gstin = "27AAPFU0939F1ZV";
const result = () => ({ success: true, gstin, data: { gstin, status: "Active", legal_name: "Registered firm", address: "1 Main Street, Mumbai", city: "Mumbai", pincode: "400001", mobile: "not-a-documented-basic-field" } });
const configure = t => {
  const previous = process.env.GSTIN_API_KEY;
  process.env.GSTIN_API_KEY = "private-test-key";
  t.after(() => { if (previous === undefined) delete process.env.GSTIN_API_KEY; else process.env.GSTIN_API_KEY = previous; });
};
const response = () => ({ set() { return this; }, json(body) { this.body = body; return this; } });

test("lookup normalizes legal name/address and does not fabricate a registered mobile", () => {
  const details = normalizeGstLookup(result(), gstin);
  assert.equal(details.gstBusinessName, "Registered firm");
  assert.equal(details.gstBusinessAddress, "1 Main Street, Mumbai, 400001");
  assert.equal(details.gstMobile, "");
  assert.ok(details.gstFetchedAt instanceof Date);
  assert.equal(details.gstLookupProvider, "gstinapi.in");
  const recipient = invoiceRecipient({ name: "Account name", ...details });
  assert.equal(recipient.address, details.gstBusinessAddress);
  assert.equal(recipient.name, "Registered firm");
  assert.equal(recipient.mobile, "");
});

test("lookup rejects mismatched GSTINs, inactive registrations and incomplete records", () => {
  for (const payload of [{ ...result(), gstin: "other" }, { ...result(), success: false },
    { ...result(), data: { ...result().data, gstin: "other" } },
    { ...result(), data: { ...result().data, legal_name: null } },
    { ...result(), data: { ...result().data, address: null } }]) {
    assert.throws(() => normalizeGstLookup(payload, gstin), { status: 502 });
  }
  assert.throws(() => normalizeGstLookup({ ...result(), data: { ...result().data, status: "Cancelled" } }, gstin), { status: 400 });
});

test("provider requests keep the key server-side and concurrent identical lookups share one call", async t => {
  configure(t);
  const mock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, `https://www.gstinapi.in/v1/gstin/${gstin}`);
    assert.equal(options.headers["x-api-key"], "private-test-key");
    assert.equal(options.redirect, "error");
    return { ok: true, status: 200, json: async () => result() };
  });
  const rows = await Promise.all([fetchGstDetails(gstin), fetchGstDetails(gstin)]);
  assert.equal(mock.mock.callCount(), 1);
  assert.equal(rows[0].gstBusinessName, "Registered firm");
});

test("provider errors are actionable without exposing credentials or raw responses", async t => {
  configure(t);
  let status;
  t.mock.method(globalThis, "fetch", async () => ({ status, ok: false, json: async () => { throw Error("Must not expose provider body"); } }));
  for (const [code, expected] of [[400, 400], [401, 503], [402, 503], [403, 503], [404, 400], [429, 429], [500, 502]]) {
    status = code;
    await assert.rejects(fetchGstDetails(gstin), error => error.status === expected && !error.message.includes("private-test-key"));
  }
});

test("missing configuration and malformed GSTIN never call the provider", async t => {
  configure(t); delete process.env.GSTIN_API_KEY;
  const mock = t.mock.method(globalThis, "fetch", () => { throw Error("Unexpected request"); });
  await assert.rejects(fetchGstDetails(gstin), { status: 503 });
  await assert.rejects(fetchGstDetails("invalid"), { status: 400 });
  assert.equal(mock.mock.callCount(), 0);
});

test("outages never overwrite the account's saved firm details", async t => {
  configure(t);
  t.mock.method(User, "findById", () => ({ select: () => ({ lean: async () => ({ name: "Account name", gstin: "old" }) }) }));
  t.mock.method(globalThis, "fetch", async () => { throw Error("Timeout"); });
  const write = t.mock.method(User, "findByIdAndUpdate", () => { throw Error("Unexpected write"); });
  let error;
  await saveMyGstProfile({ user: { userId: "self" }, body: { gstin } }, response(), value => { error = value; });
  assert.equal(error.status, 502);
  assert.equal(write.mock.callCount(), 0);
});

test("recent saved lookup data is reused without consuming provider credits", async t => {
  const details = normalizeGstLookup(result(), gstin);
  t.mock.method(User, "findById", () => ({ select: () => ({ lean: async () => ({ name: "Account name", ...details }) }) }));
  const mock = t.mock.method(globalThis, "fetch", () => { throw Error("Unexpected request"); });
  const res = response();
  await saveMyGstProfile({ user: { userId: "self" }, body: { gstin } }, res, e => { throw e; });
  assert.equal(res.body.reused, true);
  assert.equal(res.body.gstBusinessName, "Registered firm");
  assert.equal(mock.mock.callCount(), 0);
});

test("removing GST details clears fetched name/address/mobile and timestamp without a provider", async t => {
  t.mock.method(User, "findById", () => ({ select: () => ({ lean: async () => ({ name: "Account name", gstin }) }) }));
  let update;
  t.mock.method(User, "findByIdAndUpdate", (id, value) => { update = value.$set; return { select: () => ({ lean: async () => ({ name: "Account name", ...update }) }) }; });
  const mock = t.mock.method(globalThis, "fetch", () => { throw Error("Unexpected request"); });
  await saveMyGstProfile({ user: { userId: "self" }, body: { gstin: "" } }, response(), e => { throw e; });
  assert.deepEqual(update, { gstin: "", gstBusinessName: "", gstBusinessAddress: "", gstMobile: "", gstFetchedAt: null, gstLookupProvider: "" });
  assert.equal(mock.mock.callCount(), 0);
});
