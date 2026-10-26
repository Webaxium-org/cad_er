import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

export default function SubscriptionRoute() {
  const { user } = useSelector(state => state.user);
  if (user?.role === "Super Admin") return <Navigate to="/settings" replace />;
  return <ProtectedRoute requiredTypes={["Professional"]} />;
}
