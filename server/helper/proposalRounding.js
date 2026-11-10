// Proposed design RLs use a 5 mm grid, stored with three decimal places.
// Exact half steps round away from zero; allow for floating-point noise at ties.
export const roundProposalLevel = value => {
  const level = Number(value);
  if (value == null || String(value).trim() === "" || !Number.isFinite(level)) throw Error("The design produced an invalid RL.");
  const steps = Math.abs(level) * 200;
  const rounded = Math.sign(level) * Math.round(steps + Number.EPSILON * Math.max(1, steps)) / 200;
  return rounded.toFixed(3);
};

export const roundProposalLevels = purpose => ({
  ...purpose,
  rows: purpose.rows.map(row => row.type === "Chainage"
    ? { ...row, reducedLevels: row.reducedLevels.map(roundProposalLevel) }
    : row),
});
