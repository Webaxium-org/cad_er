import { Input, Box, Typography } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

const StyledInput = styled(Input)(({ theme }) => ({
  width: '100%',
  borderRadius: '10px',
  padding: '10px 14px',
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#F8F9FE',
  color: theme.palette.text.primary,
  fontSize: '0.95rem',
  transition: theme.transitions.create(
    ['border-color', 'box-shadow', 'background-color'],
    { duration: theme.transitions.duration.shorter }
  ),

  '&:hover': {
    borderColor: theme.palette.text.secondary,
    backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f1f1f5',
  },

  '&.Mui-focused': {
    borderColor: theme.palette.primary.main,
    boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 3px`,
    backgroundColor: '#F8F9FE',
  },

  '&.Mui-error': {
    borderColor: theme.palette.error.main,
    backgroundColor: alpha(theme.palette.error.main, 0.05),
    boxShadow: `${alpha(theme.palette.error.main, 0.25)} 0 0 0 2px`,

    '&:hover': {
      backgroundColor: alpha(theme.palette.error.main, 0.08),
    },

    '&.Mui-focused': {
      boxShadow: `${alpha(theme.palette.error.main, 0.35)} 0 0 0 3px`,
    },
  },

  '& input': {
    padding: 0,
  },
}));

const BasicInput = ({
  label,
  error = '',
  helperText = '',
  sx = {},
  ...props
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Typography
          variant="body2"
          sx={{
            mb: 0.5,
            fontWeight: 500,
            color: error ? 'error.main' : 'text.secondary',
          }}
        >
          {label}
        </Typography>
      )}
      <StyledInput
        disableUnderline
        error={Boolean(error)}
        {...props}
        onKeyDown={(e) => {
          if (props.type === 'number') {
            if (['e', 'E', '+', '-'].includes(e.key)) {
              e.preventDefault();
            }
          }
        }}
        sx={{
          ...sx,
          '& input[type=number]': {
            MozAppearance: 'textfield',
          },
          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
            {
              WebkitAppearance: 'none',
              margin: 0,
            },
        }}
      />
      {helperText || error ? (
        <Typography
          variant="caption"
          color={error ? 'error' : 'text.secondary'}
          sx={{ mt: 0.5, ml: 1, display: 'block' }}
        >
          {error || helperText}
        </Typography>
      ) : null}
    </Box>
  );
};

export default BasicInput;
