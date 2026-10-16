export const offerTerms = (plan) => {
  if (!plan) return "";
  const regular = `₹${(plan.amountPaise / 100).toLocaleString("en-IN")}/${plan.interval === "monthly" ? "month" : "year"}`;
  if (plan.firstPaymentAmountPaise != null) return `₹${(plan.firstPaymentAmountPaise / 100).toLocaleString("en-IN")} for the first ${plan.interval === "monthly" ? "month" : "year"}, then ${regular}. First purchase of this plan only. Pay for your first period, then authorize auto pay for renewals.`;
  if (!plan.offer) return `${regular}, billed automatically until cancelled.`;
  const { amountPaise, cycles, paymentMethod } = plan.offer;
  return `₹${(amountPaise / 100).toLocaleString("en-IN")} for ${cycles === 1 ? "the first billing cycle" : `each of the first ${cycles} billing cycles`}, then ${regular}. Offer applies to ${paymentMethod === "upi" ? "UPI" : "eligible cards"}.`;
};

export const getPricingPlans = (billingCycle, plans = []) => [
  ...plans.filter(p => p.interval === billingCycle).map(p => ({
    ...p, tier: p.name, price: String(p.amountPaise / 100),
    introductoryPrice: p.firstPaymentAmountPaise != null ? String(p.firstPaymentAmountPaise / 100) : p.offer ? String(p.offer.amountPaise / 100) : undefined,
    discountLabel: p.firstPaymentAmountPaise != null ? `First ${billingCycle === "monthly" ? "month" : "year"} price` : p.offer ? `${p.offer.cycles === 1 ? "First cycle" : `First ${p.offer.cycles} cycles`} offer` : undefined,
    duration: billingCycle === "monthly" ? "mo" : "yr",
    renewalText: offerTerms(p),
    features: [`${p.projectLimit} new project${p.projectLimit === 1 ? "" : "s"} / ${billingCycle === "monthly" ? "month" : "year"}`, ...p.features],
  })),
  ...(billingCycle === "yearly" ? [{ tier: "Institutions & Enterprise", code: null, price: "Custom", duration: "yr",
    features: ["Custom project capacity", "Multi-user access", "Dedicated account manager", "Custom feature development"],
  }] : []),
];
