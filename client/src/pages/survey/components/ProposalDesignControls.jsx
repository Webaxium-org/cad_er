import { proposalTemplates } from "../../../utils/proposalTemplates";
import { useState } from "react";
import AlertDialogSlide from "../../../components/AlertDialogSlide";
import { Alert, Box, Button, FormControlLabel, Grid, IconButton, InputAdornment, LinearProgress, MenuItem, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { FiPlus, FiTrash2, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { stoppingSightDistance } from "../../../utils/proposalWorkspace";

export default function ProposalDesignControls({ tab, crossSection, isWaterWay, design, onChange, stations, onTemplate, startRl, startChainage, previewBusy = false, previewError = "", previewValidation = false }) {
  const [transportSystem, setTransportSystem] = useState(design.template || "road");
  const [customOpen, setCustomOpen] = useState(false);
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState([]);
  const [customError, setCustomError] = useState("");
  const openCustom = () => {
    const saved = design.ls.custom;
    setCustomDraft(saved?.segments?.map(segment => ({ ...segment })) || (saved?.from ? [{ from: saved.from, to: saved.to,
      grade: String((saved.direction === "falling" ? -1 : 1) * 100 / Number(saved.denominator)) }]
      : [{ from: stations[0]?.chainage || "", to: stations[1]?.chainage || "", grade: "0" }]));
    setCustomError(""); setCustomOpen(true);
  };
  const update = (group, key, value) => onChange({ ...design, [group]: { ...design[group], [key]: value } });
  const field = (group, key, label, extra = {}) => <TextField size="small" fullWidth type="number" label={label} value={design[group][key]}
    onChange={(event) => update(group, key, event.target.value)} inputProps={{ step: "any" }} {...extra} />;
  const ssd = stoppingSightDistance(design.ssd);
  const downward = String(design.ls.grade).startsWith("-");
  return <Stack spacing={2.5} sx={{ mt: 2.5 }}>
    {design.mode === "dimensions" && <Box>
      <Grid container spacing={1.5}>{[["length", "Length (m)"], ["width", "Width (m)"], ["height", "Height (m)"]].map(([key, label]) => <Grid key={key} size={{ xs: 12, sm: 4 }}>{field("dimensions", key, label, { inputProps: { min: 0, step: "any" } })}</Grid>)}</Grid>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Target quantity: {Object.values(design.dimensions).every((value) => Number(value) > 0) ? (Number(design.dimensions.length) * Number(design.dimensions.width) * Number(design.dimensions.height)).toFixed(3) : "—"} m³. This volume is passed to the current proposal generator.</Typography>
    </Box>}
    {tab === "ls" && <>
      {design.mode === "manual" && <TableContainer sx={{ maxHeight: 270, border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Table stickyHeader size="small"><TableHead><TableRow><TableCell>Chainage</TableCell><TableCell>Proposed LS RL (m)</TableCell></TableRow></TableHead><TableBody>
          {stations.map((station) => <TableRow key={station.chainage}><TableCell>{station.chainage}</TableCell><TableCell><TextField size="small" type="number" value={design.manualLevels[station.chainage] ?? ""} inputProps={{ step: "0.001", "aria-label": `Proposed RL at ${station.chainage}` }} onChange={(event) => onChange({ ...design, manualLevels: { ...design.manualLevels, [station.chainage]: event.target.value } })} /></TableCell></TableRow>)}
        </TableBody></Table>
      </TableContainer>}
      <Box>
        <FormControlLabel control={<Switch checked={design.ls.enabled} onChange={(event) => update("ls", "enabled", event.target.checked)} />} label="Grade optimisation" />
        {design.ls.enabled && <Stack spacing={1.5} sx={{ mt: 1 }}>
          {!["custom", "quantity"].includes(design.ls.strategy) && field("ls", "grade", "LS grade (%)", { helperText: "Positive rises with chainage; negative falls. 1% = 1 in 100." })}
          <TextField select fullWidth size="small" label="Set profile elevation" value={design.ls.strategy} onChange={(event) => { if (event.target.value === "custom") openCustom(); else { update("ls", "strategy", event.target.value); if (event.target.value === "quantity") setComplianceOpen(true); } }}>
            <MenuItem value="minimum">Quantity optimisation</MenuItem><MenuItem value="quantity">Quantity compliance</MenuItem><MenuItem value="anchor">Set start level</MenuItem><MenuItem value="custom">Custom slope</MenuItem>
          </TextField>
          {design.ls.strategy === "quantity" && <>
            <Button variant="outlined" onClick={() => setComplianceOpen(true)} sx={{ alignSelf: "flex-start", borderRadius: "12px", textTransform: "none", color: "#4f46e5", borderColor: "#c7d2fe" }}>Edit quantity compliance</Button>
            <AlertDialogSlide open={complianceOpen} title="Quantity compliance" submitButtonText="Done"
              onCancel={() => setComplianceOpen(false)} onSubmit={() => setComplianceOpen(false)}
              paperSx={{ borderRadius: "24px", border: "1px solid #e0e7ff" }}
              content={<Box sx={{ p: { xs: 2, sm: 2.5 }, border: "1px solid #e0e7ff", borderRadius: "20px", bgcolor: "#ffffff",
            "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#f8f9fe", "& fieldset": { borderColor: "#dce0ef" }, "&.Mui-focused fieldset": { borderColor: "#6366f1" } } }}>
            <Stack spacing={1.5}>
            {previewBusy && <LinearProgress aria-label="Calculating start RL" sx={{ borderRadius: 1 }} />}
            {previewError && !previewValidation && <Alert severity="warning">{Number.isFinite(startRl) ? "Showing the last calculated start RL. " : "Start RL is unavailable. "}{previewError}</Alert>}
            {!previewBusy && !previewError && !Number.isFinite(startRl) && <Alert severity="info">Select both design layers and complete the dimensions to calculate the start RL.</Alert>}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography component="label" htmlFor="compliance-start-rl" sx={{ display: "block", mb: 1, fontSize: "0.9rem", fontWeight: 600, color: "#334155" }}>Start RL{startChainage ? ` @ ${startChainage}` : ""} (m)</Typography>
                <TextField id="compliance-start-rl" fullWidth size="small" value={Number.isFinite(startRl) ? startRl.toFixed(3) : ""} placeholder={previewBusy ? "Calculating..." : "Awaiting valid inputs"}
                  helperText={Number.isFinite(startRl) && (previewBusy || previewError) ? "Last calculated start RL" : undefined}
                  slotProps={{ input: { readOnly: true }, htmlInput: { "aria-label": "Calculated start RL", style: { fontVariantNumeric: "tabular-nums" } } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography component="label" htmlFor="compliance-slope" sx={{ display: "block", mb: 1, fontSize: "0.9rem", fontWeight: 600, color: "#334155" }}>Slope magnitude (%)</Typography>
                <TextField id="compliance-slope" fullWidth size="small" type="number" value={design.ls.grade === "" ? "" : Math.abs(Number(design.ls.grade))}
                  onChange={event => update("ls", "grade", event.target.value === "" ? "" : `${downward ? "-" : ""}${Math.abs(Number(event.target.value))}`)}
                  slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }, htmlInput: { min: 0, step: "any", "aria-label": "Slope magnitude (%)" } }} />
              </Grid>
              <Grid size={12}>
                <Typography sx={{ mb: 1, fontSize: "0.9rem", fontWeight: 600, color: "#334155" }}>Gradient direction</Typography>
                <Stack role="group" aria-label="Gradient direction" direction="row" spacing={1.5}>
                  {[{ negative: false, label: "Upward (+)", icon: <FiTrendingUp /> }, { negative: true, label: "Downward (-)", icon: <FiTrendingDown /> }].map(option => {
                    const selected = downward === option.negative;
                    return <Button key={option.label} fullWidth disableElevation aria-pressed={selected} startIcon={option.icon}
                      onClick={() => update("ls", "grade", `${option.negative ? "-" : ""}${Math.abs(Number(design.ls.grade) || 0)}`)}
                      sx={{ minWidth: 0, py: 1.25, px: 1, borderRadius: "12px", textTransform: "none", fontWeight: 600,
                        border: "1px solid", borderColor: selected ? "#6366f1" : "#dce0ef", bgcolor: selected ? "#eef2ff" : "#f8f9fe",
                        color: selected ? "#4f46e5" : "#64748b", "&:hover": { bgcolor: "#e0e7ff", borderColor: "#6366f1" } }}>{option.label}</Button>;
                  })}
                </Stack>
              </Grid>
            </Grid>
            </Stack>
          </Box>} />
          </>}
          {design.ls.strategy === "anchor" && field("ls", "anchorRl", "Start RL (m)")}
          {design.ls.strategy === "custom" && <Button onClick={openCustom}>Edit custom slope</Button>}
          <AlertDialogSlide open={customOpen} title="Custom profile" cancelButtonText="Cancel" submitButtonText="Apply slopes"
            paperSx={{ maxWidth: "760px", borderRadius: "24px", border: "1px solid #e0e7ff" }}
            onCancel={() => setCustomOpen(false)} onSubmit={() => {
              let previousEnd = -1;
              if (!customDraft.length) { setCustomError("Add at least one chainage segment."); return; }
              for (const [index, segment] of customDraft.entries()) {
                const from = stations.findIndex(row => row.chainage === segment.from);
                const to = stations.findIndex(row => row.chainage === segment.to);
                if (from < 0 || to <= from || from < previousEnd || String(segment.grade).trim() === "" || !Number.isFinite(Number(segment.grade))) {
                  setCustomError(`Segment ${index + 1}: choose increasing chainages in order, without overlap, and enter a valid slope.`); return;
                }
                previousEnd = to;
              }
              onChange({ ...design, ls: { ...design.ls, strategy: "custom", custom: { segments: customDraft.map(segment => ({ ...segment })) } } });
              setCustomOpen(false);
            }} content={<Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography fontWeight={600} color="#334155">Chainage segments &amp; slopes</Typography>
                <Button variant="contained" disableElevation startIcon={<FiPlus />} disabled={customDraft.length >= 100} onClick={() => {
                  const last = customDraft.at(-1);
                  const next = last ? stations.findIndex(row => row.chainage === last.to) : 0;
                  setCustomDraft(previous => [...previous, { from: stations[next]?.chainage || "", to: stations[next + 1]?.chainage || "", grade: "0" }]);
                  setCustomError("");
                }} sx={{ flexShrink: 0, bgcolor: "#6366f1", borderRadius: "10px", textTransform: "none", "&:hover": { bgcolor: "#4f46e5" } }}>Add segment</Button>
              </Stack>
              <TableContainer sx={{ border: "1px solid #e0e7ff", borderRadius: "14px", maxHeight: 360 }}>
                <Table size="small" stickyHeader sx={{ minWidth: 480, "& th": { bgcolor: "#eef2ff", color: "#4f46e5", fontWeight: 700 }, "& td": { borderColor: "#eef2ff", py: 1.5 } }}>
                  <TableHead><TableRow><TableCell>Start</TableCell><TableCell>End</TableCell><TableCell>Slope (%)</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
                  <TableBody>{customDraft.map((segment, index) => <TableRow key={index}>
                    {["from", "to"].map(key => <TableCell key={key}><TextField select size="small" fullWidth value={segment[key]} slotProps={{ htmlInput: { "aria-label": `Segment ${index + 1} ${key === "from" ? "start" : "end"} chainage` } }}
                      onChange={event => { setCustomDraft(previous => previous.map((row, i) => i === index ? { ...row, [key]: event.target.value } : row)); setCustomError(""); }}
                      sx={{ minWidth: 120, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#f8f9fe" } }}>
                      {stations.map(row => <MenuItem key={row.chainage} value={row.chainage}>{row.chainage}</MenuItem>)}
                    </TextField></TableCell>)}
                    <TableCell><TextField type="number" size="small" value={segment.grade} slotProps={{ htmlInput: { step: "any", "aria-label": `Segment ${index + 1} slope (%)` } }}
                      onChange={event => { setCustomDraft(previous => previous.map((row, i) => i === index ? { ...row, grade: event.target.value } : row)); setCustomError(""); }}
                      sx={{ width: 100, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#f8f9fe" } }} /></TableCell>
                    <TableCell align="right"><IconButton color="error" aria-label={`Delete segment ${index + 1}`} onClick={() => { setCustomDraft(previous => previous.filter((_, i) => i !== index)); setCustomError(""); }}><FiTrash2 /></IconButton></TableCell>
                  </TableRow>)}</TableBody>
                </Table>
              </TableContainer>
              <Typography variant="caption" color="text.secondary">Positive slopes rise; negative slopes fall. Connected segments continue from the previous end level. Levels outside the selected segments stay unchanged.</Typography>
              {customError && <Alert severity="error">{customError}</Alert>}
            </Stack>} />
          {design.ls.strategy === "minimum" && <Typography variant="caption" color="text.secondary">Balances cutting and filling to minimise total earthwork for the entered grade and cross-section shape. Review the resulting cutting and filling before wrapping.</Typography>}
        </Stack>}
      </Box>
      <Box>
        <FormControlLabel control={<Switch checked={design.ssd.enabled} onChange={(event) => update("ssd", "enabled", event.target.checked)} />} label={
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <span>SSD — stopping sight distance</span>
            <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: "999px", bgcolor: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe", fontSize: "0.7rem", fontWeight: 700, lineHeight: 1.5 }}>Upcoming</Box>
          </Box>
        } />
        {design.ssd.enabled && <Stack spacing={1.5} sx={{ mt: 1 }}>
          <Grid container spacing={1.5}>{[["speed", "Design speed (km/h)"], ["reaction", "Reaction time (s)"], ["deceleration", "Deceleration (m/s²)"], ["grade", "Travel-direction grade (%)"]].map(([key, label]) => <Grid key={key} size={{ xs: 12, sm: 6 }}>{field("ssd", key, label)}</Grid>)}</Grid>
          <Alert severity={ssd == null ? "info" : "success"}>{ssd == null ? "Enter valid inputs; effective braking deceleration must be positive." : `Required SSD: ${ssd.toFixed(2)} m`}</Alert>
          <Typography variant="caption" color="text.secondary">Positive grade is uphill. Required distance is calculated from the entered assumptions; this does not measure available visibility over the terrain. <a href="https://www.txdot.gov/manuals/des/rdw/chapter-4--basic-design-criteria/4-11-sight-distance.html" target="_blank" rel="noreferrer">Equation reference</a></Typography>
        </Stack>}
      </Box>
    </>}
    {tab === "cs" && <>
      {crossSection === "slop" && <>
      {!isWaterWay && <Box><FormControlLabel control={<Switch checked={design.cs.superelevationEnabled} onChange={(event) => update("cs", "superelevationEnabled", event.target.checked)} />} label="Superelevation" />
        {design.cs.superelevationEnabled && field("cs", "superelevation", "Crossfall (%)", { helperText: "Positive raises the right side; negative raises the left side." })}
      </Box>}
      <Box>
        <FormControlLabel label="Fixed bottom width" control={<Switch checked={Boolean(design.cs.fixedBottomEnabled)} onChange={event => onChange({ ...design, cs: { ...design.cs, fixedBottomEnabled: event.target.checked, slopeEnabled: event.target.checked ? false : design.cs.slopeEnabled } })} />} />
        {design.cs.fixedBottomEnabled && <Stack spacing={1.5} sx={{ mt: 1 }}>
          {field("cs", "bottomWidth", "Bottom width (m)")}
          <Stack direction="row" spacing={1.5}>{[["fixedLhs", "LHS (H:V)"], ["fixedRhs", "RHS (H:V)"]].map(([key, label]) => <TextField key={key} fullWidth size="small" label={label} value={design.cs[key] ?? "1:1"} onChange={event => update("cs", key, event.target.value)} />)}</Stack>
        </Stack>}
      </Box>
      <Box>
        <FormControlLabel control={<Switch checked={design.cs.slopeEnabled} onChange={(event) => onChange({ ...design, cs: { ...design.cs, slopeEnabled: event.target.checked, fixedBottomEnabled: event.target.checked ? false : design.cs.fixedBottomEnabled } })} />} label="CS slope" />
        {design.cs.slopeEnabled && <Stack spacing={1.5} sx={{ mt: 1 }}>
          <Grid container spacing={1.5}>
            {[["horizontal", "Horizontal run"], ["vertical", "Vertical rise"]].map(([key, label]) => <Grid key={key} size={6}>
              <TextField size="small" fullWidth type="number" label={label} value={design.cs[key]} inputProps={{ min: 0, step: "any" }}
                onChange={event => {
                  const cs = { ...design.cs, [key]: event.target.value };
                  const ratio = `${cs.horizontal}:${cs.vertical}`;
                  onChange({ ...design, cs: { ...cs, lhs: ratio, rhs: ratio } });
                }} />
            </Grid>)}
          </Grid>
          <Typography variant="caption" color="text.secondary">The shared H:V ratio fills both sides. Adjust LHS or RHS below for different side slopes.</Typography>
          <Stack direction="row" spacing={1.5}>{[["lhs", "LHS (H:V)"], ["rhs", "RHS (H:V)"]].map(([key, label]) => <TextField key={key} fullWidth size="small" label={label} value={design.cs[key] ?? "1:1"} onChange={event => update("cs", key, event.target.value)} />)}</Stack>
          {field("cs", "berm", "Berm (m)", { helperText: "Inset from each surveyed edge. 0 starts at the edge; 1 starts 1 m inward on each side." })}
        </Stack>}
      </Box>
      </>}

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography fontWeight={800}>Proposal breaks</Typography><Button startIcon={<FiPlus />} onClick={() => onChange({ ...design, breaks: [...design.breaks, { from: "", to: "", remark: "" }] })}>Add break</Button></Stack>
        <Typography variant="caption" color="text.secondary">Exclude these chainage intervals from proposed quantities.</Typography>
        <Stack spacing={1.5} sx={{ mt: 1.5 }}>{design.breaks.map((entry, index) => <Paper key={index} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Grid container spacing={1}>{["from", "to"].map((key) => <Grid size={6} key={key}><TextField fullWidth select size="small" label={key === "from" ? "From chainage" : "To chainage"} value={entry[key]} onChange={(event) => onChange({ ...design, breaks: design.breaks.map((item, i) => i === index ? { ...item, [key]: event.target.value } : item) })}>{stations.map((station) => <MenuItem key={station.chainage} value={station.chainage}>{station.chainage}</MenuItem>)}</TextField></Grid>)}</Grid>
          <Stack direction="row" gap={1} sx={{ mt: 1 }}><TextField size="small" fullWidth label="Reason" value={entry.remark} onChange={(event) => onChange({ ...design, breaks: design.breaks.map((item, i) => i === index ? { ...item, remark: event.target.value } : item) })} /><Button aria-label={`Remove break ${index + 1}`} color="error" onClick={() => onChange({ ...design, breaks: design.breaks.filter((_, i) => i !== index) })}><FiTrash2 /></Button></Stack>
        </Paper>)}</Stack>
      </Box>
    </>}
    {tab === "templates" && <Stack spacing={2} sx={{
      color: "#1e293b",
      "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#f8f9fe", "& fieldset": { borderColor: "#e2e8f0" }, "&:hover fieldset": { borderColor: "#a5a6f6" }, "&.Mui-focused fieldset": { borderColor: "#6366f1" } },
      "& .MuiInputLabel-root.Mui-focused": { color: "#6366f1" },
    }}>
      <Typography fontWeight={800} sx={{ color: "#312e81", fontSize: { xs: "1.1rem", sm: "1.25rem" }, letterSpacing: "-0.025em" }}>Select transport system</Typography>
      <Stack direction="row" spacing={0.75} sx={{ p: 0.75, bgcolor: "#eef2ff", border: "1px solid #e0e7ff", borderRadius: "18px" }}>
        {[{ key: "road", title: "Road way" }, { key: "water", title: "Water way" }, { key: "rail", title: "Rail way" }].map(system => <Button key={system.key} fullWidth variant={transportSystem === system.key ? "contained" : "outlined"} aria-pressed={transportSystem === system.key} onClick={() => setTransportSystem(system.key)} disableElevation sx={{ textTransform: "none", minWidth: 0, px: { xs: 0.75, sm: 2 }, py: 1.25, borderRadius: "12px", fontWeight: 700, fontSize: { xs: "0.78rem", sm: "0.9rem" }, border: "none", bgcolor: transportSystem === system.key ? "#6366f1" : "transparent", color: transportSystem === system.key ? "#ffffff" : "#4f46e5", boxShadow: transportSystem === system.key ? "0 4px 12px rgba(99,102,241,0.22)" : "none", "&:hover": { border: "none", bgcolor: transportSystem === system.key ? "#4f46e5" : "#e0e7ff" } }}>{system.title}</Button>)}
      </Stack>
      <Typography color="text.secondary">Choose a template to apply its cross-section to the graph.</Typography>
      {proposalTemplates.filter(preset => preset.system === transportSystem).map(preset => <Paper key={preset.id} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: "20px", borderColor: design.templateId === preset.id ? "#a5a6f6" : "#e2e8f0", bgcolor: design.templateId === preset.id ? "#eef2ff" : "#ffffff", boxShadow: design.templateId === preset.id ? "0 6px 18px rgba(99,102,241,0.08)" : "none", transition: "background-color 180ms, border-color 180ms" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box><Typography fontWeight={700}>{preset.name}</Typography>
            <Typography component="span" variant="caption" sx={{ display: "inline-block", my: 0.75, px: 1, py: 0.25, borderRadius: "999px", bgcolor: "#e0e7ff", color: "#4f46e5", fontWeight: 700 }}>Example profile</Typography>
            <Typography variant="body2" color="text.secondary">{preset.system === "water" ? "Bottom" : "Formation"} width: {preset.width} m ? LHS {preset.lhs} ? RHS {preset.rhs}</Typography>
          </Box>
          <Button variant="outlined" sx={{ flexShrink: 0, borderRadius: "12px", px: 2, py: 1, textTransform: "none", fontWeight: 700, color: "#4f46e5", borderColor: "#c7d2fe", bgcolor: "#ffffff", "&:hover": { borderColor: "#6366f1", bgcolor: "#e0e7ff" } }} aria-pressed={design.templateId === preset.id} onClick={() => onTemplate(preset)}>{design.templateId === preset.id ? "Reapply" : "Apply template"}</Button>
        </Stack>
      </Paper>)}
      {design.templateId && <Box sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: "20px", bgcolor: "#f8f9fe", border: "1px solid #e0e7ff" }}><Typography fontWeight={700} color="#312e81">Edit selected example</Typography><Stack spacing={1.5} sx={{ mt: 1 }}>
        {field("cs", "bottomWidth", "Bottom / formation width (m)")}
        <Stack direction="row" spacing={1}>{[["fixedLhs", "LHS (H:V)"], ["fixedRhs", "RHS (H:V)"]].map(([key, label]) => <TextField key={key} fullWidth size="small" label={label} value={design.cs[key]} onChange={event => update("cs", key, event.target.value)} />)}</Stack>
      </Stack></Box>}

      <Typography variant="caption" color="text.secondary">Templates configure the new design controls. Enter the project’s dimensions and slopes before wrapping.</Typography>
    </Stack>}
  </Stack>;
}
