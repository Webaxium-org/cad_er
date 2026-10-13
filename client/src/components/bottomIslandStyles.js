export const capsuleWrapperSx = () => ({
  bottom: { xs: "calc(12px + env(safe-area-inset-bottom))", md: 32 },
  width: "min(100%, 552px)",
  maxWidth: "calc(100vw - 32px)",
});

export const capsuleShellSx = {
  p: { xs: "4px", sm: "6px" },
  borderRadius: "18px",
  display: "flex",
  alignItems: "center",
  gap: { xs: 0.5, sm: 0.75 },
  height: "clamp(52px, 12vw, 64px)",
  width: "100%",
  boxSizing: "border-box",
  "& svg": { width: { xs: 22, sm: 24 }, height: { xs: 22, sm: 24 } },
};

