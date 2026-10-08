export const capsuleWrapperSx = (buttonCount) => ({
  bottom: { xs: "calc(12px + env(safe-area-inset-bottom))", md: 32 },
  width: `clamp(260px, 72vw, ${Math.max(320, buttonCount * 70 + 180)}px)`,
  maxWidth: "calc(100vw - 24px)",
});

export const capsuleShellSx = {
  p: { xs: "4px", sm: "6px" },
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  gap: { xs: 0.5, sm: 0.75 },
  height: "clamp(44px, 10vw, 56px)",
  width: "100%",
  boxSizing: "border-box",
};

