// Only show taxes when the saved breakdown reconciles to the captured amount.
export const invoicePricing = (payment, subscription) => {
  const candidates = [payment.checkoutBreakdown,
    ...(payment.billingPhase === "initial" ? [subscription?.pricingSnapshot?.checkout] :
      payment.billingPhase === "recurring" ? [subscription?.pricingSnapshot?.renewalCheckout, subscription?.pricingSnapshot?.checkout] : [])];
  if (payment.amount === 0) candidates.push({ basePaise: 0, cgstPaise: 0, sgstPaise: 0, gstPaise: 0, processingFeePaise: 0, totalPaise: 0 });
  return candidates.find(value => value &&
    [value.basePaise, value.cgstPaise, value.sgstPaise, value.gstPaise, value.processingFeePaise, value.totalPaise].every(n => Number.isSafeInteger(n) && n >= 0) &&
    value.cgstPaise + value.sgstPaise === value.gstPaise &&
    value.basePaise + value.gstPaise + value.processingFeePaise === value.totalPaise && value.totalPaise === payment.amount) || null;
};
