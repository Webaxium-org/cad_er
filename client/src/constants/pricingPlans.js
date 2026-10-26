const formatAmount = paise => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const previousTier = {
  executive_monthly: "Junior",
  director_monthly: "Executive",
  teams_yearly: "Engineer",
};

export const firstPeriodPrice = plan => plan.ongoingAmountPaise != null && plan.ongoingOfferAppliesToFirstPeriod
  ? plan.ongoingAmountPaise : plan.firstPaymentAmountPaise ?? plan.ongoingAmountPaise ?? plan.amountPaise;

export const offerTerms = (plan) => {
  if (!plan) return "";
  if (plan.ongoingAmountPaise != null) {
    const interval = plan.interval === "monthly" ? "month" : "year";
    const first = firstPeriodPrice(plan);
    const ongoing = `${formatAmount(plan.ongoingAmountPaise)}/${interval}`;
    return first === plan.ongoingAmountPaise
      ? `${ongoing} from the first ${interval}, until cancelled.`
      : `First ${interval} offer: ${formatAmount(first)}. Then ${ongoing}, until cancelled.`;
  }
  const regular = `${formatAmount(plan.amountPaise)}/${plan.interval === "monthly" ? "month" : "year"}`;
  if (plan.firstPaymentAmountPaise != null) return `First ${plan.interval === "monthly" ? "month" : "year"} offer: ${formatAmount(plan.firstPaymentAmountPaise)}. Then ${regular}.`;
  if (!plan.offer) return `${regular}, billed until cancelled.`;
  const { amountPaise, cycles, paymentMethod } = plan.offer;
  return `${formatAmount(amountPaise)} for ${cycles === 1 ? "the first billing cycle" : `each of the first ${cycles} billing cycles`}, then ${regular}. Offer applies to ${paymentMethod === "upi" ? "UPI" : "eligible cards"}.`;
};

export const getPricingPlans = (billingCycle, plans = []) => [
  ...plans.filter(p => p.interval === billingCycle).map(p => ({
    ...p, tier: p.name, price: String(p.amountPaise / 100),
    introductoryPrice: p.firstPaymentAmountPaise != null || p.ongoingAmountPaise != null || p.offer ? String((p.firstPaymentAmountPaise != null || p.ongoingAmountPaise != null ? firstPeriodPrice(p) : p.offer.amountPaise) / 100) : undefined,
    discountLabel: p.ongoingAmountPaise != null && firstPeriodPrice(p) === p.ongoingAmountPaise ? "Ongoing offer" : p.firstPaymentAmountPaise != null ? `First ${billingCycle === "monthly" ? "month" : "year"} offer` : p.offer ? `${p.offer.cycles === 1 ? "First cycle" : `First ${p.offer.cycles} cycles`} offer` : undefined,
    duration: billingCycle === "monthly" ? "mo" : "yr",
    renewalText: offerTerms(p),
    includesTier: previousTier[p.code],
    features: [`${p.projectLimit} new project${p.projectLimit === 1 ? "" : "s"} / ${billingCycle === "monthly" ? "month" : "year"}`, ...p.features],
  })),
  ...(billingCycle === "yearly" ? [{ tier: "Institutions & Enterprise", code: null, price: "Custom", duration: "yr",
    includesTier: "Proprietor",
    features: ["Custom project capacity", "Multi-user access", "Dedicated account manager", "Custom feature development"],
  }] : []),
];
