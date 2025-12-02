import { Chip } from '@mui/material';
import { green, red, yellow, grey as gray } from '@mui/material/colors';
import { chipClasses } from '@mui/material/Chip';
import { svgIconClasses } from '@mui/material/SvgIcon';

const chipStyles = {
  default: {
    borderColor: gray[300],
    backgroundColor: gray[100],
    labelColor: gray[600],
    iconColor: gray[600],
  },
  success: {
    borderColor: green[200],
    backgroundColor: green[50],
    labelColor: green[700],
    iconColor: green[700],
  },
  error: {
    borderColor: red[200],
    backgroundColor: red[50],
    labelColor: red[700],
    iconColor: red[700],
  },
  warning: {
    borderColor: yellow[200],
    backgroundColor: yellow[50],
    labelColor: yellow[800],
    iconColor: yellow[800],
  },
};

const StatusChip = ({ status }) => {
  const colors = {
    Active: 'default',
    Completed: 'success',
    Paused: 'warning',
    Ineligible: 'error',
  };

  const selected = chipStyles[colors[status]];

  return (
    <Chip
      label={status}
      size="small"
      sx={{
        border: '1px solid',
        borderRadius: '999px',
        borderColor: selected.borderColor,
        backgroundColor: selected.backgroundColor,

        [`& .${chipClasses.label}`]: {
          fontWeight: 600,
          color: selected.labelColor,
          fontSize: '0.75rem',
        },

        [`& .${svgIconClasses.root}`]: {
          color: selected.iconColor,
          fontSize: '0.75rem',
        },

        maxHeight: 20,
      }}
    />
  );
};

export default StatusChip;
