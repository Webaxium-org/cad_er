export const ISLAND_BUTTON_RADIUS = "11px";

export const islandButtonContentSx = (count, widestLabel, fontSize = 14) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 0,
  "& > :first-of-type": {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "& svg": { display: "block" },
  },
  [`@container (min-width: ${Math.ceil(count * (String(widestLabel).length * fontSize * 0.6 + 36) + 8)}px)`]: {
    flexDirection: "row",
    columnGap: "6px",
  },
});

export const capsuleWrapperSx = () => ({
  bottom: { xs: "calc(12px + env(safe-area-inset-bottom))", md: 32 },
  width: "min(100%, 552px)",
  maxWidth: "calc(100vw - 32px)",
});

export const capsuleShellSx = {
  containerType: "inline-size",
  p: { xs: "4px", sm: "6px" },
  borderRadius: ISLAND_BUTTON_RADIUS,
  display: "flex",
  alignItems: "center",
  gap: { xs: 0.5, sm: 0.75 },
  height: "clamp(52px, 12vw, 64px)",
  width: "100%",
  boxSizing: "border-box",
  "& svg": { width: { xs: 22, sm: 24 }, height: { xs: 22, sm: 24 } },
};

