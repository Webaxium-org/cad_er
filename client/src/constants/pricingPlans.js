export const getPricingPlans = (billingCycle) => [
    {
      tier: billingCycle === "monthly" ? "Junior" : "Professionals",
      code: billingCycle === "monthly" ? "junior_monthly" : "professionals_yearly",
      price: billingCycle === "monthly" ? "999" : "19999",
      introductoryPrice: billingCycle === "monthly" ? "99" : "5999",
      discountLabel: billingCycle === "monthly" ? "90% off" : "70% off",
      duration: billingCycle === "monthly" ? "mo" : "yr",
      features: [
        billingCycle === "monthly" ? "1 new project / month" : "80 new projects / year",
        "Single user access",
        "Priority email support",
        "Export to .pdf, .csv, .dwg, .xlsx formats",
        "Use anywhere (mobile / tablet / desktop)",
        "Cloud storage",
        ...(billingCycle === "yearly"
          ? [
              "Auto level calibration check",
              "Use anywhere (mobile / tablet / desktop)",
            ]
          : []),
      ],
    },
    ...(billingCycle === "yearly"
      ? [{
          tier: "Teams",
          code: "teams_yearly",
          price: "49999",
          introductoryPrice: "11999",
          discountLabel: "76% off",
          duration: "yr",
          highlighted: true,
          includes: "All features of Professionals",
          features: ["200 new projects / year"],
        }]
      : []),
    ...(billingCycle === "monthly"
      ? [{
          tier: "Executive",
          code: "executive_monthly",
          price: "4999",
          introductoryPrice: "499",
          discountLabel: "90% off",
          highlighted: true,
          duration: "mo",
          includes: "All features of Junior",
          features: ["6 new projects / month"],
        }]
      : []),
    {
      tier: billingCycle === "monthly" ? "Director" : "Institutions & Enterprise",
      code: billingCycle === "monthly" ? "director_monthly" : null,
      price: billingCycle === "monthly" ? "9999" : "Custom",
      introductoryPrice: billingCycle === "monthly" ? "999" : "Custom",
      discountLabel: billingCycle === "monthly" ? "90% off" : undefined,
      duration: billingCycle === "monthly" ? "mo" : "yr",
      includes: `All features of ${
        billingCycle === "monthly" ? "Executive" : "Teams"
      }`,
      features: [
        billingCycle === "monthly" ? "14 new projects / month" : "Custom project capacity",
        ...(billingCycle === "yearly"
          ? [
              "Multi-user access",
              "Strategic upskilling",
              "Certification",
              "Loyalty privileges",
              "Digital portfolio",
              "Community access",
              "Dedicated account manager",
              "Custom feature development",
              "On-site training",
            ]
          : []),
      ],
    },
  ];
