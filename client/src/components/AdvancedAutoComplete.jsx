import * as React from "react";
import { Box, Typography, Autocomplete, FormHelperText } from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { styled, alpha } from "@mui/material/styles";
import TextField from "@mui/material/TextField";

const filter = createFilterOptions();

/* ================= Styled TextField ================= */
const StyledTextField = styled(TextField)(({ theme }) => ({
  width: "100%",

  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    padding: "10px 14px",
    backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#f9f9fb",
    fontSize: "0.95rem",
    transition: theme.transitions.create(
      ["border-color", "box-shadow", "background-color"],
      { duration: theme.transitions.duration.shorter }
    ),

    "& fieldset": {
      border: `1px solid ${theme.palette.divider}`,
    },

    "&:hover fieldset": {
      borderColor: theme.palette.text.secondary,
    },

    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
      boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 3px`,
    },

    "&.Mui-error fieldset": {
      borderColor: theme.palette.error.main,
      boxShadow: `${alpha(theme.palette.error.main, 0.25)} 0 0 0 2px`,
    },
  },
}));

/* ================= AdvancedAutoComplete ================= */
const AdvancedAutoComplete = ({
  label,
  value, // primitive value (like Select)
  onChange, // receives event.target.value
  options = [],
  placeholder = "Select...",
  error = "",
  helperText = "",
  name = "",
  freeSolo = true,
  sx = {},
  ...props
}) => {
  /* ---------- Map primitive value → Autocomplete value ---------- */
  const selectedOption = React.useMemo(() => {
    if (value === null || value === undefined || value === "") return null;

    // freeSolo string
    if (freeSolo && typeof value === "string") {
      return value;
    }

    // match option by value
    return options.find((opt) => String(opt.value) === String(value)) || null;
  }, [value, options, freeSolo]);

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

      <Autocomplete
        freeSolo={freeSolo}
        value={selectedOption}
        options={options}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        /* ---------- Create new option ---------- */
        filterOptions={(options, params) => {
          const filtered = filter(options, params);
          const { inputValue } = params;

          const isExisting = options.some(
            (opt) => String(opt.label) === inputValue
          );

          if (inputValue !== "" && !isExisting) {
            filtered.push({
              inputValue,
              label: `Add "${inputValue}"`,
              value: inputValue,
            });
          }

          return filtered;
        }}
        /* ---------- Always return STRING ---------- */
        getOptionLabel={(option) => {
          if (typeof option === "string") return option;
          if (option?.inputValue) return String(option.inputValue);
          return String(option?.label ?? "");
        }}
        /* ---------- Emit normal input event ---------- */
        onChange={(event, newValue) => {
          let finalValue = "";

          if (typeof newValue === "string") {
            finalValue = newValue;
          } else if (newValue?.inputValue) {
            finalValue = newValue.inputValue;
          } else if (newValue) {
            finalValue = newValue.value;
          }

          onChange({
            ...event,
            target: {
              ...event?.target,
              name,
              value: finalValue,
            },
          });
        }}
        /* ---------- Dropdown item ---------- */
        renderOption={(props, option) => {
          const { key, ...rest } = props;
          return (
            <li key={key} {...rest}>
              {String(option.label)}
            </li>
          );
        }}
        /* ---------- Input ---------- */
        renderInput={(params) => (
          <StyledTextField
            {...params}
            placeholder={placeholder}
            error={Boolean(error)}
          />
        )}
        sx={{ "& .MuiAutocomplete-inputRoot": { height: "43px" } }}
        {...props}
      />

      {(helperText || error) && (
        <FormHelperText sx={{ ml: 1, mt: 0.5 }} error={Boolean(error)}>
          {error || helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default AdvancedAutoComplete;
