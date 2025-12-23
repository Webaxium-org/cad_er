import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import CustomSnackbar from "../components/CustomSnackbar";

const PublicRoute = () => {
  const { user } = useSelector((state) => state.user);
  const location = useLocation();

  // Only redirect if user tries to access auth pages
  const authRoutes = ["/login", "/register", "/landing"];

  if (user && authRoutes.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <CustomSnackbar />
      <Outlet />
    </>
  );
};

export default PublicRoute;
