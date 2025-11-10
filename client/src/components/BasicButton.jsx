import Button from '@mui/material/Button';

export default function BasicButtons({
  value,
  sx,
  fullWidth,
  onClick,
  variant,
  loading,
  loadingIndicator,
  disabled = false,
}) {
  return (
    <Button
      variant={variant ? variant : 'contained'}
      sx={sx}
      fullWidth={fullWidth}
      onClick={onClick}
      loading={loading}
      loadingIndicator={loadingIndicator || 'Loading…'}
      disabled={disabled}
    >
      {value}
    </Button>
  );
}
