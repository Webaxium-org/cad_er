import { Alert, Box, Button, FormControlLabel, Grid, MenuItem, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { stoppingSightDistance } from "../../../utils/proposalWorkspace";

export default function ProposalDesignControls({ tab, design, onChange, onModeChange, stations, onTemplate }) {
  const update = (group, key, value) => onChange({ ...design, [group]: { ...design[group], [key]: value } });
  const field = (group, key, label, extra = {}) => <TextField size="small" fullWidth type="number" label={label} value={design[group][key]}
    onChange={(event) => update(group, key, event.target.value)} inputProps={{ step: "any" }} {...extra} />;
  const ssd = stoppingSightDistance(design.ssd);
  return <Stack spacing={2.5} sx={{ mt: 2.5 }}>
    <TextField select fullWidth label="PL creation method" value={design.mode} onChange={(event) => onModeChange(event.target.value)}>
      <MenuItem value="legacy">Quantity, width & length — current method</MenuItem>
      <MenuItem value="sloped">LS slope, CS slope, quantity, width & length</MenuItem>
      <MenuItem value="dimensions">Length × width × height</MenuItem>
      <MenuItem value="manual">Manually</MenuItem>
    </TextField>
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
        <FormControlLabel control={<Switch checked={design.ls.enabled} onChange={(event) => update("ls", "enabled", event.target.checked)} />} label="Apply LS slope" />
        {design.ls.enabled && <Stack spacing={1.5} sx={{ mt: 1 }}>
          {field("ls", "grade", "LS grade (%)", { helperText: "Positive rises with chainage; negative falls. 1% = 1 in 100." })}
          <TextField select fullWidth size="small" label="Set profile elevation" value={design.ls.strategy} onChange={(event) => update("ls", "strategy", event.target.value)}>
            <MenuItem value="quantity">Match target quantity</MenuItem><MenuItem value="minimum">Minimise total cutting + filling</MenuItem><MenuItem value="anchor">Set start RL</MenuItem>
          </TextField>
          {design.ls.strategy === "anchor" && field("ls", "anchorRl", "Start RL (m)")}
          {design.ls.strategy === "quantity" && <TextField size="small" select label="Target quantity represents" value={design.ls.quantityType} onChange={(event) => update("ls", "quantityType", event.target.value)}><MenuItem value="filling">Filling</MenuItem><MenuItem value="cutting">Cutting</MenuItem></TextField>}
          {design.ls.strategy === "minimum" && <Typography variant="caption" color="text.secondary">Optimises elevation for the entered grade and cross-section shape. Review the resulting cutting and filling before wrapping.</Typography>}
        </Stack>}
      </Box>
      <Box>
        <FormControlLabel control={<Switch checked={design.ssd.enabled} onChange={(event) => update("ssd", "enabled", event.target.checked)} />} label="SSD — stopping sight distance" />
        {design.ssd.enabled && <Stack spacing={1.5} sx={{ mt: 1 }}>
          <Grid container spacing={1.5}>{[["speed", "Design speed (km/h)"], ["reaction", "Reaction time (s)"], ["deceleration", "Deceleration (m/s²)"], ["grade", "Travel-direction grade (%)"]].map(([key, label]) => <Grid key={key} size={{ xs: 12, sm: 6 }}>{field("ssd", key, label)}</Grid>)}</Grid>
          <Alert severity={ssd == null ? "info" : "success"}>{ssd == null ? "Enter valid inputs; effective braking deceleration must be positive." : `Required SSD: ${ssd.toFixed(2)} m`}</Alert>
          <Typography variant="caption" color="text.secondary">Positive grade is uphill. Required distance is calculated from the entered assumptions; this does not measure available visibility over the terrain. <a href="https://www.txdot.gov/manuals/des/rdw/chapter-4--basic-design-criteria/4-11-sight-distance.html" target="_blank" rel="noreferrer">Equation reference</a></Typography>
        </Stack>}
      </Box>
    </>}
    {tab === "cs" && <>
      <Box>
        <FormControlLabel control={<Switch checked={design.cs.slopeEnabled} onChange={(event) => update("cs", "slopeEnabled", event.target.checked)} />} label="Apply CS slope (H:V)" />
        {design.cs.slopeEnabled && <Stack spacing={1.5} sx={{ mt: 1 }}>
          <Grid container spacing={1.5}><Grid size={6}>{field("cs", "horizontal", "Horizontal run")}</Grid><Grid size={6}>{field("cs", "vertical", "Vertical rise")}</Grid></Grid>
          <Typography variant="caption" color="text.secondary">1:0 is flat. Road and rail profiles fall away from the centre; waterway profiles rise outside the bed.</Typography>
          {design.template === "water" && field("cs", "bedWidth", "Flat bed width (m)")}
        </Stack>}
      </Box>
      <Box><FormControlLabel control={<Switch checked={design.cs.superelevationEnabled} onChange={(event) => update("cs", "superelevationEnabled", event.target.checked)} />} label="Superelevation" />
        {design.cs.superelevationEnabled && field("cs", "superelevation", "Crossfall (%)", { helperText: "Positive raises the right side; negative raises the left side." })}
      </Box>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography fontWeight={800}>Proposal breaks</Typography><Button startIcon={<FiPlus />} onClick={() => onChange({ ...design, breaks: [...design.breaks, { from: "", to: "", remark: "" }] })}>Add break</Button></Stack>
        <Typography variant="caption" color="text.secondary">Exclude these chainage intervals from proposed quantities.</Typography>
        <Stack spacing={1.5} sx={{ mt: 1.5 }}>{design.breaks.map((entry, index) => <Paper key={index} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Grid container spacing={1}>{["from", "to"].map((key) => <Grid size={6} key={key}><TextField fullWidth select size="small" label={key === "from" ? "From chainage" : "To chainage"} value={entry[key]} onChange={(event) => onChange({ ...design, breaks: design.breaks.map((item, i) => i === index ? { ...item, [key]: event.target.value } : item) })}>{stations.map((station) => <MenuItem key={station.chainage} value={station.chainage}>{station.chainage}</MenuItem>)}</TextField></Grid>)}</Grid>
          <Stack direction="row" gap={1} sx={{ mt: 1 }}><TextField size="small" fullWidth label="Reason" value={entry.remark} onChange={(event) => onChange({ ...design, breaks: design.breaks.map((item, i) => i === index ? { ...item, remark: event.target.value } : item) })} /><Button aria-label={`Remove break ${index + 1}`} color="error" onClick={() => onChange({ ...design, breaks: design.breaks.filter((_, i) => i !== index) })}><FiTrash2 /></Button></Stack>
        </Paper>)}</Stack>
      </Box>
    </>}
    {tab === "templates" && <Stack spacing={1.5}>
      {[{ key: "road", title: "Road way", detail: "Crowned profile with camber and optional crossfall." }, { key: "water", title: "Water way", detail: "Flat bed with editable bed width and side slope." }, { key: "rail", title: "Rail way", detail: "Formation profile with editable crossfall and LS grade." }].map((template) => <Paper key={template.key} variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: design.template === template.key ? "#595cf2" : "#e2e8f0" }}><Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}><Box><Typography fontWeight={800}>{template.title}</Typography><Typography variant="body2" color="text.secondary">{template.detail}</Typography></Box><Button variant="outlined" onClick={() => onTemplate(template.key)}>Use template</Button></Stack></Paper>)}
      <Typography variant="caption" color="text.secondary">Templates configure the new design controls. Enter the project’s dimensions and slopes before wrapping.</Typography>
    </Stack>}
  </Stack>;
}
