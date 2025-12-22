import { Button, CircularProgress } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const BasicButton = ({
  value,
  sx = {},
  fullWidth = false,
  onClick,
  variant = "contained",
  loading = false,
  disabled = false,
  loadingIndicator,
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const hoverStyles =
    variant === "contained"
      ? {
          backgroundColor: alpha(
            theme.palette.primary.main,
            isDark ? 0.85 : 0.9
          ),
        }
      : variant === "outlined"
      ? {
          backgroundColor: alpha(theme.palette.primary.main, 0.08),
          borderColor: theme.palette.primary.main,
        }
      : {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
        };

  return (
    <Button
      variant={variant}
      sx={{
        borderRadius: "10px",
        textTransform: "none",
        fontWeight: 600,
        fontSize: "14px",
        minWidth: 0,
        py: 1.2,
        px: 1,
        transition: "background-color 0.2s ease, border-color 0.2s ease",
        "&:hover": hoverStyles,
        "&:disabled": {
          opacity: 0.7,
          cursor: "not-allowed",
        },
        ...sx,
      }}
      fullWidth={fullWidth}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <CircularProgress
            size={20}
            color="inherit"
            sx={{ mr: 1, verticalAlign: "middle" }}
          />
          {loadingIndicator || "Loading..."}
        </>
      ) : (
        value
      )}
    </Button>
  );
};

export default BasicButton;
