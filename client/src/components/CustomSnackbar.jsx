import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import alertColors from '../constants/alertColors';
import { hideAlert } from '../redux/alertSlice';

const CustomSnackbar = () => {
  const { type, message, visible } = useSelector((state) => state.alert);

  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const handleClose = () => {
    setOpen(false);
    dispatch(hideAlert());
  };

  useEffect(() => {
    if (visible) {
      setOpen(true);
    }
  }, [visible]);

  const colors = alertColors(isDarkMode);

  return (
    visible && (
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={open}
        autoHideDuration={10000}
        onClose={handleClose}
        sx={{ zIndex: 2000 }}
      >
        <Alert
          onClose={handleClose}
          severity={type || ''}
          variant="filled"
          sx={{
            width: '100%',
            color: colors[type]?.color,
            borderColor: colors[type]?.borderColor,
            bgcolor: `${colors[type]?.bgcolor} !important`,
            '& .MuiAlert-icon': {
              color: colors[type]?.iconColor,
            },
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    )
  );
};

export default CustomSnackbar;
