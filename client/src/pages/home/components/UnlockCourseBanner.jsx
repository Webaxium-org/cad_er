import { Card, CardContent, Button, Typography, Stack } from "@mui/material";
import { FaLock } from "react-icons/fa";

const UnlockCourseBanner = ({ price, onUnlock }) => {
  return (
    <Card
      sx={{
        borderRadius: 3,
        background: "linear-gradient(135deg, #EEF4FF, #FFFFFF)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <FaLock color="primary" fontSize="large" />

          <Stack flex={1}>
            <Typography fontWeight={700}>Unlock Full Course Access</Typography>
            <Typography fontSize={13} color="text.secondary">
              Get access to all video classes with a one-time payment.
            </Typography>
          </Stack>

          <Button variant="contained" onClick={onUnlock}>
            Unlock ₹{price}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default UnlockCourseBanner;
