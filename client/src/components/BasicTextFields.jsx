import TextField from '@mui/material/TextField';

export default function BasicTextFields({
  id,
  label,
  placeholder,
  type = 'text',
  onChange,
  name,
  value,
  variant = 'outlined',
  sx = {},
  error,
  className = '',
  disabled = false,
  fullWidth = true,
  slotProps,
}) {
  return (
    <TextField
      id={id}
      label={error || label}
      placeholder={placeholder}
      type={type}
      onChange={onChange}
      name={name}
      value={value}
      variant={variant}
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
      className={`${className} ${error ? 'inp-err' : ''}`}
      disabled={disabled}
      fullWidth={fullWidth ?? true}
      slotProps={slotProps}
    />
  );
}
