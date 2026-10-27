import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/user.js";
import { saveOnboardingGst } from "../controllers/onboardingGstController.js";

test("onboarding GST rejects unauthenticated requests before database or provider access", async t => {
  const find = t.mock.method(User, "findById", () => { throw Error("Unexpected database access"); });
  let error;
  await saveOnboardingGst({ user: { isAuthenticated: false } }, {}, value => { error = value; });
  assert.equal(error.status, 401);
  assert.equal(find.mock.callCount(), 0);
});
test("onboarding GST rejects already onboarded and missing accounts", async t => {
  let account = { type: "Professional" };
  t.mock.method(User, "findById", () => ({ select: () => ({ lean: async () => account }) }));
  for (const value of [{ type: "Professional" }, null]) {
    account = value;
    let error;
    await saveOnboardingGst({ user: { isAuthenticated: true, userId: "test" } }, {}, value => { error = value; });
    assert.equal(error.status, 403);
  }
});
test("an authenticated pending account can reuse verified GST records before onboarding", async t => {
  const account = { name: "Pending user", gstin: "32CZBPM1659R1ZW", gstBusinessName: "Registered Firm",
    gstBusinessAddress: "Registered Address", gstFetchedAt: new Date(), gstLookupProvider: "gstinapi.in" };
  t.mock.method(User, "findById", () => ({ select: () => ({ lean: async () => account }) }));
  let body;
  const response = { set() { return this; }, json(value) { body = value; return this; } };
  await saveOnboardingGst({ user: { isAuthenticated: true, userId: "pending" }, body: { gstin: account.gstin } }, response,
    error => { throw error; });
  assert.equal(body.gstin, account.gstin);
  assert.equal(body.gstBusinessName, account.gstBusinessName);
  assert.equal(body.reused, true);
});
