import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { hasSubscriptionAccess, reserveProjectSlot } from "../services/subscriptionAccess.js";
import { verifyHmac } from "../services/razorpay.js";
import { SUBSCRIPTION_PLANS } from "../services/subscriptionPlans.js";
import Subscription from "../models/subscription.js";

const now = new Date("2026-10-15T12:00:00.000Z");
const period = { periodStart: new Date("2026-10-01T00:00:00.000Z"), periodEnd: new Date("2026-11-01T00:00:00.000Z") };

test("trial expires at its stored end date", () => {
  assert.equal(hasSubscriptionAccess({ ...period, kind: "trial", status: "active" }, now), true);
  assert.equal(hasSubscriptionAccess({ ...period, kind: "trial", status: "active" }, period.periodEnd), false);
});

test("a checkout authorization without a paid billing period does not grant access", () => {
  assert.equal(hasSubscriptionAccess({ ...period, kind: "paid", status: "authenticated", paidCount: 0 }, now), false);
  assert.equal(hasSubscriptionAccess({ ...period, kind: "paid", status: "active", paidCount: 1 }, now), true);
  assert.equal(hasSubscriptionAccess({ ...period, kind: "paid", status: "cancelled", paidCount: 1, endedAt: now }, now), false);
});

test("Razorpay signature comparison rejects changed payloads", () => {
  const signature = crypto.createHmac("sha256", "test-secret").update("payload").digest("hex");
  assert.equal(verifyHmac("payload", signature, "test-secret"), true);
  assert.equal(verifyHmac("changed", signature, "test-secret"), false);
  assert.equal(verifyHmac("payload", "not-a-signature", "test-secret"), false);
});

test("published self-service amounts and project limits", () => {
  assert.deepEqual(Object.values(SUBSCRIPTION_PLANS).map(({ amountPaise, projectLimit }) => [amountPaise, projectLimit]), [
    [9900, 1], [49900, 6], [99900, 14], [599900, 80], [1199900, 200],
  ]);
});

test("new projects reserve a quota slot with the project transaction", async (t) => {
  const session = { id: "project-transaction" };
  const subscription = { _id: "trial-id", kind: "trial", status: "active", periodStart: new Date("2000-01-01"), periodEnd: new Date("2100-01-01"), projectCount: 4, projectLimit: 5 };
  let calls = 0;
  t.mock.method(Subscription, "findOneAndUpdate", async (filter, update, options) => {
    calls += 1;
    assert.equal(filter._id, subscription._id);
    assert.deepEqual(filter.$expr, { $lt: ["$projectCount", "$projectLimit"] });
    assert.deepEqual(update, { $inc: { projectCount: 1 } });
    assert.equal(options.session, session);
    return calls === 1 ? { ...subscription, projectCount: 5 } : null;
  });
  const req = { user: { userId: "user-id", role: "Guest" }, subscription };
  assert.equal((await reserveProjectSlot(req, session)).projectCount, 5);
  await assert.rejects(reserveProjectSlot(req, session), { statusCode: 402 });
});
