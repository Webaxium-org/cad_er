import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";

const StyledSelect = styled(Select)(({ theme }) => ({
  width: "100%",
  borderRadius: "10px",
  padding: "10px 14px",
  // border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#f9f9fb",
  color: theme.palette.text.primary,
  fontSize: "0.95rem",
  transition: theme.transitions.create(
    ["border-color", "box-shadow", "background-color"],
    { duration: theme.transitions.duration.shorter }
  ),

  "&:hover": {
    borderColor: theme.palette.text.secondary,
    backgroundColor: theme.palette.mode === "dark" ? "#2a2a2a" : "#f1f1f5",
  },

  "&.Mui-focused": {
    borderColor: theme.palette.primary.main,
    boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 3px`,
    backgroundColor: theme.palette.background.paper,
  },

  "&.Mui-error": {
    borderColor: theme.palette.error.main,
    backgroundColor: alpha(theme.palette.error.main, 0.05),
    boxShadow: `${alpha(theme.palette.error.main, 0.25)} 0 0 0 2px`,

    "&:hover": {
      backgroundColor: alpha(theme.palette.error.main, 0.08),
    },

    "&.Mui-focused": {
      boxShadow: `${alpha(theme.palette.error.main, 0.35)} 0 0 0 3px`,
    },
  },

  "& .MuiSelect-select": {
    padding: 0,
    paddingRight: "32px !important",
  },
}));

const BasicSelect = ({
  label,
  error = "",
  helperText = "",
  value,
  defaultValue,
  onChange,
  options = [],
  sx = {},
  placeholder = "Select...",
  ...props
}) => {
  return (
    <Box sx={{ width: "100%", ...sx }}>
      {label && (
        <Typography
          variant="body2"
          sx={{
            mb: 0.5,
            fontWeight: 600,
            color: error ? "error.main" : "black",
          }}
        >
          {label}
        </Typography>
      )}

      <StyledSelect
        value={value || ""}
        onChange={onChange}
        error={Boolean(error)}
        {...props}
      >
        <MenuItem value="" disabled>
          {placeholder}
        </MenuItem>
        {options.map((option, index) => (
          <MenuItem key={index} value={option.value || option}>
            {option.label || option}
          </MenuItem>
        ))}
      </StyledSelect>

      {(helperText || error) && (
        <FormHelperText sx={{ ml: 1, mt: 0.5 }} error={Boolean(error)}>
          {error || helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default BasicSelect;
