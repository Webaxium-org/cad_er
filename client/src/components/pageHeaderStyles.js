export const heroTitleSx = {
  fontSize: { xs: "clamp(1.75rem, 7vw, 2.25rem)", sm: "2.5rem", md: "3rem" },
  lineHeight: { xs: 1.18, sm: 1.12 },
  overflowWrap: "anywhere",
};

export const compactTitleSx = {
  fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
  lineHeight: 1.2,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const surveyBackButtonSx = {
  bgcolor: "#f1f5f9",
  color: "#475569",
  borderRadius: "16px",
  width: 48,
  height: 48,
  transition: "all 0.2s ease",
  "&:hover": {
    bgcolor: "#e2e8f0",
    color: "#1e293b",
    transform: "translateX(-2px)",
  },
};
