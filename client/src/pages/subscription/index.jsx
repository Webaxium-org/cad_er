import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Alert, Box, Button, Container, Grid, LinearProgress, Paper, Stack, Switch, Typography } from "@mui/material";
import AppHeader from "../../components/AppHeader";
import { cancelSubscription, createSubscriptionCheckout, getSubscription, getSubscriptionPlans, loadRazorpayCheckout, verifySubscriptionCheckout } from "../../services/subscriptionServices";

const money = (paise) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
const date = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const accent = "#4f46e5";
const planDetails = {
  junior_monthly: { original: 999, discount: "90% off", features: ["Single user access", "Priority email support", "PDF, CSV, DWG and XLSX exports", "Cloud storage"] },
  executive_monthly: { original: 4999, discount: "90% off", includes: "Everything in Junior" },
  director_monthly: { original: 9999, discount: "90% off", includes: "Everything in Executive" },
  professionals_yearly: { original: 19999, discount: "70% off", features: ["Single user access", "Priority email support", "PDF, CSV, DWG and XLSX exports", "Cloud storage", "Auto level calibration check"] },
  teams_yearly: { original: 49999, discount: "76% off", includes: "Everything in Professionals" },
};
const CheckIcon = () => <Box component="span" aria-hidden="true" sx={{ color: accent, fontWeight: 900, fontSize: 20, lineHeight: 1 }}>✓</Box>;

export default function SubscriptionPage() {
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { state } = useLocation();
  const [plans, setPlans] = useState([]);
  const [account, setAccount] = useState(null);
  const [billingCycle, setBillingCycle] = useState(state?.planCode?.endsWith("_yearly") ? "yearly" : "monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const [{ data: planData }, { data: accountData }] = await Promise.all([getSubscriptionPlans(), getSubscription()]);
    setPlans(planData.plans);
    setAccount(accountData);
  }, []);

  useEffect(() => { refresh().catch(() => setError("Subscription details could not be loaded.")); }, [refresh]);

  const choosePlan = async (plan) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const Razorpay = await loadRazorpayCheckout();
      const { data } = await createSubscriptionCheckout(plan.code);
      const checkout = new Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "CADer",
        description: `${plan.name} ${plan.interval} subscription`,
        prefill: { name: user.name, email: user.email, contact: user.phone || undefined },
        theme: { color: "#4f46e5" },
        handler: async (response) => {
          try {
            const { data: confirmation } = await verifySubscriptionCheckout(response);
            await refresh();
            setNotice(confirmation.hasAccess ? "Subscription activated." : "Payment authorization received. Access will update when the first charge is confirmed.");
          } catch (paymentError) {
            setError(paymentError.response?.data?.message || "Payment confirmation failed. Contact support before trying again.");
          } finally { setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.on("payment.failed", () => { setError("Payment failed. Please try again."); setBusy(false); });
      checkout.open();
    } catch (checkoutError) {
      setError(checkoutError.response?.data?.message || checkoutError.message || "Checkout could not be started.");
      setBusy(false);
    }
  };

  const cancel = async (isPending = false) => {
    if (!window.confirm(isPending ? "Cancel this pending checkout?" : "Cancel renewal at the end of the current billing period?")) return;
    setBusy(true);
    setError("");
    try { await cancelSubscription(); await refresh(); setNotice(isPending ? "Pending checkout cancelled." : "Renewal cancelled. Your paid access continues until the current period ends."); }
    catch (cancelError) { setError(cancelError.response?.data?.message || "Cancellation failed."); }
    finally { setBusy(false); }
  };

  const subscription = account?.subscription;
  const activePaid = subscription?.kind === "paid" && account?.hasAccess;
  const selectedPlan = plans.find((plan) => plan.code === subscription?.planCode);
  const usage = subscription?.projectLimit ? Math.min(100, subscription.projectCount / subscription.projectLimit * 100) : 0;
  const visiblePlans = plans.filter((plan) => plan.interval === billingCycle);

  return <>
    <AppHeader />
    <Box sx={{ minHeight: "100vh", bgcolor: "#fcfcfd", pb: { xs: 8, md: 14 } }}>
      <Box sx={{ color: "white", pt: { xs: 7, md: 9 }, pb: { xs: 12, md: 14 }, background: "linear-gradient(120deg, #4338ca 0%, #4f46e5 55%, #6366f1 100%)" }}>
        <Container maxWidth="lg">
          <Typography sx={{ fontWeight: 800, letterSpacing: 2, fontSize: 13, textTransform: "uppercase", opacity: .8, mb: 1.5 }}>Your subscription</Typography>
          <Typography component="h1" sx={{ fontSize: { xs: "2.35rem", md: "3.5rem" }, fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.12, maxWidth: 760 }}>A plan for every stage of your surveying work.</Typography>
          <Typography sx={{ mt: 2, opacity: .85, fontSize: { xs: 16, md: 18 }, maxWidth: 650 }}>Choose the project capacity you need. Your account and projects stay together as you move between periods.</Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ position: "relative", mt: -7 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {notice && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{notice}</Alert>}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 5, border: "1px solid #e0e7ff", boxShadow: "0 24px 65px rgba(67,56,202,.12)", mb: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={3}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: accent, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", fontSize: 12 }}>Current account</Typography>
              <Typography variant="h5" sx={{ fontWeight: 850, mt: .5 }}>{subscription?.kind === "trial" ? "30-day free trial" : selectedPlan?.name || (subscription?.planCode ? subscription.planCode.replaceAll("_", " ") : "Loading your plan")}</Typography>
              <Typography color="text.secondary" sx={{ mt: .5 }}>{account?.hasAccess ? `Access through ${date(subscription.periodEnd)}` : "Choose a plan to continue using CADer."}{subscription?.cancelAtPeriodEnd && " Renewal is cancelled."}</Typography>
              {subscription && <Box sx={{ maxWidth: 450, mt: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}><Typography variant="body2" fontWeight={700}>New projects used</Typography><Typography variant="body2" fontWeight={800} color={accent}>{subscription.projectCount} / {subscription.projectLimit}</Typography></Stack>
                <LinearProgress variant="determinate" value={usage} sx={{ height: 8, borderRadius: 5, bgcolor: "#e0e7ff", "& .MuiLinearProgress-bar": { bgcolor: accent, borderRadius: 5 } }} />
              </Box>}
            </Box>
            <Stack alignItems={{ xs: "stretch", md: "flex-end" }} justifyContent="center" spacing={1}>
              {account?.hasAccess && <Button variant="outlined" onClick={() => navigate(state?.from || "/")} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, borderColor: accent, color: accent }}>Back to dashboard</Button>}
              {activePaid && !subscription.cancelAtPeriodEnd && <Button onClick={() => cancel(false)} disabled={busy} sx={{ textTransform: "none", color: "#64748b" }}>Cancel renewal</Button>}
            </Stack>
          </Stack>
        </Paper>

        {account?.pendingCheckout && <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }} action={<Button onClick={() => cancel(true)} disabled={busy} size="small">Cancel</Button>}>Checkout for {account.pendingCheckout.planCode.replaceAll("_", " ")} is pending. Resume that plan or cancel its checkout to choose another.</Alert>}

        <Box sx={{ textAlign: "center", pt: { xs: 6, md: 8 }, mb: 5 }}>
          <Typography sx={{ color: accent, fontWeight: 800, letterSpacing: 1.5, fontSize: 13, textTransform: "uppercase", mb: 1.5 }}>Pricing plans</Typography>
          <Typography component="h2" sx={{ fontSize: { xs: "2rem", md: "3rem" }, fontWeight: 900, letterSpacing: "-0.03em", color: "#111" }}>Choose your next chapter.</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Every plan includes the CADer tools you use today.</Typography>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5} sx={{ mt: 3 }}>
            <Typography fontWeight={billingCycle === "monthly" ? 800 : 500} color={billingCycle === "monthly" ? "#111" : "text.secondary"}>Monthly</Typography>
            <Switch checked={billingCycle === "yearly"} onChange={(_, checked) => setBillingCycle(checked ? "yearly" : "monthly")} inputProps={{ "aria-label": "Choose yearly billing" }} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: accent }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: accent } }} />
            <Typography fontWeight={billingCycle === "yearly" ? 800 : 500} color={billingCycle === "yearly" ? "#111" : "text.secondary"}>Yearly</Typography>
          </Stack>
        </Box>

        <Grid container spacing={3} alignItems="stretch">
          {visiblePlans.map((plan) => {
            const details = planDetails[plan.code] || {};
            const highlighted = ["executive_monthly", "teams_yearly"].includes(plan.code);
            const isPending = account?.pendingCheckout?.planCode === plan.code;
            const disabled = busy || activePaid || (account?.pendingCheckout && !isPending);
            return <Grid key={plan.code} size={{ xs: 12, md: 4 }}>
              <motion.div whileHover={{ y: -7 }} transition={{ type: "spring", stiffness: 300 }} style={{ height: "100%" }}>
                <Paper elevation={0} sx={{ p: { xs: 3.5, md: 4 }, height: "100%", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", borderRadius: 5, border: `1px solid ${highlighted ? accent : "rgba(0,0,0,.08)"}`, boxShadow: highlighted ? "0 24px 55px rgba(79,70,229,.15)" : "none", bgcolor: "#fff" }}>
                  {highlighted && <Box sx={{ position: "absolute", right: -37, top: 21, transform: "rotate(45deg)", bgcolor: accent, color: "white", px: 5, py: .5, fontSize: 11, fontWeight: 800, letterSpacing: .5 }}>Most popular</Box>}
                  <Typography variant="h6" fontWeight={800} color="#111">{plan.name}</Typography>
                  <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 2 }}><Typography sx={{ fontSize: { xs: 37, md: 42 }, lineHeight: 1, fontWeight: 900, letterSpacing: "-0.04em" }}>{money(plan.amountPaise)}</Typography><Typography color="text.secondary">/{plan.interval === "monthly" ? "mo" : "yr"}</Typography></Stack>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5, mb: 2.5 }}><Typography variant="body2" color="text.secondary" sx={{ textDecoration: "line-through" }}>{money(details.original * 100)}</Typography><Box sx={{ bgcolor: "#ecfdf5", color: "#059669", px: 1, py: .4, borderRadius: 1, fontSize: 12, fontWeight: 800 }}>{details.discount}</Box></Stack>
                  <Typography sx={{ color: accent, fontWeight: 800, mb: 2 }}>{plan.projectLimit} new projects / {plan.interval === "monthly" ? "month" : "year"}</Typography>
                  {details.includes && <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>{details.includes}</Typography>}
                  <Stack spacing={1.5} sx={{ mb: 4, flexGrow: 1 }}>{(details.features || ["All CADer survey tools", "Exports and cloud storage", "Use on mobile, tablet and desktop"]).map((feature) => <Stack key={feature} direction="row" spacing={1.5} alignItems="center"><CheckIcon /><Typography variant="body2" color="#444">{feature}</Typography></Stack>)}</Stack>
                  <Button fullWidth variant={highlighted ? "contained" : "outlined"} disabled={Boolean(disabled)} onClick={() => choosePlan(plan)} sx={{ py: 1.5, borderRadius: 2.5, textTransform: "none", fontWeight: 800, bgcolor: highlighted ? accent : "transparent", color: highlighted ? "white" : accent, borderColor: accent, "&:hover": { bgcolor: highlighted ? "#4338ca" : "#eef2ff", borderColor: accent } }}>{activePaid && subscription.planCode === plan.code ? "Current plan" : activePaid ? "Available after current period" : isPending ? "Resume checkout" : "Choose plan"}</Button>
                </Paper>
              </motion.div>
            </Grid>;
          })}
          {billingCycle === "yearly" && <Grid size={{ xs: 12, md: 4 }}><Paper elevation={0} sx={{ p: { xs: 3.5, md: 4 }, height: "100%", display: "flex", flexDirection: "column", borderRadius: 5, border: "1px solid rgba(0,0,0,.08)", bgcolor: "white" }}>
            <Typography variant="h6" fontWeight={800}>Institutions & Enterprise</Typography><Typography sx={{ fontSize: 42, fontWeight: 900, mt: 2, lineHeight: 1 }}>Custom</Typography><Typography color="text.secondary" sx={{ mt: 1.5, mb: 2.5 }}>Annual pricing tailored to your organization.</Typography><Typography color={accent} fontWeight={800} sx={{ mb: 2 }}>Custom project capacity</Typography>
            <Stack spacing={1.5} sx={{ mb: 4, flexGrow: 1 }}>{["Multi-user access", "Dedicated account manager", "On-site training", "Custom feature development"].map((feature) => <Stack key={feature} direction="row" spacing={1.5} alignItems="center"><CheckIcon /><Typography variant="body2" color="#444">{feature}</Typography></Stack>)}</Stack>
            <Button component="a" href="mailto:admin@getcader.com?subject=CADer%20Institutions%20and%20Enterprise%20plan" fullWidth variant="outlined" sx={{ py: 1.5, borderRadius: 2.5, textTransform: "none", fontWeight: 800, color: accent, borderColor: accent }}>Contact sales</Button>
          </Paper></Grid>}
        </Grid>

        <Paper elevation={0} sx={{ mt: { xs: 7, md: 10 }, p: { xs: 4, md: 6 }, borderRadius: 5, bgcolor: "#111827", color: "white", textAlign: "center" }}><Typography variant="h4" fontWeight={850}>Need help choosing?</Typography><Typography sx={{ opacity: .75, mt: 1, mb: 3 }}>Tell us about your projects and we’ll help you find the right fit.</Typography><Button component="a" href="mailto:admin@getcader.com?subject=CADer%20subscription%20question" variant="contained" sx={{ bgcolor: "white", color: "#111827", borderRadius: 2.5, px: 4, py: 1.5, textTransform: "none", fontWeight: 800, "&:hover": { bgcolor: "#e0e7ff" } }}>Contact our team</Button></Paper>
      </Container>
    </Box>
  </>;
}
