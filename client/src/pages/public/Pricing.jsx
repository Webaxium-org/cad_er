import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Paper,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import PricingCard from "../../components/PricingCard";
import { getPricingPlans } from "../../constants/pricingPlans";
import ScrollToTop from "../../components/ScrollToTop";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

// --- Icons ---

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

  const plans = getPricingPlans(billingCycle);


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
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gridAutoRows: "1fr", gap: 4, mb: 15 }}>
            {plans.map((plan, index) => (
              <Box key={plan.code || index} sx={{ minWidth: 0 }}>
                <PricingCard
                  {...plan}
                  buttonText={plan.code ? "Choose plan" : "Contact Sales"}
                  handleContactSales={() => plan.code ? handleSelectPlan(plan.code) : handleContactSales()}
                />
              </Box>
            ))}
          </Box>

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
