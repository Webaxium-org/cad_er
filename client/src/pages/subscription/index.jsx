import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiCreditCard } from "react-icons/fi";
import { Alert, Box, Button, Container, LinearProgress, Paper, Stack, Switch, Typography } from "@mui/material";
import AppHeader from "../../components/AppHeader";
import PricingCard from "../../components/PricingCard";
import { getPricingPlans } from "../../constants/pricingPlans";
import { cancelSubscription, createSubscriptionCheckout, getSubscription, getSubscriptionPlans, loadRazorpayCheckout, verifySubscriptionCheckout } from "../../services/subscriptionServices";
import { stopLoading } from "../../redux/loadingSlice";
import { heroTitleSx, compactTitleSx } from "../../components/pageHeaderStyles";

const date = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const accent = "#4f46e5";

export default function SubscriptionPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { state } = useLocation();
  const [plans, setPlans] = useState([]);
  const [account, setAccount] = useState(null);
  const [billingCycle, setBillingCycle] = useState(state?.planCode?.endsWith("_yearly") ? "yearly" : "monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const heroRef = useRef(null);
  const [compactHeaderVisible, setCompactHeaderVisible] = useState(false);

  useEffect(() => {
    const updateCompactHeader = () => {
      const halfway = (heroRef.current?.offsetHeight || 0) / 2;
      setCompactHeaderVisible(window.scrollY >= halfway && halfway > 0);
    };
    updateCompactHeader();
    window.addEventListener("scroll", updateCompactHeader, { passive: true });
    window.addEventListener("resize", updateCompactHeader);
    return () => {
      window.removeEventListener("scroll", updateCompactHeader);
      window.removeEventListener("resize", updateCompactHeader);
    };
  }, []);

  const refresh = useCallback(async () => {
    const [{ data: planData }, { data: accountData }] = await Promise.all([getSubscriptionPlans(), getSubscription()]);
    setPlans(planData.plans);
    setAccount(accountData);
  }, []);

  useEffect(() => {
    dispatch(stopLoading());
    refresh().catch(() => setError("Subscription details could not be loaded."));
  }, [dispatch, refresh]);

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
  const visiblePlans = getPricingPlans(billingCycle);

  return <>
    <AppHeader />
    <Box sx={{ minHeight: "100vh", bgcolor: "#fcfcfd", pb: { xs: 8, md: 14 } }}>
      <AnimatePresence>
        {compactHeaderVisible && (
          <Box component={motion.div}
            initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            sx={{ position: "fixed", top: { xs: 49, md: 65 }, left: 0, right: 0, zIndex: 1099,
              p: 2, color: "white", background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
              borderRadius: "0 0 20px 20px", boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.3)" }}>
            <Container maxWidth="lg">
              <Stack direction="row" alignItems="center" spacing={2}>
                <FiCreditCard size={32} opacity={0.9} style={{ flexShrink: 0 }} />
                <Typography fontWeight={900} sx={compactTitleSx} letterSpacing="-0.5px" noWrap>
                  Your <span style={{ color: "#c7d2fe" }}>Subscription</span>
                </Typography>
              </Stack>
            </Container>
          </Box>
        )}
      </AnimatePresence>
      <Box ref={heroRef} sx={{ color: "white", pt: 10, pb: 10, mb: 6, position: "relative",
        borderRadius: "0 0 20px 20px", boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.4)",
        background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" }}>
        <Container maxWidth="lg">
          <Box sx={{ opacity: compactHeaderVisible ? 0 : 1,
            transform: compactHeaderVisible ? "translateY(-12px) scale(0.96)" : "none",
            transformOrigin: "left center", transition: "opacity 0.3s ease, transform 0.3s ease" }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={1}>
              <FiCreditCard size={32} opacity={0.9} style={{ flexShrink: 0 }} />
              <Typography component="h1" sx={heroTitleSx} fontWeight={900} letterSpacing="-0.02em">
                Your <span style={{ color: "#c7d2fe" }}>Subscription</span>
              </Typography>
            </Stack>
            <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 500, fontWeight: 500 }}>
              Choose the project capacity you need. Your account and projects stay together as you move between periods.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ position: "relative", mt: -14 }}>
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

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gridAutoRows: "1fr", gap: 3 }}>
          {visiblePlans.map((plan) => {
            const checkoutPlan = plans.find((available) => available.code === plan.code);
            const isPending = account?.pendingCheckout?.planCode === plan.code;
            const disabled = Boolean(plan.code && (!checkoutPlan || busy || activePaid || (account?.pendingCheckout && !isPending)));
            return <Box key={plan.code || plan.tier} sx={{ minWidth: 0 }}>
              <PricingCard
                {...plan}
                introductoryPrice={checkoutPlan ? String(checkoutPlan.amountPaise / 100) : plan.introductoryPrice}
                disabled={disabled}
                buttonText={!plan.code ? "Contact Sales" : activePaid && subscription.planCode === plan.code ? "Current plan" : activePaid ? "Available after current period" : isPending ? "Resume checkout" : "Choose plan"}
                buttonHref={!plan.code ? "mailto:admin@getcader.com?subject=CADer%20Institutions%20and%20Enterprise%20plan" : undefined}
                handleContactSales={checkoutPlan ? () => choosePlan(checkoutPlan) : undefined}
              />
            </Box>;
          })}
        </Box>

        <Paper elevation={0} sx={{ mt: { xs: 7, md: 10 }, p: { xs: 4, md: 6 }, borderRadius: 5, bgcolor: "#111827", color: "white", textAlign: "center" }}><Typography variant="h4" fontWeight={850}>Need help choosing?</Typography><Typography sx={{ opacity: .75, mt: 1, mb: 3 }}>Tell us about your projects and we’ll help you find the right fit.</Typography><Button component="a" href="mailto:admin@getcader.com?subject=CADer%20subscription%20question" variant="contained" sx={{ bgcolor: "white", color: "#111827", borderRadius: 2.5, px: 4, py: 1.5, textTransform: "none", fontWeight: 800, "&:hover": { bgcolor: "#e0e7ff" } }}>Contact our team</Button></Paper>
      </Container>
    </Box>
  </>;
}
