const isBlank = value => value == null || String(value).trim() === "";

// Keep suggested geometry outside the draft until the user continues.
// Explicit entries (including zero) must be validated, never replaced.
export const applyChainageDefaults = (draft, defaults) => {
  if (draft.type !== "Chainage") return draft;
  return {
    ...draft,
    roadWidth: isBlank(draft.roadWidth) ? defaults.roadWidth ?? "" : draft.roadWidth,
    spacing: isBlank(draft.spacing) ? defaults.spacing ?? "" : draft.spacing,
  };
};
