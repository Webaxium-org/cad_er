import test from "node:test";
import assert from "node:assert/strict";
import { subscriptionPaymentSavings } from "../services/subscriptionSavings.js";
import { checkoutPricing } from "../services/checkoutPricing.js";

const payment = (basePaise, phase = "initial") => ({
  status: "SUCCESS", purpose: "SUBSCRIPTION", currency: "INR", billingPhase: phase,
  amount: checkoutPricing(basePaise).totalPaise, checkoutBreakdown: checkoutPricing(basePaise),
  subscriptionId: { pricingSnapshot: { amountPaise: 99900 } },
});

test("INR 999 plan bought for INR 99 saves INR 900, excluding taxes and fees", () => {
  assert.equal(subscriptionPaymentSavings(payment(9900)), 90000);
});
test("savings add up across paid periods and ongoing offers", () => {
  const records = [payment(9900), payment(9000, "recurring"), payment(99900, "recurring")];
  assert.equal(records.reduce((total, row) => total + subscriptionPaymentSavings(row), 0), 180900);
});
test("failed, unpaid, add-on, refunded, foreign and synthetic payments do not count", () => {
  for (const changes of [{ status: "FAILED" }, { status: "CREATED" }, { billingPhase: "project_addon" },
    { purpose: "COURSE_PURCHASE" }, { currency: "USD" }, { amount: 0 },
    { razorpayPaymentId: "test_manual_example" }, { subscriptionId: { initialRevokedAt: new Date() } }]) {
    assert.equal(subscriptionPaymentSavings({ ...payment(9900), ...changes }), 0);
  }
});
test("saved purchase pricing works without payment breakdown and ignores later catalog edits", () => {
  const row = payment(9900);
  delete row.checkoutBreakdown;
  row.subscriptionId.pricingSnapshot.checkout = checkoutPricing(9900);
  row.planVersionId = { amountPaise: 123400 };
  assert.equal(subscriptionPaymentSavings(row), 90000);
});
test("unverifiable prices are skipped and higher prices never create negative savings", () => {
  assert.equal(subscriptionPaymentSavings({ ...payment(9900), amount: 123 }), 0);
  assert.equal(subscriptionPaymentSavings({ ...payment(9900), subscriptionId: null }), 0);
  assert.equal(subscriptionPaymentSavings(payment(100000)), 0);
  const row = { ...payment(9900), subscriptionId: null, planVersionId: { amountPaise: 99900 } };
  assert.equal(subscriptionPaymentSavings(row), 90000);
});
