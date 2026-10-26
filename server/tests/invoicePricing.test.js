import test from "node:test";
import assert from "node:assert/strict";
import { invoicePricing } from "../services/invoicePricing.js";
import { checkoutPricing } from "../services/checkoutPricing.js";

test("invoice uses the purchased price and includes processing fees", () => {
  const checkout = checkoutPricing(9900);
  assert.deepEqual(invoicePricing({ amount: checkout.totalPaise, billingPhase: "initial" }, { pricingSnapshot: { checkout } }), checkout);
  assert.equal(checkout.cgstPaise + checkout.sgstPaise, checkout.gstPaise);
});
test("unmatched or inconsistent historical prices are not presented as tax", () => {
  const checkout = checkoutPricing(9900);
  assert.equal(invoicePricing({ amount: 123, billingPhase: "initial" }, { pricingSnapshot: { checkout } }), null);
  assert.equal(invoicePricing({ amount: checkout.totalPaise, checkoutBreakdown: { ...checkout, cgstPaise: 1 } }), null);
});
test("saved add-on breakdowns and free test grants reconcile", () => {
  const checkoutBreakdown = checkoutPricing(19800);
  assert.deepEqual(invoicePricing({ amount: checkoutBreakdown.totalPaise, checkoutBreakdown, billingPhase: "project_addon" }), checkoutBreakdown);
  assert.equal(invoicePricing({ amount: 0 }).cgstPaise, 0);
});
