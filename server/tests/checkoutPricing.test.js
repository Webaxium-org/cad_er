import test from "node:test";
import assert from "node:assert/strict";
import { checkoutPricing } from "../services/checkoutPricing.js";

test("checkout separates taxes and invoice total from processing fees", () => {
  assert.deepEqual(checkoutPricing(9900), {
    basePaise: 9900, gstPaise: 1782, cgstPaise: 891, sgstPaise: 891,
    invoiceTotalPaise: 11682, processingFeePaise: 234, totalPaise: 11916,
  });
});

test("tax rounding preserves every paise and existing checkout charges", () => {
  for (const base of [0, 3, 99, 1999, 9900, 990000, 4500000]) {
    const quote = checkoutPricing(base);
    assert.equal(quote.cgstPaise + quote.sgstPaise, quote.gstPaise);
    assert.ok(Math.abs(quote.cgstPaise - quote.sgstPaise) <= 1);
    assert.equal(quote.invoiceTotalPaise, base + Math.round(base * .18));
    assert.equal(quote.totalPaise, quote.invoiceTotalPaise + quote.processingFeePaise);
    assert.equal(quote.processingFeePaise, Math.round(quote.invoiceTotalPaise * .02));
  }
});
