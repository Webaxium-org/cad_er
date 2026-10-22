import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiCreditCard, FiRefreshCw, FiRepeat, FiSearch, FiTrendingUp, FiUsers } from "react-icons/fi";
import { Alert, Box, Button, Chip, Container, InputAdornment, LinearProgress, Paper, Skeleton, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton,
  ToggleButtonGroup, Typography } from "@mui/material";
import AppHeader from "../../components/AppHeader";
import { heroTitleSx } from "../../components/pageHeaderStyles";
import { stopLoading } from "../../redux/loadingSlice";
import { getAdminSubscriptionPayments } from "../../services/subscriptionServices";

const violet = "#4f46e5";
const panel = { border: "1px solid #e0e7ff", borderRadius: "20px", bgcolor: "#fff",
  boxShadow: "0 10px 28px rgba(79,70,229,.05)" };
const money = paise => `₹${((paise || 0) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const dateTime = value => new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const errorMessage = error => error.response?.data?.message || error.message || "Payments could not be loaded.";
const localDate = value => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const dateInputValue = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dateBounds = (range, custom) => {
  if (range === "all") return {};
  if (range === "custom") {
    const from = localDate(custom.from);
    const to = localDate(custom.to);
    to.setDate(to.getDate() + 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  if (range === "week") from.setDate(from.getDate() - (from.getDay() + 6) % 7);
  if (range === "month") from.setDate(1);
  const to = new Date(from);
  if (range === "today") to.setDate(to.getDate() + 1);
  if (range === "week") to.setDate(to.getDate() + 7);
  if (range === "month") to.setMonth(to.getMonth() + 1);
  return { from: from.toISOString(), to: to.toISOString() };
};
const filterSx = { gap: .75, flexWrap: "wrap", "& .MuiToggleButton-root": { border: "1px solid #e0e7ff !important",
  borderRadius: "10px !important", px: 1.75, py: .75, fontWeight: 750, textTransform: "none", color: "#475569",
  "&.Mui-selected": { bgcolor: violet, color: "#fff", "&:hover": { bgcolor: "#4338ca" } } } };

function Metric({ icon, label, value, note }) {
  return <Paper elevation={0} sx={{ ...panel, p: 2.5, minWidth: 0 }}>
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box sx={{ width: 42, height: 42, flexShrink: 0, borderRadius: "12px", display: "grid", placeItems: "center",
        bgcolor: "#eef2ff", color: violet }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={650}>{label}</Typography>
        <Typography sx={{ mt: .25, color: "#1e1b4b", fontSize: { xs: "1.4rem", md: "1.7rem" }, fontWeight: 850,
          letterSpacing: "-.03em", overflowWrap: "anywhere" }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{note}</Typography>
      </Box>
    </Stack>
  </Paper>;
}

export default function AdminPayments() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [range, setRange] = useState("month");
  const [customFrom, setCustomFrom] = useState(() => dateInputValue(new Date()));
  const [customTo, setCustomTo] = useState(() => dateInputValue(new Date()));
  const [appliedCustom, setAppliedCustom] = useState(() => ({ from: dateInputValue(new Date()), to: dateInputValue(new Date()) }));
  const [phase, setPhase] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(stopLoading());
    let ignore = false;
    getAdminSubscriptionPayments({ range, phase, page, search, ...dateBounds(range, appliedCustom) }).then(({ data: result }) => {
      if (!ignore) { setData(result); setError(""); }
    }).catch(requestError => { if (!ignore) setError(errorMessage(requestError)); })
      .finally(() => { if (!ignore) setBusy(false); });
    return () => { ignore = true; };
  }, [dispatch, range, phase, page, search, refreshKey, appliedCustom]);

  const selectRange = (_, value) => { if (value) { setBusy(true); setPage(1); setRange(value); } };
  const applyCustom = event => {
    event.preventDefault();
    if (!customFrom || !customTo || customFrom > customTo) { setError("Choose a valid start and end date."); return; }
    setBusy(true); setError(""); setPage(1); setAppliedCustom({ from: customFrom, to: customTo });
  };
  const selectPhase = (_, value) => { if (value) { setBusy(true); setPage(1); setPhase(value); } };
  const applySearch = event => { event.preventDefault(); setBusy(true); setPage(1); setSearch(searchInput.trim()); };
  const refresh = () => { setBusy(true); setRefreshKey(key => key + 1); };
  const metrics = data?.metrics;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const knownPaise = (metrics?.initialPaise || 0) + (metrics?.recurringPaise || 0);
  const legacyPaise = Math.max(0, (metrics?.grossPaise || 0) - knownPaise);

  return <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9ff", pb: 9 }}>
    <AppHeader showSearch={false} showNotifications={false} />
    <Box sx={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", color: "#fff",
      borderRadius: "0 0 20px 20px", pt: { xs: 7, md: 9 }, pb: { xs: 12, md: 13 }, boxShadow: "0 12px 36px rgba(79,70,229,.18)" }}>
      <Container maxWidth="lg">
        <Stack direction="row" spacing={1.5} alignItems="center"><FiCreditCard size={32} />
          <Typography component="h1" sx={heroTitleSx} fontWeight={900}>Subscription <Box component="span" sx={{ color: "#c7d2fe" }}>payments</Box></Typography>
        </Stack>
        <Typography sx={{ mt: 1, maxWidth: 620, opacity: .9 }}>Review captured payments, customer activity, and billing phases.</Typography>
      </Container>
    </Box>

    <Container maxWidth="lg" sx={{ mt: -8, position: "relative" }}>
      <Paper elevation={0} sx={{ ...panel, p: { xs: 2, md: 3 }, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2}>
          <Box><Typography variant="h6" fontWeight={850} color="#1e1b4b">Payment overview</Typography>
            <Typography variant="body2" color="text.secondary">Gross captured INR payments. Refunds are not deducted.</Typography></Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            <Button onClick={() => navigate("/settings")} sx={{ color: violet, textTransform: "none", fontWeight: 750 }}>Plan settings</Button>
            <Button startIcon={<FiRefreshCw />} onClick={refresh} disabled={busy} variant="outlined"
              sx={{ color: violet, borderColor: "#c7d2fe", borderRadius: 2, textTransform: "none", fontWeight: 750 }}>Refresh</Button>
          </Stack>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }} justifyContent="space-between">
          <ToggleButtonGroup exclusive size="small" value={range} onChange={selectRange} aria-label="Payment date range" sx={filterSx}>
            <ToggleButton value="today">Today</ToggleButton><ToggleButton value="week">This week</ToggleButton>
            <ToggleButton value="month">This month</ToggleButton><ToggleButton value="custom">Custom</ToggleButton>
            <ToggleButton value="all">All time</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup exclusive size="small" value={phase} onChange={selectPhase} aria-label="Payment phase" sx={filterSx}>
            <ToggleButton value="all">All payments</ToggleButton><ToggleButton value="initial">First period</ToggleButton><ToggleButton value="recurring">Renewals</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        {range === "custom" && <Box component="form" onSubmit={applyCustom} sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", mt: 2.5 }}>
          <TextField label="From" type="date" size="small" value={customFrom} onChange={event => setCustomFrom(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }} inputProps={{ max: customTo }} />
          <TextField label="Through" type="date" size="small" value={customTo} onChange={event => setCustomTo(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }} inputProps={{ min: customFrom }} />
          <Button type="submit" variant="contained" sx={{ bgcolor: violet, borderRadius: 2, textTransform: "none", "&:hover": { bgcolor: "#4338ca" } }}>Apply dates</Button>
        </Box>}
      </Paper>

      {busy && <LinearProgress sx={{ mb: 2, borderRadius: 2, bgcolor: "#e0e7ff", "& .MuiLinearProgress-bar": { bgcolor: violet } }} />}
      {error && <Alert severity="error" sx={{ mb: 2, bgcolor: "#eef2ff", color: "#312e81", border: "1px solid #c7d2fe",
        "& .MuiAlert-icon": { color: violet } }}>{error}</Alert>}
      {!data && busy && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        {[1, 2, 3, 4].map(key => <Skeleton key={key} variant="rounded" height={126} />)}
      </Box>}
      {metrics && <>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
          <Metric icon={<FiTrendingUp size={20} />} label="Gross captured" value={money(metrics.grossPaise)} note="Before refunds" />
          <Metric icon={<FiCreditCard size={20} />} label="Payments" value={metrics.count.toLocaleString("en-IN")} note="Successful charges" />
          <Metric icon={<FiUsers size={20} />} label="Paying customers" value={metrics.customers.toLocaleString("en-IN")} note="Distinct accounts" />
          <Metric icon={<FiRepeat size={20} />} label="Average payment" value={money(metrics.count ? metrics.grossPaise / metrics.count : 0)} note="Per captured charge" />
        </Box>
        <Paper elevation={0} sx={{ ...panel, p: { xs: 2, md: 3 }, mb: 3 }}>
          <Typography fontWeight={850} color="#1e1b4b" sx={{ mb: 2 }}>Payment mix</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            {[["First period", metrics.initialPaise, metrics.initialCount], ["Renewals", metrics.recurringPaise, metrics.recurringCount],
              ...(legacyPaise ? [["Older records", legacyPaise, metrics.count - metrics.initialCount - metrics.recurringCount]] : [])]
              .map(([label, amount, count]) => <Box key={label} sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" justifyContent="space-between" spacing={1}><Typography variant="body2" fontWeight={750} color="#475569">{label}</Typography>
                  <Typography variant="body2" fontWeight={850} color="#312e81">{money(amount)}</Typography></Stack>
                <Box sx={{ height: 8, mt: 1, mb: .5, borderRadius: 8, bgcolor: "#e0e7ff", overflow: "hidden" }}>
                  <Box sx={{ height: "100%", width: `${metrics.grossPaise ? amount / metrics.grossPaise * 100 : 0}%`, bgcolor: violet, borderRadius: 8 }} />
                </Box>
                <Typography variant="caption" color="text.secondary">{count} payment{count === 1 ? "" : "s"}</Typography>
              </Box>)}
          </Stack>
        </Paper>
      </>}

      <Paper elevation={0} sx={{ ...panel, overflow: "hidden" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ md: "center" }} sx={{ p: { xs: 2, md: 3 } }}>
          <Box><Typography variant="h6" fontWeight={850} color="#1e1b4b">Payment history</Typography>
            <Typography variant="body2" color="text.secondary">{data?.total || 0} matching payments</Typography></Box>
          <Box component="form" onSubmit={applySearch} sx={{ display: "flex", gap: 1, width: { xs: "100%", md: 400 } }}>
            <TextField size="small" fullWidth value={searchInput} onChange={event => setSearchInput(event.target.value)}
              placeholder="Customer, email or Razorpay ID" inputProps={{ "aria-label": "Search payments" }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><FiSearch /></InputAdornment> } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
            <Button type="submit" variant="contained" sx={{ bgcolor: violet, borderRadius: 2.5, textTransform: "none", "&:hover": { bgcolor: "#4338ca" } }}>Search</Button>
          </Box>
        </Stack>
        <TableContainer sx={{ borderTop: "1px solid #e0e7ff" }}>
          <Table sx={{ minWidth: 850 }}>
            <TableHead sx={{ bgcolor: "#f5f6ff" }}><TableRow>
              {["Date", "Customer", "Plan", "Type", "Invoice number", "Payment ID", "Amount"].map(label => <TableCell key={label}
                sx={{ color: "#4338ca", fontWeight: 850, fontSize: ".75rem", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</TableCell>)}
            </TableRow></TableHead>
            <TableBody>
              {data?.payments.map(payment => <TableRow key={payment.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                <TableCell sx={{ whiteSpace: "nowrap", color: "#475569" }}>{dateTime(payment.createdAt)}</TableCell>
                <TableCell><Typography variant="body2" fontWeight={750} color="#1e1b4b">{payment.customer?.name || "Deleted account"}</Typography>
                  <Typography variant="caption" color="text.secondary">{payment.customer?.email || "—"}</Typography></TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#1e1b4b" }}>{payment.planName}</TableCell>
                <TableCell><Chip size="small" label={payment.phase === "initial" ? "First period" : payment.phase === "recurring" ? "Renewal" : "Legacy"}
                  sx={{ bgcolor: "#eef2ff", color: "#4338ca", fontWeight: 750 }} /></TableCell>
                <TableCell sx={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>{payment.invoiceNumber || "—"}</TableCell>
                <TableCell sx={{ fontFamily: "monospace", fontSize: ".77rem", color: "#475569" }}>{payment.paymentId || "—"}</TableCell>
                <TableCell sx={{ fontWeight: 850, color: "#312e81", whiteSpace: "nowrap" }}>{money(payment.amountPaise)}</TableCell>
              </TableRow>)}
              {data && !data.payments.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: "#64748b" }}>No captured payments match these filters.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderTop: "1px solid #e0e7ff" }}>
          <Typography variant="body2" color="text.secondary">Page {page} of {pages}</Typography>
          <Stack direction="row" spacing={1}>
            <Button aria-label="Previous page" disabled={busy || page <= 1} onClick={() => { setBusy(true); setPage(value => value - 1); }} sx={{ color: violet, minWidth: 40 }}><FiChevronLeft /></Button>
            <Button aria-label="Next page" disabled={busy || page >= pages} onClick={() => { setBusy(true); setPage(value => value + 1); }} sx={{ color: violet, minWidth: 40 }}><FiChevronRight /></Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  </Box>;
}
