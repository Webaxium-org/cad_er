import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { canUseCookies } from '../utils/cookieCheck';

const CookieBlockedDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const allowed = canUseCookies();

    if (!allowed) {
      setOpen(true);
    }
  }, []);

  return (
    <Dialog open={open}>
      <DialogTitle>Cookies Are Disabled</DialogTitle>

      <DialogContent>
        <Typography variant="body2">
          This app requires cookies to store your secure login session. Please
          enable cookies in your browser settings and reload the page.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => window.location.reload()} variant="contained">
          Reload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CookieBlockedDialog;
