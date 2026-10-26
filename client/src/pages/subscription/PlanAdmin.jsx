import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { FiClock, FiCreditCard, FiEdit2, FiLayers, FiSettings, FiTag } from "react-icons/fi";
import { Alert, Box, Button, Checkbox, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, LinearProgress, Paper, Skeleton, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import AppHeader from "../../components/AppHeader";
import { heroTitleSx, compactTitleSx } from "../../components/pageHeaderStyles";
import { stopLoading } from "../../redux/loadingSlice";
import { getAdminPlans, getPlanHistory, publishPlan } from "../../services/subscriptionServices";
import { offerTerms } from "../../constants/pricingPlans";

const money = value => `₹${(value / 100).toLocaleString("en-IN")}`;
const errorMessage = error => error.response?.data?.message || error.message || "Request failed";
const buttonSx = { borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 2, py: 1 };
const panelSx = { border: "1px solid #e2e8f0", borderRadius: "20px", bgcolor: "#fff", boxShadow: "0 8px 24px rgba(15,23,42,.04)" };
const inputSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#f8fafc", "& fieldset": { borderColor: "#e2e8f0" }, "&:hover fieldset": { borderColor: "#6366f1" } },
  "& .MuiInputLabel-root": { fontWeight: 600, color: "#64748b" },
};

export default function PlanAdmin() {
  const dispatch = useDispatch();
  const [plans, setPlans] = useState([]);
  const [mode, setMode] = useState("");
  const [form, setForm] = useState(null);
  const [history, setHistory] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [billingFilter, setBillingFilter] = useState("all");
  const heroRef = useRef(null);
  const [compactHeaderVisible, setCompactHeaderVisible] = useState(false);
  useEffect(() => {
    const updateHeader = () => {
      const halfway = (heroRef.current?.offsetHeight || 0) / 2;
      setCompactHeaderVisible(halfway > 0 && window.scrollY >= halfway);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader);
    return () => { window.removeEventListener("scroll", updateHeader); window.removeEventListener("resize", updateHeader); };
  }, []);
  const load = async () => {
    const { data } = await getAdminPlans();
    setPlans(data.plans); setMode(data.paymentMode);
  };
  useEffect(() => {
    dispatch(stopLoading());
    setBusy(true);
    load().catch(e => setError(errorMessage(e))).finally(() => setBusy(false));
  }, [dispatch]);
  const edit = plan => {
    setError(""); setNotice("");
    setForm({ ...plan, price: String(plan.amountPaise / 100), featuresText: plan.features.join("\n"),
      hasOffer: plan.firstPaymentAmountPaise != null,
      hasOngoingOffer: plan.ongoingAmountPaise != null,
      ongoingPrice: plan.ongoingAmountPaise != null ? String(plan.ongoingAmountPaise / 100) : "",
      ongoingOfferAppliesToFirstPeriod: plan.ongoingOfferAppliesToFirstPeriod === true,
      offerPrice: plan.firstPaymentAmountPaise != null ? String(plan.firstPaymentAmountPaise / 100) : "" });
  };
  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const save = async event => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const toPaise = value => {
        if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("Prices must have at most two decimal places");
        return Math.round(Number(value) * 100);
      };
      await publishPlan(form.code, {
        expectedVersion: form.version, name: form.name, amountPaise: toPaise(form.price), interval: form.interval,
        projectLimit: Number(form.projectLimit), available: form.available, highlighted: form.highlighted,
        features: form.featuresText.split("\n").map(f => f.trim()).filter(Boolean),
        firstPaymentAmountPaise: form.hasOffer ? toPaise(form.offerPrice) : null,
        ongoingAmountPaise: form.hasOngoingOffer ? toPaise(form.ongoingPrice) : null,
        ongoingOfferAppliesToFirstPeriod: form.hasOngoingOffer && form.ongoingOfferAppliesToFirstPeriod,

      });
      setForm(null); setNotice("New version published. Existing subscriptions retain their purchased billing terms."); await load();
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };
  const showHistory = async code => {
    setBusy(true); setError("");
    try { const { data } = await getPlanHistory(code); setHistory(data.versions); }
    catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };
  const visiblePlans = plans.filter(plan => billingFilter === "all" || plan.interval === billingFilter);
  return <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", pb: 8 }}>
    <AppHeader showSearch={false} showNotifications={false} />
    <AnimatePresence>
      {compactHeaderVisible && <Box component={motion.div}
        initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
        transition={{ duration: .3 }}
        sx={{ position: "fixed", top: { xs: 49, md: 65 }, left: 0, right: 0, zIndex: 1099, p: 2,
          color: "white", background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
          borderRadius: "0 0 20px 20px", boxShadow: "0 10px 40px -10px rgba(79,70,229,.3)" }}>
        <Container maxWidth="lg"><Stack direction="row" spacing={2} alignItems="center">
          <FiSettings size={32} style={{ flexShrink: 0 }} />
          <Typography fontWeight={900} sx={compactTitleSx}>Admin <Box component="span" sx={{ color: "#c7d2fe" }}>Settings</Box></Typography>
        </Stack></Container>
      </Box>}
    </AnimatePresence>
    <Box ref={heroRef} sx={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", pt: 10, pb: 10,
      color: "white", borderRadius: "0 0 20px 20px", boxShadow: "0 10px 40px -10px rgba(79,70,229,.4)", mb: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ opacity: compactHeaderVisible ? 0 : 1, transform: compactHeaderVisible ? "translateY(-12px) scale(.96)" : "none", transformOrigin: "left center", transition: "opacity .3s ease, transform .3s ease" }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={1}>
            <FiSettings size={32} style={{ flexShrink: 0 }} />
            <Typography component="h1" sx={heroTitleSx} fontWeight={900} letterSpacing="-.02em">Admin <Box component="span" sx={{ color: "#c7d2fe" }}>Settings</Box></Typography>
          </Stack>
          <Typography sx={{ opacity: .85, maxWidth: 540, fontWeight: 500 }}>Manage subscription plans, first-period and ongoing offers, and project allowances.</Typography>
        </Box>
      </Container>
    </Box>
    <Container maxWidth="lg" sx={{ mt: -8, position: "relative" }}>
    <Paper elevation={0} sx={{ ...panelSx, p: { xs: 3, md: 4 }, mb: 3 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 48, height: 48, display: "grid", placeItems: "center", bgcolor: "#eef2ff", color: "#6366f1", borderRadius: "12px", flexShrink: 0 }}><FiCreditCard size={24} /></Box>
          <Box><Typography component="h2" variant="h6" fontWeight={800} color="#1e293b">Pricing plans</Typography>
            <Typography variant="body2" color="text.secondary">Manage your catalog and review previous versions.</Typography></Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip label={`${plans.length} plans`} size="small" sx={{ bgcolor: "#eef2ff", color: "#4f46e5", fontWeight: 700 }} />
          {mode && <Chip label={mode === "live" ? "Live payments" : "Test payments"} size="small" sx={{ bgcolor: mode === "live" ? "#ecfdf5" : "#fff7ed", color: mode === "live" ? "#047857" : "#c2410c", fontWeight: 700 }} />}
        </Stack>
      </Stack>
      <Divider sx={{ my: 3, borderColor: "#e2e8f0" }} />
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
        <ToggleButtonGroup exclusive value={billingFilter} onChange={(_, value) => value && setBillingFilter(value)} size="small" aria-label="Filter plans by billing interval"
          sx={{ gap: 1, flexWrap: "wrap", "& .MuiToggleButton-root": { borderRadius: "10px !important", border: "1px solid #e2e8f0 !important", px: 2, fontWeight: 700, textTransform: "none", color: "#64748b", "&.Mui-selected": { bgcolor: "#6366f1", color: "white", "&:hover": { bgcolor: "#4f46e5" } } } }}>
          <ToggleButton value="all">All plans</ToggleButton><ToggleButton value="monthly">Monthly</ToggleButton><ToggleButton value="yearly">Yearly</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 370 }}>Edits publish a new version. Existing subscribers keep their purchased terms.</Typography>
      </Stack>
    </Paper>
    {busy && <LinearProgress aria-label="Loading pricing plans" sx={{ mb: 2, borderRadius: 2 }} />}
    {!form && error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
    {notice && <Alert severity="success" sx={{ my: 2 }}>{notice}</Alert>}
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
      {busy && !plans.length && [1, 2].map(key => <Paper key={key} elevation={0} sx={{ ...panelSx, p: 4 }}><Skeleton width="45%" height={35} /><Skeleton width="65%" height={65} /><Skeleton height={90} /></Paper>)}
      {visiblePlans.map(plan => <Paper key={plan._id} elevation={0} sx={{ ...panelSx, p: { xs: 3, md: 4 }, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", "&::before": { content: '""', position: "absolute", top: 0, left: 0, bottom: 0, width: 5, bgcolor: plan.available ? "#6366f1" : "#cbd5e1" } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box><Typography component="h3" variant="h6" fontWeight={800} color="#1e293b">{plan.name}</Typography><Typography variant="body2" color="text.secondary">{plan.interval === "monthly" ? "Monthly" : "Yearly"} billing · Version {plan.version}</Typography></Box>
          <Chip size="small" label={plan.available ? "Available" : "Hidden"} sx={{ fontWeight: 700, bgcolor: plan.available ? "#ecfdf5" : "#f1f5f9", color: plan.available ? "#047857" : "#64748b" }} />
        </Stack>
        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 3, mb: 2 }}><Typography fontSize={{ xs: "2rem", sm: "2.5rem" }} fontWeight={900} letterSpacing="-.03em" color="#1e293b">{money(plan.amountPaise)}</Typography><Typography color="text.secondary">/ {plan.interval === "monthly" ? "month" : "year"}</Typography></Stack>
        <Stack direction="row" spacing={1} alignItems="center" color="#64748b"><FiLayers size={18} /><Typography variant="body2" fontWeight={600}>{plan.projectLimit} new project{plan.projectLimit === 1 ? "" : "s"} per billing cycle</Typography></Stack>
        {plan.highlighted && <Typography variant="caption" color="#4f46e5" fontWeight={700} sx={{ mt: 1 }}>Highlighted on the pricing page</Typography>}
        <Box sx={{ p: 2, my: 3, borderRadius: "12px", bgcolor: plan.firstPaymentAmountPaise != null ? "#eef2ff" : "#f8fafc", border: "1px solid #e2e8f0" }}>
          <Stack direction="row" alignItems="center" spacing={1} color="#4f46e5" mb={.75}><FiTag size={16} /><Typography variant="body2" fontWeight={800}>{plan.ongoingAmountPaise != null ? "Ongoing offer" : plan.firstPaymentAmountPaise != null ? "First-period offer" : plan.offer ? "Legacy provider offer" : "Standard pricing"}</Typography></Stack>
          <Typography variant="body2" color="#475569">{offerTerms(plan)}</Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: "auto" }}><Button variant="contained" startIcon={<FiEdit2 />} disabled={busy} sx={{ ...buttonSx, bgcolor: "#6366f1", boxShadow: "none", "&:hover": { bgcolor: "#4f46e5", boxShadow: "none" } }} onClick={() => edit(plan)}>Edit plan</Button><Button startIcon={<FiClock />} disabled={busy} sx={{ ...buttonSx, color: "#64748b" }} onClick={() => showHistory(plan.code)}>Version history</Button></Stack>
      </Paper>)}
    </Box>
    {!busy && !error && !visiblePlans.length && <Paper elevation={0} sx={{ ...panelSx, p: 5, textAlign: "center" }}><Typography fontWeight={700} color="#475569">No plans in this category.</Typography></Paper>}
    <Dialog open={Boolean(form)} onClose={() => !busy && setForm(null)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: "20px", ...inputSx } } }}>
      {form && <Box component="form" onSubmit={save}>
        <DialogTitle sx={{ bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0", p: 3 }}><Typography component="span" fontSize="1.25rem" fontWeight={800} color="#1e293b">Edit {form.name}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Publishing creates version {form.version + 1} for new subscribers.</Typography></DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Plan name" required value={form.name} onChange={e => change("name", e.target.value)} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth label="Regular price (INR)" required value={form.price} onChange={e => change("price", e.target.value)} /><TextField fullWidth label={`Projects per ${form.interval === "monthly" ? "month" : "year"}`} type="number" required value={form.projectLimit} onChange={e => change("projectLimit", e.target.value)} /></Stack>
          <TextField label="Features (one per line)" multiline minRows={3} value={form.featuresText} onChange={e => change("featuresText", e.target.value)} />
          <FormControlLabel control={<Checkbox checked={form.available} onChange={e => change("available", e.target.checked)} />} label="Available to new subscribers" />
          <FormControlLabel control={<Checkbox checked={form.highlighted} onChange={e => change("highlighted", e.target.checked)} />} label="Highlight this plan" />
          {form.offer && <Alert severity="info">This version uses an older provider offer. Publishing replaces it for new customers with the first-period pricing configured below. Existing purchases keep their original terms.</Alert>}
          <Divider />
          <FormControlLabel control={<Checkbox checked={form.hasOffer} onChange={e => change("hasOffer", e.target.checked)} />} label="Enable first-period offer" />
          <Typography variant="body2" color="text.secondary">Optional. Applies to a customer's first purchase of this plan unless replaced by an ongoing offer below. Existing subscribers keep their purchased pricing.</Typography>
          {form.hasOffer && <>
            <TextField fullWidth required label={`First ${form.interval === "monthly" ? "month" : "year"} price (INR)`} value={form.offerPrice} onChange={e => change("offerPrice", e.target.value)} helperText="Must be between INR 1 and INR 10,00,000. This may be above or below the renewal price." />
          </>}
          <Divider />
          <FormControlLabel control={<Checkbox checked={form.hasOngoingOffer} onChange={e => change("hasOngoingOffer", e.target.checked)} />} label="Enable ongoing offer" />
          {form.hasOngoingOffer && <>
            <TextField fullWidth required label={`Ongoing ${form.interval === "monthly" ? "monthly" : "yearly"} price (INR)`} value={form.ongoingPrice} onChange={e => change("ongoingPrice", e.target.value)} helperText="At least INR 1, up to the regular price. Stays fixed for this subscription until cancellation." />
            <FormControlLabel control={<Checkbox checked={form.ongoingOfferAppliesToFirstPeriod} onChange={e => change("ongoingOfferAppliesToFirstPeriod", e.target.checked)} />} label="Replace the first-period offer with this price" />
            <Typography variant="body2" color="text.secondary">Leave unchecked to keep the first-period offer. If no first-period offer is enabled, the ongoing price applies from the first period.</Typography>
          </>}
          <Alert severity="info">For a new customer: first {form.interval === "monthly" ? "month" : "year"}: {money(Math.round(Number(form.hasOngoingOffer && (form.ongoingOfferAppliesToFirstPeriod || !form.hasOffer) ? form.ongoingPrice : form.hasOffer ? form.offerPrice : form.price) * 100))}. Then {money(Math.round(Number(form.hasOngoingOffer ? form.ongoingPrice : form.price) * 100))} per {form.interval === "monthly" ? "month" : "year"} until cancelled. GST and processing fees are added at checkout.</Alert>
        </Stack></DialogContent>
        <DialogActions sx={{ p: 3, borderTop: "1px solid #e2e8f0" }}><Button sx={buttonSx} disabled={busy} onClick={() => setForm(null)}>Cancel</Button><Button sx={{ ...buttonSx, bgcolor: "#6366f1" }} variant="contained" type="submit" disabled={busy}>{busy ? "Publishing…" : "Publish new version"}</Button></DialogActions>
      </Box>}
    </Dialog>
    <Dialog open={Boolean(history)} onClose={() => setHistory(null)} fullWidth slotProps={{ paper: { sx: { borderRadius: "20px" } } }}><DialogTitle sx={{ fontWeight: 800, bgcolor: "#f8fafc", p: 3 }}>Plan version history</DialogTitle><DialogContent>
      {history?.map(plan => <Box key={plan._id} sx={{ py: 3, borderBottom: "1px solid #e2e8f0" }}><Stack direction="row" spacing={1} alignItems="center" mb={1}><Chip size="small" label={`v${plan.version}`} sx={{ bgcolor: "#eef2ff", color: "#4f46e5", fontWeight: 800 }} /><Typography fontWeight={800} color="#1e293b">{plan.name} · {money(plan.amountPaise)} / {plan.interval === "monthly" ? "month" : "year"}</Typography></Stack><Typography variant="body2" color="#475569">{offerTerms(plan)}</Typography><Typography variant="caption" color="text.secondary" display="block" mt={1}>{plan.projectLimit} projects · {plan.available ? "Published" : "Hidden"} · {new Date(plan.createdAt).toLocaleString()}</Typography></Box>)}
    </DialogContent><DialogActions sx={{ p: 2 }}><Button sx={buttonSx} onClick={() => setHistory(null)}>Close</Button></DialogActions></Dialog>
  </Container></Box>;
}
