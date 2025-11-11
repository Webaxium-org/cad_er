import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CustomSnackbar from '../components/CustomSnackbar';

const PublicRoute = () => {
  const { currentUser } = useSelector((state) => state.user);

  return currentUser ? (
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
