export const optionMenuPaperSx = {
  mt: 1,
  overflow: "hidden",
  borderRadius: "14px",
  border: "1px solid #c7d2fe",
  bgcolor: "#fff",
  boxShadow: "0 16px 40px rgba(79, 70, 229, 0.18)",
};

export const optionMenuHeaderSx = {
  px: 2,
  py: 1.25,
  mb: 0.5,
  color: "#fff",
  bgcolor: "#4f46e5f2",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

export const optionMenuItemSx = {
  mx: 0.75,
  my: 0.25,
  px: 1.5,
  py: 1,
  minHeight: 36,
  borderRadius: "10px",
  color: "#334155",
  fontSize: 13,
  fontWeight: 700,
  "&:hover, &:focus-visible": { bgcolor: "#e0e7ff", color: "#4f46e5" },
  "&.Mui-selected": { bgcolor: "#e0e7ff", color: "#4f46e5" },
  "&.Mui-selected:hover": { bgcolor: "#c7d2fe" },
};
