import { Alert } from "@mui/material";

export default function WaterWayProposalNotice({ purposes }) {
  const legacy = purposes?.some((purpose) => purpose &&
    ["Slope End-to-End Type", "With Respect to Buffer"].includes(purpose.proposalMethod) && purpose.geometryVersion !== 2);
  return legacy ? <Alert severity="info" sx={{ mb: 2 }}>
    This proposal contains levels saved before the calculation correction. Preserve any manual edits,
    then recreate the proposal with confirmed bank limits, side slope and buffer reference where applicable.
    Viewing or exporting this report does not recalculate saved levels.
  </Alert> : null;
}
