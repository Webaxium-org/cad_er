import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiCreditCard, FiRefreshCw } from "react-icons/fi";
import { Alert, Box, Button, Container, LinearProgress, Link, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import AppHeader from "../../components/AppHeader";
import AlertDialogSlide from "../../components/AlertDialogSlide";
import PricingCard from "../../components/PricingCard";
import { getPricingPlans, offerTerms } from "../../constants/pricingPlans";
import { cancelSubscription, getSubscription, getSubscriptionPaymentHistory, getSubscriptionPlans, loadRazorpayCheckout, verifySubscriptionCheckout, setupSubscriptionAutopay } from "../../services/subscriptionServices";
import { stopLoading } from "../../redux/loadingSlice";
import { heroTitleSx, compactTitleSx } from "../../components/pageHeaderStyles";

const date = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const accent = "#4f46e5";
const money = paise => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const themedAlert = { borderRadius: 2, bgcolor: "#eef2ff", color: "#312e81", border: "1px solid #c7d2fe",
  "& .MuiAlert-icon": { color: accent }, "& .MuiAlert-action .MuiButton-root": { color: accent } };

export default function SubscriptionPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const { state } = useLocation();
  const [plans, setPlans] = useState([]);
  const [account, setAccount] = useState(null);
  const [billingCycle, setBillingCycle] = useState(state?.planCode?.endsWith("_yearly") ? "yearly" : "monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => { if (state?.checkoutNotice) setNotice(state.checkoutNotice); }, [state]);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentHistory, setPaymentHistory] = useState(null);
  const [paymentHistoryBusy, setPaymentHistoryBusy] = useState(true);
  const [paymentHistoryError, setPaymentHistoryError] = useState("");
  const [paymentHistoryRefresh, setPaymentHistoryRefresh] = useState(0);
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

  useEffect(() => {
    let ignore = false;
    setPaymentHistoryBusy(true);
    setPaymentHistory(null);
    getSubscriptionPaymentHistory(paymentPage).then(({ data }) => {
      if (!ignore) { setPaymentHistory(data); setPaymentHistoryError(""); }
    }).catch(() => {
      if (!ignore) setPaymentHistoryError("Payment history could not be loaded.");
    }).finally(() => {
      if (!ignore) setPaymentHistoryBusy(false);
    });
    return () => { ignore = true; };
  }, [paymentPage, paymentHistoryRefresh]);

  const openCheckout = async data => {
    if (data.type === "paid") {
      await refresh(); setPaymentHistoryRefresh(value => value + 1); setNotice("Your first payment is confirmed. Complete auto pay setup below."); setBusy(false); return;
    }
    const Razorpay = await loadRazorpayCheckout();
    const initial = Boolean(data.orderId);
    const checkout = new Razorpay({
      key: data.keyId,
      ...(initial ? { order_id: data.orderId, amount: data.amountPaise, currency: data.currency } : { subscription_id: data.subscriptionId }),
      name: "CADer",
      description: initial ? `${data.pricing.name}: first paid period` : `${data.pricing?.name || "CADer"}: auto pay`,
      prefill: { name: user.name, email: user.email, contact: user.phone || undefined },
      theme: { color: "#4f46e5" },
      handler: async response => {
        try {
          const { data: confirmation } = await verifySubscriptionCheckout(response);
          await refresh();
          setPaymentHistoryRefresh(value => value + 1);
          if (initial) {
            setNotice(confirmation.hasAccess
              ? "Step 1 complete: your first period is paid and access is active. Continue to step 2 below to authorize auto pay."
              : "Payment received and awaiting capture. Refresh billing status shortly; access starts after payment is confirmed.");
          } else if (data.type === "autopay") {
            setNotice(confirmation.autopayAuthorized
              ? `Auto pay authorized. Regular billing starts on ${date(data.startsAt)}.`
              : "Auto pay authorization is awaiting bank confirmation. Your paid first-period access remains active.");
          } else {
            setNotice(confirmation.hasAccess ? "Subscription activated." : "Authorization received. Access starts when payment is confirmed.");
          }
        } catch (paymentError) {
          setError(paymentError.response?.data?.message || "Payment confirmation could not be loaded. Refresh billing status before paying again.");
        } finally { setBusy(false); }
      },
      modal: { ondismiss: () => { setBusy(false); refresh().catch(() => {}); } },
    });
    checkout.on("payment.failed", () => {
      setError(initial ? "Payment failed. Refresh billing status, cancel the failed checkout, then choose the plan to try again." : "Auto pay authorization failed. Your already-paid period remains valid; retry setup below.");
      setBusy(false); refresh().catch(() => {});
    });
    checkout.open();
  };

  const choosePlan = async plan => {
    navigate(`/subscription/checkout?plan=${encodeURIComponent(plan.code)}`);
  };

  const setupAutopay = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const { data } = await setupSubscriptionAutopay(account.subscription.id);
      await openCheckout(data);
    } catch (setupError) {
      setError(setupError.response?.data?.message || "Auto pay could not be started. Your paid period remains valid.");
      setBusy(false); refresh().catch(() => {});
    }
  };

  const addProject = async () => {
    navigate("/subscription/checkout?item=project");
  };

  const confirmCancellation = async () => {
    const isPending = cancelTarget === "checkout";
    if (!cancelTarget) return;
    setBusy(true);
    setError("");
    try { await cancelSubscription(); await refresh(); setNotice(isPending ? "Pending checkout cancelled." : "Renewal cancelled. Your paid access continues until the current period ends."); }
    catch (cancelError) { setError(cancelError.response?.data?.message || "Cancellation failed."); }
    finally { setBusy(false); setCancelTarget(null); }
  };

  const subscription = account?.subscription;
  const activePaid = subscription?.kind === "paid" && account?.hasAccess;
  const selectedPlan = plans.find((plan) => plan.code === subscription?.planCode);
  const usage = subscription?.projectLimit ? Math.min(100, subscription.projectCount / subscription.projectLimit * 100) : 0;
  const visiblePlans = getPricingPlans(billingCycle, plans);

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
              Choose a plan that fits your projects.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ position: "relative", mt: -8 }}>
        {error && <Alert severity="error" sx={{ ...themedAlert, mb: 2 }}>{error}</Alert>}
        {notice && <Alert severity="success" sx={{ ...themedAlert, mb: 2 }}>{notice}</Alert>}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 5, border: "1px solid #e0e7ff", boxShadow: "0 24px 65px rgba(67,56,202,.12)", mb: 3 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
            <Typography sx={{ color: accent, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", fontSize: 12 }}>Current account</Typography>
            {activePaid && <Button variant="contained" disabled={busy} onClick={addProject} sx={{ bgcolor: accent, textTransform: "none", borderRadius: 2, whiteSpace: "nowrap", "&:hover": { bgcolor: "#4338ca" } }}>Add project</Button>}
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={3}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 850, mt: .5 }}>{subscription?.kind === "trial" ? "30-day free trial" : subscription?.planName || selectedPlan?.name || (subscription?.planCode ? subscription.planCode.replaceAll("_", " ") : "Loading your plan")}</Typography>
              <Typography color="text.secondary" sx={{ mt: .5 }}>{account?.hasAccess ? `Access through ${date(subscription.periodEnd)}` : "Choose a plan to continue using CADer."}{subscription?.cancelAtPeriodEnd && " Renewal is cancelled."}</Typography>
              {activePaid && <Typography sx={{ mt: 1 }}>
                {subscription.cancelAtPeriodEnd ? "Renewal cancelled" : `${subscription.autopaySetupRequired ? "Next period (auto pay setup required)" : "Next renewal"}: ₹${(subscription.nextAmountPaise / 100).toLocaleString("en-IN")} on ${date(subscription.periodEnd)}`}
              </Typography>}
              {subscription && <Box sx={{ maxWidth: 450, mt: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}><Typography variant="body2" fontWeight={700}>New projects used</Typography><Typography variant="body2" fontWeight={800} color={accent}>{subscription.projectCount} / {subscription.projectLimit}</Typography></Stack>
                <LinearProgress variant="determinate" value={usage} sx={{ height: 8, borderRadius: 5, bgcolor: "#e0e7ff", "& .MuiLinearProgress-bar": { bgcolor: accent, borderRadius: 5 } }} />
              </Box>}
            </Box>
            <Stack alignItems={{ xs: "stretch", md: "flex-end" }} justifyContent="center" spacing={1}>
              <Button startIcon={<FiRefreshCw />} disabled={busy} onClick={() => { refresh().catch(() => setError("Billing status could not be refreshed.")); setPaymentHistoryRefresh(value => value + 1); }} sx={{ textTransform: "none", color: accent }}>Refresh billing</Button>
              {(activePaid || subscription?.canCancelRenewal) && !subscription.cancelAtPeriodEnd && <Button onClick={() => setCancelTarget("renewal")} disabled={busy} sx={{ textTransform: "none", color: "#64748b" }}>Cancel renewal</Button>}
            </Stack>
          </Stack>
        </Paper>

        {subscription?.autopaySetupRequired && <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: "1px solid #c7d2fe", bgcolor: "#eef2ff" }}>
          <Typography fontWeight={800} color="#312e81">Step 2: authorize auto pay</Typography>
          <Typography sx={{ mt: 1, mb: 2 }} color="text.secondary">Your first period is paid through {date(subscription.initialPeriodEnd)}. Authorize {subscription.nextAmountPaise / 100} INR per {subscription.billingInterval === "monthly" ? "month" : "year"}, starting on that date. You will not pay the first-period price again. Your bank may require a separate mandate verification payment shown in checkout. Without authorization, access ends after the paid period.</Typography>
          <Button variant="contained" disabled={busy} onClick={setupAutopay} sx={{ textTransform: "none", borderRadius: 2, bgcolor: accent, "&:hover": { bgcolor: "#4338ca" } }}>Continue to auto pay</Button>
        </Paper>}

        {account?.pendingCheckout && <Alert severity="info" sx={{ ...themedAlert, mb: 4 }} action={<Button onClick={() => setCancelTarget("checkout")} disabled={busy} size="small">Cancel</Button>}>Checkout for {account.pendingCheckout.planCode.replaceAll("_", " ")} is pending. {offerTerms(account.pendingCheckout.pricingSnapshot)}</Alert>}

        {account?.pendingCheckout && <Button sx={{ mb: 2, color: accent }} disabled={busy} onClick={() => choosePlan({ code: account.pendingCheckout.planCode, ...account.pendingCheckout.pricingSnapshot })}>Resume saved checkout</Button>}

        <Box sx={{ textAlign: "center", pt: { xs: 6, md: 8 }, mb: 5 }}>
          <Typography sx={{ color: accent, fontWeight: 800, letterSpacing: 1.5, fontSize: 13, textTransform: "uppercase", mb: 1.5 }}>Pricing plans</Typography>
          <Typography component="h2" sx={{ fontSize: { xs: "2rem", md: "3rem" }, fontWeight: 900, letterSpacing: "-0.03em", color: "#111" }}>Choose your next chapter.</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 620, mx: "auto" }}>Shown prices are CADer plan prices. An offer applies to the first month or year; the regular plan price follows.</Typography>
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
            const disabled = Boolean(plan.code && (!checkoutPlan || busy || activePaid || account?.pendingCheckout));
            return <Box key={plan.code || plan.tier} sx={{ minWidth: 0 }}>
              <PricingCard
                {...plan}
                disabled={disabled}
                buttonText={!plan.code ? "Contact Sales" : activePaid && subscription.planCode === plan.code ? "Current plan" : activePaid ? "Available after current period" : isPending ? "Use saved checkout above" : "Choose plan"}
                buttonHref={!plan.code ? "mailto:admin@getcader.com?subject=CADer%20Institutions%20and%20Enterprise%20plan" : undefined}
                handleContactSales={checkoutPlan ? () => choosePlan(checkoutPlan) : undefined}
              />
            </Box>;
          })}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5, textAlign: "center" }}>
          If you authorize auto pay, your plan renews at the regular price after any introductory period. GST and processing fees are added at checkout.
          You can cancel renewal at any time; access continues through the paid period. {" "}
          <Link component={RouterLink} to="/terms" underline="hover">Terms &amp; Conditions</Link> apply. See our {" "}
          <Link component={RouterLink} to="/privacy" underline="hover">Privacy Policy</Link> for payment data handling.
        </Typography>

        <Paper elevation={0} sx={{ mt: 4, borderRadius: 5, border: "1px solid #e0e7ff", overflow: "hidden" }}>
          <Box sx={{ p: { xs: 2.5, md: 3 } }}>
            <Typography component="h2" variant="h6" fontWeight={850} color="#1e1b4b">Payment history</Typography>
            <Typography variant="body2" color="text.secondary">Successful subscription payments on your account.</Typography>
          </Box>
          {paymentHistoryBusy && <LinearProgress />}
          {paymentHistoryError && <Alert severity="error" sx={{ mx: 3, mb: 2 }} action={
            <Button size="small" onClick={() => setPaymentHistoryRefresh(value => value + 1)}>Retry</Button>
          }>{paymentHistoryError}</Alert>}
          <TableContainer sx={{ borderTop: "1px solid #e0e7ff" }}>
            <Table sx={{ minWidth: 620 }}>
              <TableHead sx={{ bgcolor: "#f5f6ff" }}><TableRow>
                {["Date", "Plan", "Type", "Amount", "Status", "Invoice number", "Payment ID"].map(label =>
                  <TableCell key={label} sx={{ color: "#4338ca", fontWeight: 800 }}>{label}</TableCell>)}
              </TableRow></TableHead>
              <TableBody>
                {paymentHistory?.payments.map(payment => <TableRow key={payment.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{date(payment.createdAt)}</TableCell>
                  <TableCell>{payment.planName}</TableCell>
                  <TableCell>{payment.phase === "initial" ? "First period" : payment.phase === "recurring" ? "Renewal" : payment.phase === "project_addon" ? `Extra project${payment.quantity === 1 ? "" : "s"} (${payment.quantity})` : "Earlier payment"}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 750 }}>{money(payment.amountPaise)}</TableCell>
                  <TableCell sx={{ color: "#15803d", fontWeight: 750 }}>Paid</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>{payment.invoiceNumber || "—"}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: ".8rem" }}>{payment.paymentId}</TableCell>
                </TableRow>)}
                {!paymentHistoryBusy && !paymentHistoryError && !paymentHistory?.payments.length &&
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: "#64748b" }}>No payments yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          {paymentHistory && paymentHistory.total > paymentHistory.pageSize &&
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, borderTop: "1px solid #e0e7ff" }}>
              <Typography variant="body2" color="text.secondary">Page {paymentPage} of {Math.ceil(paymentHistory.total / paymentHistory.pageSize)}</Typography>
              <Stack direction="row" spacing={1}>
                <Button disabled={paymentHistoryBusy || paymentPage <= 1} onClick={() => { setPaymentHistoryBusy(true); setPaymentPage(page => page - 1); }}>Previous</Button>
                <Button disabled={paymentHistoryBusy || paymentPage >= Math.ceil(paymentHistory.total / paymentHistory.pageSize)} onClick={() => { setPaymentHistoryBusy(true); setPaymentPage(page => page + 1); }}>Next</Button>
              </Stack>
            </Stack>}
        </Paper>

        <Paper elevation={0} sx={{ mt: { xs: 7, md: 10 }, p: { xs: 4, md: 6 }, borderRadius: 5, background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", color: "white", textAlign: "center" }}><Typography variant="h4" fontWeight={850}>Need help choosing?</Typography><Typography sx={{ opacity: .75, mt: 1, mb: 3 }}>Tell us about your projects and we’ll help you find the right fit.</Typography><Button component="a" href="mailto:admin@getcader.com?subject=CADer%20subscription%20question" variant="contained" sx={{ bgcolor: "white", color: accent, borderRadius: 2.5, px: 4, py: 1.5, textTransform: "none", fontWeight: 800, "&:hover": { bgcolor: "#eef2ff" } }}>Contact our team</Button></Paper>
      </Container>
    </Box>
    <AlertDialogSlide
      open={Boolean(cancelTarget)}
      title={cancelTarget === "checkout" ? "Cancel pending checkout?" : "Cancel auto pay renewal?"}
      content={<Box sx={{ p: 2, borderRadius: "12px", bgcolor: "#eef2ff", border: "1px solid #c7d2fe" }}>
        <Typography fontWeight={750} color="#312e81">
          {cancelTarget === "checkout"
            ? "This checkout will be closed. You can choose a plan again whenever you are ready."
            : `Your ${subscription?.planName || selectedPlan?.name || "plan"} access stays active through ${date(subscription?.periodEnd)}. No further automatic renewal will be scheduled.`}
        </Typography>
      </Box>}
      cancelButtonText={cancelTarget === "checkout" ? "Keep checkout" : "Keep auto pay"}
      submitButtonText={busy ? "Cancelling…" : cancelTarget === "checkout" ? "Cancel checkout" : "Cancel renewal"}
      submitDisabled={busy}
      onCancel={() => !busy && setCancelTarget(null)}
      onSubmit={confirmCancellation}
      paperSx={{ borderRadius: "20px", border: "1px solid #c7d2fe", boxShadow: "0 24px 70px rgba(49,46,129,.18)" }}
    />
  </>;
}
