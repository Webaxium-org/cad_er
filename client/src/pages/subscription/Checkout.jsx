import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Alert, Box, Button, CircularProgress, Container, Divider, Link, Paper, Stack, Typography } from "@mui/material";
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiCreditCard, FiLock, FiPackage } from "react-icons/fi";
import AppHeader from "../../components/AppHeader";
import { heroTitleSx } from "../../components/pageHeaderStyles";
import { createProjectAddOnCheckout, createSubscriptionCheckout, getSubscription, getSubscriptionPlans, loadRazorpayCheckout, verifyProjectAddOnCheckout, verifySubscriptionCheckout } from "../../services/subscriptionServices";

const money = paise => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = value => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const accent = "#4f46e5";

export default function SubscriptionCheckoutPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useSelector(state => state.user);
  const isProject = params.get("item") === "project";
  const planCode = params.get("plan");
  const [account, setAccount] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let live = true;
    Promise.all([getSubscription(), getSubscriptionPlans()]).then(([accountResponse, plansResponse]) => {
      if (!live) return;
      setAccount(accountResponse.data);
      setPlan(accountResponse.data.pendingCheckout?.planCode === planCode
        ? accountResponse.data.pendingCheckout.pricingSnapshot
        : plansResponse.data.plans.find(item => item.code === planCode) || null);
      setError("");
    }).catch(() => { if (live) setError("Checkout details could not be loaded. Please try again."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [planCode]);

  const activePaid = account?.hasAccess && account.subscription?.kind === "paid";
  const projectBasePaise = account?.projectAddOnQuote?.basePaise * quantity;
  const projectGstPaise = Math.round(projectBasePaise * 18 / 100);
  const projectProcessingFeePaise = Math.round((projectBasePaise + projectGstPaise) * 2 / 100);
  const quote = isProject ? account?.projectAddOnQuote && {
    basePaise: projectBasePaise, gstPaise: projectGstPaise,
    processingFeePaise: projectProcessingFeePaise,
    totalPaise: projectBasePaise + projectGstPaise + projectProcessingFeePaise,
  } : plan?.checkout || (plan ? {
    basePaise: plan.firstPaymentAmountPaise ?? plan.amountPaise,
    gstPaise: 0, processingFeePaise: 0,
    totalPaise: plan.firstPaymentAmountPaise ?? plan.amountPaise,
  } : null);
  const valid = isProject ? activePaid : Boolean(plan && !activePaid);
  const description = isProject ? `${quantity} additional project${quantity === 1 ? "" : "s"}` : `${plan?.name || "Plan"} · ${plan?.interval || ""}`;

  const pay = async () => {
    setBusy(true); setError("");
    try {
      const { data } = isProject ? await createProjectAddOnCheckout(quantity) : await createSubscriptionCheckout(plan.code, plan.quoteKey);
      if (data.type === "paid") {
        navigate("/subscription", { replace: true, state: { checkoutNotice: "Your payment is confirmed. Complete auto pay setup below." } });
        return;
      }
      if (data.amountPaise != null && data.amountPaise !== quote.totalPaise) throw new Error("The checkout amount changed. Please return and review the price.");
      if (isProject && data.quantity !== quantity) throw new Error("The project quantity changed. Please return and review the checkout.");
      const Razorpay = await loadRazorpayCheckout();
      const checkout = new Razorpay({
        key: data.keyId,
        ...(data.orderId ? { order_id: data.orderId, amount: data.amountPaise, currency: data.currency } : { subscription_id: data.subscriptionId }),
        name: "CADer", description,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone || undefined },
        theme: { color: accent },
        handler: async response => {
          try {
            const { data: confirmation } = isProject ? await verifyProjectAddOnCheckout(response) : await verifySubscriptionCheckout(response);
            const checkoutNotice = isProject
              ? confirmation.captured ? `${quantity} project${quantity === 1 ? "" : "s"} added to your current period.` : "Payment received. Refresh billing after capture to see your projects."
              : confirmation.hasAccess ? "Your plan is active. Complete auto pay setup if prompted below." : "Payment received. Refresh billing after capture to confirm access.";
            navigate("/subscription", { replace: true, state: { checkoutNotice } });
          } catch (paymentError) {
            setError(paymentError.response?.data?.message || "Payment could not be confirmed. Refresh billing before paying again.");
          } finally { setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.on("payment.failed", () => { setError("Payment failed. Please review billing before trying again."); setBusy(false); });
      checkout.open();
    } catch (checkoutError) {
      setError(checkoutError.response?.data?.message || checkoutError.message || "Checkout could not be started.");
      setBusy(false);
    }
  };

  return <>
    <AppHeader />
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9ff", pb: { xs: 8, md: 12 } }}>
      <Box sx={{ color: "white", pt: { xs: 7, md: 10 }, pb: { xs: 14, md: 17 }, borderRadius: "0 0 20px 20px",
        background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", boxShadow: "0 10px 40px -10px rgba(79,70,229,.35)" }}>
        <Container maxWidth="lg">
          <Button startIcon={<FiArrowLeft />} onClick={() => navigate("/subscription")}
            sx={{ color: "white", textTransform: "none", mb: 3, px: 0, opacity: .9, "&:hover": { bgcolor: "transparent", opacity: 1 } }}>
            Back to subscription
          </Button>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <FiCreditCard size={32} style={{ flexShrink: 0 }} />
            <Typography component="h1" sx={heroTitleSx} fontWeight={900} letterSpacing="-0.02em">Checkout</Typography>
          </Stack>
          <Typography sx={{ opacity: .85, maxWidth: 550 }}>Review your order and the full amount before continuing to secure payment.</Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ position: "relative", mt: { xs: -9, md: -11 } }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {loading ? <Paper sx={{ p: 6, textAlign: "center", borderRadius: 4 }}><CircularProgress /></Paper>
          : !valid || !quote ? <Alert severity="info" sx={{ borderRadius: 2 }}>This checkout is no longer available. Return to subscriptions to review your account.</Alert>
          : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.5fr) minmax(320px, 1fr)" }, gap: 3, alignItems: "start" }}>
            <Stack spacing={3}>
              <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: "1px solid #e0e7ff", boxShadow: "0 18px 50px rgba(67,56,202,.08)" }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                  <Box sx={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 2, bgcolor: "#eef2ff", color: accent }}><FiPackage size={20} /></Box>
                  <Box><Typography variant="overline" color={accent} fontWeight={800} sx={{ lineHeight: 1 }}>{isProject ? "PROJECT ADD-ON" : "SUBSCRIPTION PLAN"}</Typography>
                    <Typography component="h2" variant="h6" fontWeight={850} color="#1e1b4b">Your order</Typography></Box>
                </Stack>
                <Box sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, bgcolor: "#f7f8ff", border: "1px solid #e6e8fb" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={800} color="#1e1b4b">{description}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
                        {isProject ? `Available through ${date(account.subscription.periodEnd)}` :
                          `${plan.projectLimit} new projects per ${plan.interval === "monthly" ? "month" : "year"}`}
                      </Typography>
                    </Box>
                    <Typography fontWeight={850} color="#1e1b4b" sx={{ whiteSpace: "nowrap" }}>{money(quote.basePaise)}</Typography>
                  </Stack>
                  {isProject && <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 3, pt: 2.5, borderTop: "1px solid #e0e7ff" }}>
                    <Typography fontWeight={700} color="#334155">Quantity</Typography>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ p: .5, borderRadius: 2, bgcolor: "white", border: "1px solid #d9def8" }}>
                      <Button aria-label="Remove one project" disabled={busy || quantity <= 1} onClick={() => setQuantity(value => value - 1)}
                        sx={{ minWidth: 32, width: 32, height: 32, fontSize: 20, color: accent }}>−</Button>
                      <Typography sx={{ minWidth: 28, textAlign: "center" }} fontWeight={800}>{quantity}</Typography>
                      <Button aria-label="Add one project" disabled={busy || quantity >= 100} onClick={() => setQuantity(value => value + 1)}
                        sx={{ minWidth: 32, width: 32, height: 32, fontSize: 20, color: accent }}>+</Button>
                    </Stack>
                  </Stack>}
                </Box>
                <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mt: 3, color: "#475569" }}>
                  <FiCheckCircle size={18} style={{ flexShrink: 0, marginTop: 2, color: accent }} />
                  <Typography variant="body2">{isProject ? "Projects are added to your current billing period after payment is confirmed." :
                    plan.firstPaymentAmountPaise != null ? "This is your first-period price. Auto pay authorization follows after this payment." : "Your plan starts after payment is confirmed."}</Typography>
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: "1px solid #e0e7ff" }}>
                <Typography component="h2" variant="h6" fontWeight={850} color="#1e1b4b" sx={{ mb: 1 }}>Account details</Typography>
                <Typography variant="body2" color="text.secondary">Payment confirmation is linked to your CADer account.</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mt: 3 }}>
                  <Box sx={{ flex: 1 }}><Typography variant="caption" color="text.secondary">Name</Typography><Typography fontWeight={700}>{user?.name || "—"}</Typography></Box>
                  <Box sx={{ flex: 1, overflowWrap: "anywhere" }}><Typography variant="caption" color="text.secondary">Email</Typography><Typography fontWeight={700}>{user?.email || "—"}</Typography></Box>
                </Stack>
              </Paper>
            </Stack>

            <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: "1px solid #e0e7ff",
              boxShadow: "0 18px 50px rgba(67,56,202,.1)", position: { md: "sticky" }, top: { md: 92 } }}>
              <Typography component="h2" variant="h6" fontWeight={850} color="#1e1b4b">Order summary</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 3 }}>All charges are shown before payment.</Typography>
              <Stack spacing={2.25}>
                <Stack direction="row" justifyContent="space-between" spacing={2}><Typography color="text.secondary">{isProject ? `Projects (${quantity} × ${money(account.projectAddOnQuote.basePaise)})` : "Plan price"}</Typography><Typography fontWeight={700}>{money(quote.basePaise)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between" spacing={2}><Typography color="text.secondary">GST (18%)</Typography><Typography fontWeight={700}>{money(quote.gstPaise)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between" spacing={2}><Typography color="text.secondary">Processing fee (2%)</Typography><Typography fontWeight={700}>{money(quote.processingFeePaise)}</Typography></Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}><Typography fontWeight={850} color="#1e1b4b">Total</Typography><Typography variant="h5" fontWeight={900} color={accent}>{money(quote.totalPaise)}</Typography></Stack>
              </Stack>
              {!isProject && <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: "#f5f6ff", border: "1px solid #e0e7ff" }}>
                <Typography variant="body2" fontWeight={800} color="#312e81">Future billing</Typography>
                <Typography variant="body2" color="#475569" sx={{ mt: .5 }}>
                  {money(plan.renewalCheckout?.totalPaise ?? plan.amountPaise)} per {plan.interval === "monthly" ? "month" : "year"}{plan.renewalCheckout ? ", including GST and processing fee" : ""}, until cancelled.
                </Typography>
              </Box>}
              <Button fullWidth variant="contained" disabled={busy} onClick={pay} endIcon={!busy && <FiArrowRight />}
                sx={{ bgcolor: accent, mt: 3, py: 1.5, borderRadius: 2, textTransform: "none", fontWeight: 800, fontSize: 16, "&:hover": { bgcolor: "#4338ca" } }}>
                {busy ? "Preparing checkout…" : `Pay ${money(quote.totalPaise)}`}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, textAlign: "center" }}>
                Review our <Link component={RouterLink} to="/terms" underline="hover">Terms &amp; Conditions</Link>, including cancellation and refunds, and <Link component={RouterLink} to="/privacy" underline="hover">Privacy Policy</Link> before paying.
              </Typography>
              <Stack direction="row" justifyContent="center" alignItems="center" spacing={.75} sx={{ mt: 2, color: "#64748b" }}>
                <FiLock size={14} /><Typography variant="caption">Secure payment powered by Razorpay</Typography>
              </Stack>
            </Paper>
          </Box>}
      </Container>
    </Box>
  </>;
}
