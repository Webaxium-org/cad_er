import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Box, CircularProgress } from "@mui/material";
import { getSubscription } from "../services/subscriptionServices";

export default function SubscriptionGate() {
  const { user } = useSelector((state) => state.user);
  const location = useLocation();
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    if (user?.type !== "Professional" || user?.role === "Super Admin") {
      setAllowed(true);
      return;
    }
    let active = true;
    getSubscription().then(({ data }) => { if (active) setAllowed(data.hasAccess); })
      .catch(() => { if (active) setAllowed(false); });
    return () => { active = false; };
  }, [user?._id, user?.type, user?.role, location.pathname]);

  if (allowed === null) return <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  if (!allowed) return <Navigate to="/subscription" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
