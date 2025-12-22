import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import CustomSnackbar from "../components/CustomSnackbar";

const PublicRoute = () => {
  const { user } = useSelector((state) => state.user);

  return user ? (
    <Navigate to="/" replace />
  ) : (
    <>
      {/* Global Alert Start*/}

      <CustomSnackbar />

      {/* Global Alert End*/}
      <Outlet />
    </>
  );
};

export default PublicRoute;
