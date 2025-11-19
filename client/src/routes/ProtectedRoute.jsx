// routes/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ requiredRoles = [] }) => {
  const { user } = useSelector((state) => state.user);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRoles?.length) {
    const hasPermission = requiredRoles.includes(user.role);
    if (!hasPermission) {
      return <Navigate to="/unauthorized" />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
