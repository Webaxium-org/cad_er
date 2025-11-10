import { IconButton } from '@mui/material';

const BasicIconButton = ({ icon, label, color = 'primary', sx = {} }) => {
  return (
    <IconButton aria-label={label} color={color} sx={sx}>
      {icon}
    </IconButton>
  );
};

export default BasicIconButton;
