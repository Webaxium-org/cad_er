import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  FormHelperText,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f9f9fb',
    paddingRight: '8px',
    transition: theme.transitions.create(
      ['border-color', 'box-shadow', 'background-color'],
      { duration: theme.transitions.duration.shorter }
    ),

    '& fieldset': {
      borderColor: theme.palette.divider,
    },

    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f1f1f5',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.text.secondary,
    },

    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 3px`,
    },

    '&.Mui-error fieldset': {
      borderColor: theme.palette.error.main,
      backgroundColor: alpha(theme.palette.error.main, 0.05),
      boxShadow: `${alpha(theme.palette.error.main, 0.25)} 0 0 0 2px`,
    },
    '&.Mui-error.Mui-focused fieldset': {
      boxShadow: `${alpha(theme.palette.error.main, 0.35)} 0 0 0 3px`,
    },
  },

  '& .MuiInputBase-input': {
    padding: '10px 14px',
    fontSize: '0.95rem',
    color: theme.palette.text.primary,
  },
}));

const BasicAutocomplete = ({
  label,
  error = '',
  helperText = '',
  options = [],
  value,
  onChange,
  sx = {},
  placeholder = 'Select...',
  ...props
}) => {
  return (
    <Box sx={{ width: '100%', ...sx }}>
      {label && (
        <Typography
          variant="body2"
          sx={{
            mb: 0.5,
            fontWeight: 600,
            color: error ? 'error.main' : 'black',
          }}
        >
          {label}
        </Typography>
      )}

      <Autocomplete
        options={options}
        value={value || null}
        onChange={onChange}
        getOptionLabel={(option) => option?.label || ''}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        {...props}
        renderInput={(params) => (
          <StyledTextField
            {...params}
            placeholder={placeholder}
            error={Boolean(error)}
            sx={{
              '& .MuiOutlinedInput-root': {
                padding: '2px !important',
              },
            }}
          />
        )}
      />

      {(helperText || error) && (
        <FormHelperText sx={{ ml: 1, mt: 0.5 }} error={Boolean(error)}>
          {error || helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default BasicAutocomplete;
