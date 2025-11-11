// routes/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ requiredRoles = [] }) => {
  const { currentUser } = useSelector((state) => state.user);

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requiredRoles?.length) {
    const hasPermission = requiredRoles.includes(currentUser.role);
    if (!hasPermission) {
      return <Navigate to="/unauthorized" />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
