import { Stack, TextField } from "@mui/material";

export default function SectionScaleInputs({ scales, onChange }) {
  return <Stack direction="row" gap={1} sx={{ my: 2 }}>
    {["horizontal", "vertical"].map((axis) => <TextField key={axis} size="small" type="number"
      label={`${axis === "horizontal" ? "Horizontal" : "Vertical"} PDF scale 1:`}
      value={scales[axis]} onChange={(event) => onChange({ ...scales, [axis]: event.target.value })}
      slotProps={{ htmlInput: { min: 1, step: 1 } }} />)}
  </Stack>;
}
