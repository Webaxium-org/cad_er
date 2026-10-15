export const SUBSCRIPTION_PLANS = Object.freeze({
  junior_monthly: { name: "Junior", amountPaise: 9900, interval: "monthly", projectLimit: 1 },
  executive_monthly: { name: "Executive", amountPaise: 49900, interval: "monthly", projectLimit: 6 },
  director_monthly: { name: "Director", amountPaise: 99900, interval: "monthly", projectLimit: 14 },
  professionals_yearly: { name: "Professionals", amountPaise: 599900, interval: "yearly", projectLimit: 80 },
  teams_yearly: { name: "Teams", amountPaise: 1199900, interval: "yearly", projectLimit: 200 },
});

export const publicPlans = () => Object.entries(SUBSCRIPTION_PLANS).map(([code, plan]) => ({
  code,
  name: plan.name,
  amountPaise: plan.amountPaise,
  interval: plan.interval,
  projectLimit: plan.projectLimit,
}));
