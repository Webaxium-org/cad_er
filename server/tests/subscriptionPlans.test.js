import test from "node:test";
import assert from "node:assert/strict";
import Subscription from "../models/subscription.js";
import { quotePlan, quotePlanForUser, validatePlan, renewalAmount } from "../services/subscriptionPlans.js";
import { checkoutPricing } from "../services/checkoutPricing.js";

const plan = { _id: "507f1f77bcf86cd799439011", code: "junior_monthly", version: 2,
  name: "Junior", amountPaise: 99900, firstPaymentAmountPaise: 9900,
  interval: "monthly", projectLimit: 1, available: true, highlighted: false, features: [] };

test("ongoing offer preserves first-period price unless explicitly replaced", () => {
  const keep = quotePlan({ ...plan, ongoingAmountPaise: 9000 });
  assert.deepEqual(keep.checkout, checkoutPricing(9900));
  assert.deepEqual(keep.renewalCheckout, checkoutPricing(9000));
  const replace = quotePlan({ ...plan, ongoingAmountPaise: 9000, ongoingOfferAppliesToFirstPeriod: true });
  assert.deepEqual(replace.checkout, checkoutPricing(9000));
  assert.deepEqual(replace.renewalCheckout, checkoutPricing(9000));
  assert.notEqual(keep.quoteKey, replace.quoteKey);
});

test("ongoing offer without a first-period offer applies from the first period", () => {
  const quote = quotePlan({ ...plan, firstPaymentAmountPaise: null, ongoingAmountPaise: 9000 });
  assert.equal(quote.firstPaymentAmountPaise, null);
  assert.deepEqual(quote.checkout, quote.renewalCheckout);
  assert.equal(quote.checkout.basePaise, 9000);
});

test("returning customers retain ongoing pricing without receiving the first-period offer again", async t => {
  t.mock.method(Subscription, "exists", async () => true);
  const quote = await quotePlanForUser({ ...plan, ongoingAmountPaise: 9000 }, "user");
  assert.equal(quote.firstPaymentAmountPaise, null);
  assert.equal(quote.checkout.basePaise, 9000);
  assert.equal(quote.renewalCheckout.basePaise, 9000);
});

test("old pricing remains unchanged and purchased ongoing amounts stay fixed", () => {
  const legacy = quotePlan(plan);
  assert.equal(legacy.checkout.basePaise, 9900);
  assert.equal(legacy.renewalCheckout.basePaise, 99900);
  const purchased = quotePlan({ ...plan, ongoingAmountPaise: 9000 });
  const subscription = { pricingSnapshot: purchased, amountPaise: purchased.renewalCheckout.totalPaise, paidCount: 20 };
  const changed = quotePlan({ ...plan, version: 3, ongoingAmountPaise: 8000 });
  assert.notEqual(changed.quoteKey, purchased.quoteKey);
  assert.equal(renewalAmount(subscription), checkoutPricing(9000).totalPaise);
});

test("publication validates ongoing price and checkbox without overwriting original introductory pricing", () => {
  const fields = validatePlan({ ...plan, ongoingAmountPaise: 9000, ongoingOfferAppliesToFirstPeriod: true });
  assert.equal(fields.firstPaymentAmountPaise, 9900);
  assert.equal(fields.ongoingAmountPaise, 9000);
  for (const invalid of [0, -1, 1.5, "9000", 100000]) {
    assert.throws(() => validatePlan({ ...plan, ongoingAmountPaise: invalid }), { status: 400 });
  }
  assert.throws(() => validatePlan({ ...plan, ongoingOfferAppliesToFirstPeriod: true }), { status: 400 });
  assert.throws(() => validatePlan({ ...plan, ongoingAmountPaise: 9000, ongoingOfferAppliesToFirstPeriod: "false" }), { status: 400 });
  assert.equal(validatePlan(plan).ongoingAmountPaise, null);
});
