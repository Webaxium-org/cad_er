import { Chip } from '@mui/material';
import { green, red, yellow, grey as gray, blue } from '@mui/material/colors';
import { chipClasses } from '@mui/material/Chip';
import { svgIconClasses } from '@mui/material/SvgIcon';

const chipStyles = {
  default: {
    borderColor: gray[300],
    backgroundColor: gray[100],
    labelColor: gray[600],
    iconColor: gray[600],
  },
  warning: {
    borderColor: yellow[700],
    backgroundColor: yellow[50],
    labelColor: yellow[800],
    iconColor: yellow[800],
  },
  inProgress: {
    borderColor: blue[200],
    backgroundColor: blue[50],
    labelColor: blue[700],
    iconColor: blue[700],
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
};

const StatusChip = ({ status }) => {
  const colors = {
    Active: 'default',
    Completed: 'success',
    Paused: 'warning',
    Pending: 'warning',
    'In Progress': 'inProgress',
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
