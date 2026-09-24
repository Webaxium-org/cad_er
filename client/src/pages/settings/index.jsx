import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  FiBriefcase,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiMonitor,
  FiPlus,
  FiSave,
  FiServer,
  FiSettings,
  FiTool,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import BigHeader from "../../components/BigHeader";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import { getSettings, saveSettings } from "../../services/settingsServices";

const defaults = {
  units: "metric",
  pegName: "Chainage",
  rlMethod: "HI Method",
  areaCalculation: "Modern / Tabular",
  volumeCalculation: "Modern / Tabular",
  displayMode: "Light",
  commissioningType: "Government",
  governmentLevel: "State",
  commissioning: { Government: {}, "Corporate / Private": {} },
  instruments: [],
  staff: {},
  plsPoints: [],
  checkLevel: { count: "", deduction: "" },
  hatch: { type: "Solid", color: "#6366f1", layer: "" },
  sectionView: {
    horizontalScale: "100",
    verticalScale: "100",
    showGrid: true,
    showLabels: true,
  },
};
const governmentFields = [
  "Department",
  "Agreement No.",
  "Division",
  "Sub-Division",
  "Section",
  "Contractor",
];
const privateFields = [
  "Client",
  "Agreement No.",
  "Contractor",
  "Consultant",
  "Additional field 1",
  "Additional field 2",
];
const staffRoles = [
  "Engineer / Site In-Charge",
  "Senior Surveyor",
  "Junior Surveyor",
];
const cardSx = {
  p: { xs: 3, md: 4 },
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  mb: 4,
  position: "relative",
  overflow: "hidden",
  bgcolor: "#fff",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: 6,
    height: "100%",
    bgcolor: "#6366f1",
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    bgcolor: "#f8fafc",
    "& fieldset": { borderColor: "#e2e8f0" },
    "&:hover fieldset": { borderColor: "#6366f1" },
    "&.Mui-focused fieldset": { borderColor: "#6366f1" },
  },
  "& .MuiInputLabel-root": { fontWeight: 600, color: "#64748b" },
};

function Section({ title, detail, icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
    >
      <Paper elevation={0} sx={cardSx}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              bgcolor: "#6366f115",
              color: "#6366f1",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#1e293b">
              {title}
            </Typography>
            {detail && (
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
              >
                {detail}
              </Typography>
            )}
          </Box>
        </Stack>
        <Divider sx={{ my: 3, borderColor: "#e2e8f0" }} />
        {children}
      </Paper>
    </motion.div>
  );
}
function Select({ label, value, onChange, options, ...props }) {
  return (
    <TextField
      select
      fullWidth
      label={label}
      value={value}
      onChange={onChange}
      {...props}
    >
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  );
}
const toggleSx = {
  flexWrap: "wrap",
  "& .MuiToggleButton-root": {
    borderRadius: "10px !important",
    px: 2,
    fontWeight: 700,
    fontSize: "0.8rem",
    color: "#64748b",
    borderColor: "#e2e8f0",
    "&.Mui-selected": {
      bgcolor: "#6366f1",
      color: "white",
      borderColor: "#6366f1",
      "&:hover": { bgcolor: "#4f46e5" },
    },
  },
};

export default function Settings() {
  const dispatch = useDispatch();
  const { global: loading } = useSelector((state) => state.loading);
  const [settings, setSettings] = useState(defaults);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState(null);
  const [expandedStaffRole, setExpandedStaffRole] = useState(staffRoles[0]);
  useEffect(() => {
    let active = true;
    dispatch(startLoading());
    getSettings()
      .then(({ data }) => {
        const {
          plsShift: _removedPlsShift,
          reportModel: _removedReportModel,
          graphFields: _removedGraphFields,
          ...savedSettings
        } = data.settings || {};
        const savedCommissioning = savedSettings.commissioning || {};
        const commissioning =
          savedCommissioning.Government ||
          savedCommissioning["Corporate / Private"]
            ? { ...defaults.commissioning, ...savedCommissioning }
            : {
                ...defaults.commissioning,
                [savedSettings.commissioningType || "Government"]:
                  savedCommissioning,
              };
        if (active)
          setSettings({
          ...defaults,
          ...savedSettings,
          commissioning,
          plsPoints: (savedSettings.plsPoints || []).map((point) =>
            typeof point === "object" && point !== null
              ? (point.level ?? "")
              : point,
          ),
          rlMethod: "HI Method",
          displayMode: "Light",
          });
      })
      .catch(() => {
        if (active) {
          setLoadFailed(true);
          setMessage({ type: "error", text: "Could not load saved settings." });
        }
      })
      .finally(() => {
        if (active) dispatch(stopLoading());
      });
    return () => {
      active = false;
      dispatch(stopLoading());
    };
  }, [dispatch]);
  const set = (key, value) =>
    setSettings((previous) => ({ ...previous, [key]: value }));
  const setNested = (key, field, value) =>
    setSettings((previous) => ({
      ...previous,
      [key]: { ...previous[key], [field]: value },
    }));
  const setCommissioningField = (field, value) =>
    setSettings((previous) => ({
      ...previous,
      commissioning: {
        ...previous.commissioning,
        [previous.commissioningType]: {
          ...previous.commissioning[previous.commissioningType],
          [field]: value,
        },
      },
    }));
  const updateInstrument = (index, field, value) =>
    setSettings((previous) => ({
      ...previous,
      instruments: previous.instruments.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  const save = async (event) => {
    event.preventDefault();
    if (loadFailed) return;
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await saveSettings({
        ...settings,
        plsPoints: settings.plsPoints.map(Number),
      });
      setSettings({ ...defaults, ...data.settings });
      setMessage({ type: "success", text: "Settings saved." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Could not save settings.",
      });
    } finally {
      setSaving(false);
    }
  };
  const fields =
    settings.commissioningType === "Government"
      ? governmentFields
      : privateFields;
  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 8 }}>
      <BigHeader />
      <Box
        sx={{
          background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
          pt: { xs: 10, md: 12 },
          pb: { xs: 8, md: 10 },
          color: "white",
          borderRadius: "0 0 40px 40px",
          boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.4)",
          position: "relative",
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
          >
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                <FiSettings size={32} opacity={0.9} />
                <Typography
                  variant="h3"
                  fontWeight={900}
                  letterSpacing="-0.02em"
                >
                  System <span style={{ color: "#c7d2fe" }}>Settings</span>
                </Typography>
              </Stack>
              <Typography
                variant="body1"
                sx={{ opacity: 0.85, maxWidth: 500, fontWeight: 500 }}
              >
                Manage application preferences, client configuration, instrument
                details, and project reporting.
              </Typography>
            </Box>
            <Button
              type="submit"
              form="settings-form"
              variant="contained"
              startIcon={
                saving ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <FiSave />
                )
              }
              disabled={saving || loading || loadFailed}
              sx={{
                bgcolor: "white",
                color: "#6366f1",
                fontWeight: 800,
                borderRadius: "12px",
                px: 3,
                py: 1.5,
                boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                "&:hover": { bgcolor: "#f1f5f9" },
              }}
            >
              Save Configuration
            </Button>
          </Stack>
        </Container>
      </Box>
      <Container
        maxWidth="lg"
        component="form"
        id="settings-form"
        onSubmit={save}
        sx={{ mt: -8, position: "relative" }}
      >
        {message && (
          <Alert
            severity={message.type}
            onClose={() => setMessage(null)}
            sx={{ mb: 3 }}
          >
            {message.text}
          </Alert>
        )}
        {!loading && (
          <>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Section
                  title="System Preferences"
                  detail="Measurement units and survey defaults."
                  icon={<FiServer size={22} />}
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Select
                        label="Measurement units"
                        value={settings.units}
                        onChange={(e) => set("units", e.target.value)}
                        options={["metric"]}
                        helperText="Metric (m / Km)"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="#64748b"
                        display="block"
                        mb={1}
                      >
                        PEG NAME
                      </Typography>
                      <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={settings.pegName}
                        onChange={(_, value) => value && set("pegName", value)}
                        sx={toggleSx}
                      >
                        <ToggleButton value="Chainage">Chainage</ToggleButton>
                        <ToggleButton value="Station">Station</ToggleButton>
                      </ToggleButtonGroup>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="Field date input method"
                        value={settings.rlMethod}
                        onChange={(e) => set("rlMethod", e.target.value)}
                      >
                        <MenuItem value="HI Method">HI Method</MenuItem>
                        <MenuItem value="RF Method" disabled>
                          RF Method (coming later)
                        </MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Select
                        label="Area calculation"
                        value={settings.areaCalculation}
                        onChange={(e) => set("areaCalculation", e.target.value)}
                        options={["Traditional / Detailed", "Modern / Tabular"]}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Select
                        label="Volume calculation"
                        value={settings.volumeCalculation}
                        onChange={(e) =>
                          set("volumeCalculation", e.target.value)
                        }
                        options={["Traditional / Detailed", "Modern / Tabular"]}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        mb={1}
                      >
                        <FiMonitor size={14} color="#64748b" />
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="#64748b"
                        >
                          DISPLAY MODE
                        </Typography>
                      </Stack>
                      <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={settings.displayMode}
                        onChange={(_, value) =>
                          value && set("displayMode", value)
                        }
                        sx={toggleSx}
                      >
                        <ToggleButton value="Light">Light</ToggleButton>
                        <ToggleButton value="Dark" disabled>Dark</ToggleButton>
                        <ToggleButton value="System Settings" disabled>
                          System
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Grid>
                  </Grid>
                </Section>
                <Section
                  title="PLS Points"
                  detail="Add the proposed level values you need."
                  icon={<FiInfo size={22} />}
                >
                  {(settings.plsPoints || []).map((point, index) => (
                    <Grid
                      container
                      spacing={2}
                      alignItems="center"
                      key={index}
                      sx={{ mb: 2 }}
                    >
                      <Grid size={{ xs: 10 }}>
                        <TextField
                          fullWidth
                          required
                          type="number"
                          label={`PLS value ${index + 1} (m)`}
                          value={point}
                          onChange={(e) =>
                            set(
                              "plsPoints",
                              settings.plsPoints.map((item, i) =>
                                i === index ? e.target.value : item,
                              ),
                            )
                          }
                          slotProps={{ htmlInput: { step: "any" } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 2 }}>
                        <Button
                          type="button"
                          color="error"
                          aria-label="Remove PLS point"
                          onClick={() =>
                            set(
                              "plsPoints",
                              settings.plsPoints.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <FiTrash2 />
                        </Button>
                      </Grid>
                    </Grid>
                  ))}
                  <Button
                    type="button"
                    startIcon={<FiPlus />}
                    onClick={() =>
                      set("plsPoints", [...(settings.plsPoints || []), ""])
                    }
                  >
                    Add PLS point
                  </Button>
                </Section>
                <Section
                  title="Storage Used"
                  detail="Storage usage is not available for this account yet."
                  icon={<FiMonitor size={22} />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Section
                  title="Client Management"
                  detail="Keep separate details for government and corporate projects."
                  icon={<FiBriefcase size={22} />}
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Select
                        label="Project type"
                        value={settings.commissioningType}
                        onChange={(e) =>
                          set("commissioningType", e.target.value)
                        }
                        options={["Government", "Corporate / Private"]}
                      />
                    </Grid>
                    {settings.commissioningType === "Government" && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Select
                          label="Government level"
                          value={settings.governmentLevel}
                          onChange={(e) =>
                            set("governmentLevel", e.target.value)
                          }
                          options={["Federal", "State", "Local Body"]}
                        />
                      </Grid>
                    )}
                    {fields.map((field) => (
                      <Grid key={field} size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label={field}
                          required={
                            settings.commissioningType === "Government" &&
                            ["Department", "Agreement No."].includes(field)
                          }
                          value={
                            settings.commissioning?.[
                              settings.commissioningType
                            ]?.[field] || ""
                          }
                          onChange={(e) =>
                            setCommissioningField(field, e.target.value)
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Section>
                <Section
                  title="Instrument Details"
                  detail="Register surveying instruments."
                  icon={<FiTool size={22} />}
                >
                  {settings.instruments.map((instrument, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >
                        <Typography fontWeight={700}>
                          Instrument {index + 1}
                        </Typography>
                        <Button
                          type="button"
                          color="error"
                          startIcon={<FiTrash2 />}
                          onClick={() =>
                            set(
                              "instruments",
                              settings.instruments.filter(
                                (_, i) => i !== index,
                              ),
                            )
                          }
                        >
                          Remove
                        </Button>
                      </Stack>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            label="Instrument type"
                            value="Auto Level Readings (Degree)"
                            disabled
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            required
                            label="Instrument model"
                            placeholder="BOSCH GOL 32D Professional"
                            value={instrument.model || ""}
                            onChange={(e) =>
                              updateInstrument(index, "model", e.target.value)
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            required
                            label="Serial No."
                            value={instrument.serial || ""}
                            onChange={(e) =>
                              updateInstrument(index, "serial", e.target.value)
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Date of purchase"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={instrument.purchaseDate || ""}
                            onChange={(e) =>
                              updateInstrument(
                                index,
                                "purchaseDate",
                                e.target.value,
                              )
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Last calibration date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={instrument.calibrationDate || ""}
                            onChange={(e) =>
                              updateInstrument(
                                index,
                                "calibrationDate",
                                e.target.value,
                              )
                            }
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  <Button
                    type="button"
                    startIcon={<FiPlus />}
                    onClick={() =>
                      set("instruments", [
                        ...settings.instruments,
                        { type: "Auto Level Readings (Degree)" },
                      ])
                    }
                  >
                    Add instrument
                  </Button>
                </Section>
                <Section
                  title="Technical Lead & Field Staff"
                  detail="Assign staff fields to Engineer/Surveyor groups"
                  icon={<FiUsers size={22} />}
                >
                  {staffRoles.map((role, index) => (
                    <Paper key={role} elevation={0} sx={{ border: "1px solid #dbe3f3", borderRadius: "16px", overflow: "hidden", mb: 3 }}>
                      <Box
                        component="button"
                        type="button"
                        aria-expanded={expandedStaffRole === role}
                        onClick={() => setExpandedStaffRole(expandedStaffRole === role ? null : role)}
                        sx={{
                          width: "100%", border: 0, p: 2, bgcolor: expandedStaffRole === role ? "#f8faff" : "#fff",
                          display: "flex", alignItems: "center", gap: 2, textAlign: "left", cursor: "pointer",
                          "&:hover": { bgcolor: "#f8faff" },
                        }}
                      >
                        <Box sx={{ width: 34, height: 34, display: "grid", placeItems: "center", border: "1px solid #dbe3f3", borderRadius: "9px", color: "#6366f1", fontWeight: 800, bgcolor: "#fff", flexShrink: 0 }}>{index + 1}</Box>
                        <Typography fontWeight={700} color="#1e293b" sx={{ flex: 1 }}>{role}</Typography>
                        {expandedStaffRole === role ? <FiChevronUp color="#64748b" /> : <FiChevronDown color="#64748b" />}
                      </Box>
                      <Collapse in={expandedStaffRole === role}>
                        <Box sx={{ p: 3, pt: 1, borderTop: "1px solid #dbe3f3" }}>
                          <Typography variant="caption" fontWeight={700} color="#94a3b8" display="block" mb={2}>6 NON-COMPULSORY STAFF FIELDS</Typography>
                          <Grid container spacing={2}>
                            {[1, 2, 3, 4, 5, 6].map((fieldNumber) => {
                              const field = `Staff ${fieldNumber}`;
                              const legacyField = ["Name", "Phone", "Email", "Field 4", "Field 5", "Field 6"][fieldNumber - 1];
                              return <Grid key={field} size={{ xs: 12, sm: 4 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label={field}
                                  placeholder="Enter name or ID"
                                  value={settings.staff?.[role]?.[field] ?? settings.staff?.[role]?.[legacyField] ?? ""}
                                  onChange={(event) => setSettings((previous) => ({
                                    ...previous,
                                    staff: {
                                      ...previous.staff,
                                      [role]: { ...previous.staff?.[role], [field]: event.target.value },
                                    },
                                  }))}
                                />
                              </Grid>;
                            })}
                          </Grid>
                        </Box>
                      </Collapse>
                    </Paper>
                  ))}
                </Section>
                <Section
                  title="Drawing & Measurement"
                  detail="Check levels, hatch, and detailed section view."
                  icon={<FiSettings size={22} />}
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Check level / measure (Nos)"
                        value={settings.checkLevel?.count || ""}
                        onChange={(e) =>
                          setNested("checkLevel", "count", e.target.value)
                        }
                        slotProps={{ htmlInput: { min: 0 } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Deduction (%)"
                        value={settings.checkLevel?.deduction || ""}
                        onChange={(e) =>
                          setNested("checkLevel", "deduction", e.target.value)
                        }
                        slotProps={{
                          htmlInput: { min: 0, max: 100, step: 0.01 },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Select
                        label="Hatch type"
                        value={settings.hatch?.type || "Solid"}
                        onChange={(e) =>
                          setNested("hatch", "type", e.target.value)
                        }
                        options={["Solid", "Diagonal", "Cross", "Dot"]}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        type="color"
                        label="Hatch colour"
                        value={settings.hatch?.color || "#6366f1"}
                        onChange={(e) =>
                          setNested("hatch", "color", e.target.value)
                        }
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Layer details"
                        value={settings.hatch?.layer || ""}
                        onChange={(e) =>
                          setNested("hatch", "layer", e.target.value)
                        }
                      />
                    </Grid>
                  </Grid>
                  <Typography fontWeight={700} mt={3} mb={2}>
                    Detailed section view settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Horizontal scale (1 : n)"
                        value={settings.sectionView?.horizontalScale || ""}
                        onChange={(e) =>
                          setNested(
                            "sectionView",
                            "horizontalScale",
                            e.target.value,
                          )
                        }
                        slotProps={{ htmlInput: { min: 1 } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Vertical scale (1 : n)"
                        value={settings.sectionView?.verticalScale || ""}
                        onChange={(e) =>
                          setNested(
                            "sectionView",
                            "verticalScale",
                            e.target.value,
                          )
                        }
                        slotProps={{ htmlInput: { min: 1 } }}
                      />
                    </Grid>
                  </Grid>
                  <Stack direction="row" flexWrap="wrap" gap={2} mt={1}>
                    {["showGrid", "showLabels"].map((field) => (
                      <FormControlLabel
                        key={field}
                        control={
                          <Checkbox
                            checked={Boolean(settings.sectionView?.[field])}
                            onChange={(e) =>
                              setNested("sectionView", field, e.target.checked)
                            }
                          />
                        }
                        label={
                          field === "showGrid" ? "Show grid" : "Show labels"
                        }
                      />
                    ))}
                  </Stack>
                  <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                    <Typography variant="caption">
                      Section preview · H 1:
                      {settings.sectionView?.horizontalScale} · V 1:
                      {settings.sectionView?.verticalScale}
                    </Typography>
                    <Box
                      sx={{
                        height: 120,
                        mt: 1,
                        backgroundImage: settings.sectionView?.showGrid
                          ? "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)"
                          : "none",
                        backgroundSize: "24px 24px",
                      }}
                    >
                      <Box
                        component="svg"
                        viewBox="0 0 400 120"
                        preserveAspectRatio="none"
                        sx={{ width: "100%", height: "100%" }}
                      >
                        <polyline
                          points="0,50 100,50 150,85 250,85 300,50 400,50"
                          fill="none"
                          stroke={settings.hatch?.color || "#6366f1"}
                          strokeWidth="2"
                        />
                      </Box>
                    </Box>
                    {settings.sectionView?.showLabels && (
                      <Typography variant="caption">
                        Sample section profile
                      </Typography>
                    )}
                  </Paper>
                </Section>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}
