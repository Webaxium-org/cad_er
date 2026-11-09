import { Box, Tooltip } from "@mui/material";

const Excavator = () => <svg width="21" height="18" viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="2" y="17" width="15" height="5" rx="2.5" /><path d="M5 17V9h7l3 8M8 9V5h5l3 7 6-9 4 12-4 3-4-2M7 12h4v5" /></svg>;
const Tipper = () => <svg width="21" height="18" viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m2 5 15-3 2 10H5ZM19 10h5l3 5v4h-3M4 18H2v-4h16v4H9" /><circle cx="6" cy="19" r="3" /><circle cx="21" cy="19" r="3" /></svg>;

export default function QuantityDeltaBadge({ saved, live, invalid = false, showTotals = false, sx }) {
  if (!saved || !live) return null;
  return <Box data-html2canvas-ignore="true" sx={{ position: "absolute", right: 8, top: 8, zIndex: 5, display: "grid", justifyItems: "end", gap: 0.5, ...sx }} aria-live="polite">
    {[{ key: "totalCuttingVolume", name: "Cutting", color: "#b45309", icon: <Excavator /> }, { key: "totalFillingVolume", name: "Filling", color: "#2878c7", icon: <Tipper /> }].map(({ key, name, color, icon }) => {
      const value = showTotals ? Number(live[key]) : Number(live[key]) - Number(saved[key]);
      const valid = !invalid && Number.isFinite(value) && !live.missingSections?.length;
      const label = valid ? `${!showTotals && value > 0 ? "+" : ""}${value.toFixed(3)}` : "—";
      return <Tooltip key={key} title={`${name}${showTotals ? "" : " change"}: ${label} m³`}>
        <Box aria-label={`${name} quantity ${showTotals ? "" : "change "}${label} cubic metres`} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5, width: "max-content", whiteSpace: "nowrap", px: 0.6, py: 0.35, color, bgcolor: "rgba(255,255,255,.96)", border: "1px solid #e2e8f0", borderRadius: "5px", boxShadow: "0 2px 5px #15204712", fontSize: 11, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
          {icon}<span>{label}</span>
        </Box>
      </Tooltip>;
    })}
  </Box>;
}
