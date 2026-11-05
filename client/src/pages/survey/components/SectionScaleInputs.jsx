import { Stack, TextField } from "@mui/material";

export default function SectionScaleInputs({ scales, onChange }) {
  return <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} sx={{ my: 2, pt: 1 }}>
    {["horizontal", "vertical"].map((axis) => <TextField key={axis} size="small" type="number"
      label={`${axis === "horizontal" ? "Horizontal" : "Vertical"} scale 1:`}
      value={scales[axis]} onChange={(event) => onChange({ ...scales, [axis]: event.target.value })}
      sx={{ minWidth: 0 }} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1, step: 1 } }} />)}
  </Stack>;
}
