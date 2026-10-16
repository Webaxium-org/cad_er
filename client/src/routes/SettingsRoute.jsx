import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import PlanAdmin from "../pages/subscription/PlanAdmin";
import SubscriptionGate from "./SubscriptionGate";

export default function SettingsRoute() {
  const { user } = useSelector((state) => state.user);
  if (user?.role === "Super Admin") return <PlanAdmin />;
  if (user?.type === "Professional") return <SubscriptionGate />;
  return <Navigate to="/unauthorized" replace />;
}
