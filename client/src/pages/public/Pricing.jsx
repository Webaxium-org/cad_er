import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Grid,
  Paper,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { motion } from "framer-motion";
import ScrollToTop from "../../components/ScrollToTop";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

// --- Icons ---
const CheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#6366f1"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const PricingCard = ({
  tier,
  price,
  introductoryPrice,
  discountLabel,
  duration,
  includes,
  features,
  highlighted = false,
  buttonText = "Contact Sales",
  handleContactSales,
}) => (
  <motion.div
    whileHover={{ y: -10 }}
    transition={{ type: "spring", stiffness: 300 }}
    style={{ height: "100%" }}
  >
    <Paper
      elevation={0}
      sx={{
        p: 5,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 6,
        border: "1px solid",
        borderColor: highlighted ? "#6366f1" : "rgba(0,0,0,0.08)",
        bgcolor: highlighted ? "#fff" : "rgba(255,255,255,0.6)",
        position: "relative",
        overflow: "hidden",
        boxShadow: highlighted
          ? "0 30px 60px rgba(99, 102, 241, 0.15)"
          : "none",
      }}
    >
      {highlighted && (
        <Box
          sx={{
            position: "absolute",
            top: 20,
            right: -35,
            bgcolor: "#6366f1",
            color: "white",
            px: 6,
            py: 0.5,
            transform: "rotate(45deg)",
            fontSize: "0.75rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Most Popular
        </Box>
      )}

      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "#111" }}>
        {tier}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          mb: introductoryPrice && introductoryPrice !== price ? 0.5 : 3,
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 800, color: "#000" }}>
          {(introductoryPrice || price) === "Custom"
            ? "Custom"
            : `₹${introductoryPrice || price}`}
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", ml: 1 }}>
          /{duration}
        </Typography>
      </Box>

      {introductoryPrice &&
        introductoryPrice !== price &&
        introductoryPrice !== "Custom" &&
        price !== "Custom" && (
          <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", textDecoration: "line-through" }}
            >
              ₹{price}/{duration}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#10b981",
                fontWeight: 700,
                bgcolor: "rgba(16, 185, 129, 0.1)",
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: "0.75rem",
              }}
            >
              {discountLabel || "Launch Price"}
            </Typography>
          </Box>
        )}

      {includes && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#4f46e5" }}
          >
            {includes}
          </Typography>
        </Box>
      )}

      <Stack spacing={2} sx={{ mb: 5, flexGrow: 1 }}>
        {features.map((feature, index) => (
          <Box
            key={index}
            sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
          >
            <CheckIcon />
            <Typography variant="body2" sx={{ color: "#444", fontWeight: 500 }}>
              {feature}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Button
        variant={highlighted ? "contained" : "outlined"}
        fullWidth
        sx={{
          py: 1.5,
          borderRadius: 3,
          textTransform: "none",
          fontWeight: 700,
          fontSize: "1rem",
          bgcolor: highlighted ? "#6366f1" : "transparent",
          color: highlighted ? "#fff" : "#111",
          borderColor: highlighted ? "#6366f1" : "rgba(0,0,0,0.2)",
          "&:hover": {
            bgcolor: highlighted ? "#4f46e5" : "rgba(0,0,0,0.05)",
            borderColor: highlighted ? "#4f46e5" : "#000",
          },
        }}
        onClick={handleContactSales}
      >
        {buttonText}
      </Button>
    </Paper>
  </motion.div>
);

const FAQItem = ({ question, answer }) => (
  <Accordion
    elevation={0}
    disableGutters
    sx={{
      bgcolor: "transparent",
      "&:before": { display: "none" },
      borderBottom: "1px solid rgba(0,0,0,0.06)",
    }}
  >
    <AccordionSummary expandIcon={<ChevronDownIcon />} sx={{ px: 0, py: 1 }}>
      <Typography sx={{ fontWeight: 700, color: "#111" }}>
        {question}
      </Typography>
    </AccordionSummary>
    <AccordionDetails sx={{ px: 0, pb: 3 }}>
      <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
        {answer}
      </Typography>
    </AccordionDetails>
  </Accordion>
);

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState("monthly");

  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const handleContactSales = () => {
    if (user?.type === "Professional") navigate("/subscription");
    else navigate("/", { state: { target: "schedule demo" } });
  };
  const handleSelectPlan = (planCode) => {
    if (user?.type === "Professional") navigate("/subscription", { state: { planCode } });
    else navigate("/register");
  };

  const plans = [
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

  return (
    <>
      <ScrollToTop />
      <Box
        sx={{ bgcolor: "#fcfcfd", minHeight: "100vh", py: { xs: 8, md: 12 } }}
      >
        <Container maxWidth="lg">
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 10 }}>
            <Typography
              sx={{
                color: "#6366f1",
                fontWeight: 800,
                letterSpacing: 1.5,
                fontSize: "0.9rem",
                textTransform: "uppercase",
                mb: 2,
              }}
            >
              Pricing Plans
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                fontWeight: 900,
                mb: 3,
                color: "#000",
                letterSpacing: "-0.02em",
              }}
            >
              Pricing for every stage <br /> of your career.
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="center"
              sx={{ mt: 4 }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  color: billingCycle === "monthly" ? "#000" : "text.secondary",
                }}
              >
                Monthly
              </Typography>
              <Switch
                checked={billingCycle === "yearly"}
                onChange={() =>
                  setBillingCycle(
                    billingCycle === "monthly" ? "yearly" : "monthly",
                  )
                }
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#6366f1" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#6366f1",
                  },
                }}
              />
              <Typography
                sx={{
                  fontWeight: 600,
                  color: billingCycle === "yearly" ? "#000" : "text.secondary",
                }}
              >
                Yearly
              </Typography>
            </Stack>
          </Box>

          {/* Cards */}
          <Grid container spacing={4} sx={{ mb: 15 }}>
            {plans.map((plan, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <PricingCard
                  {...plan}
                  buttonText={plan.code ? "Choose plan" : "Contact Sales"}
                  handleContactSales={() => plan.code ? handleSelectPlan(plan.code) : handleContactSales()}
                />
              </Grid>
            ))}
          </Grid>

          {/* FAQ Section */}
          <Box sx={{ maxWidth: 800, mx: "auto" }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, mb: 6, textAlign: "center" }}
            >
              Frequently Asked Questions
            </Typography>
            <Stack spacing={1}>
              <FAQItem
                question="Can I upgrade or downgrade my plan later?"
                answer="You can cancel renewal and choose a different plan when your current paid period ends. Prorated plan changes are not available yet."
              />
              <FAQItem
                question="Is there a free trial available?"
                answer="Professional accounts include a 30-day free trial. A subscription is required to continue using CADer after the trial ends."
              />
              <FAQItem
                question="Do you offer discounts for educational institutions?"
                answer="Absolutely. We have special pricing for universities and non-profit organizations. Contact our sales team to learn more about our Academic Partnership program."
              />
              <FAQItem
                question="What happens to my data if I cancel?"
                answer="Cancellation stops renewal at the end of your current paid period. Your projects stay stored, but survey access requires an active subscription."
              />
            </Stack>
          </Box>

          {/* Final CTA */}
          <Paper
            elevation={0}
            sx={{
              mt: 15,
              p: { xs: 4, md: 8 },
              bgcolor: "#000",
              color: "#fff",
              borderRadius: 8,
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              Still have questions?
            </Typography>
            <Typography
              sx={{
                opacity: 0.7,
                mb: 4,
                maxWidth: 600,
                mx: "auto",
                fontSize: "1.1rem",
              }}
            >
              Our team is here to help you find the right plan for your specific
              surveying and CAD needs.
            </Typography>
            <Button
              variant="contained"
              sx={{
                bgcolor: "#fff",
                color: "#000",
                px: 6,
                py: 2,
                borderRadius: 3,
                fontWeight: 800,
                fontSize: "1rem",
                textTransform: "none",
                "&:hover": { bgcolor: "#f0f0f0" },
              }}
              onClick={() => navigate("/", { state: { target: "contact" } })}
            >
              Chat with an Expert
            </Button>
          </Paper>
        </Container>
      </Box>
    </>
  );
};

export default Pricing;
