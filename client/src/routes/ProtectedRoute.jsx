import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ requiredRoles = [], requiredTypes = [] }) => {
  const { user, loggedIn } = useSelector((state) => state.user);
  const location = useLocation();

  // 1️⃣ Not authenticated
  if (!user) {
    return <Navigate to={loggedIn === false ? "/login" : "/landing"} replace />;
  }

  // 2️⃣ User-type restriction (route-level, if defined)
  if (requiredTypes.length > 0 && !requiredTypes.includes(user.type)) {
    return <Navigate to="/" replace />;
  }

  // 3️⃣ Global quiz access restriction (non-students)
  if (location.pathname === "/quiz" && user.type !== "Student") {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4️⃣ Mandatory quiz enforcement (students must complete quiz first)
  if (
    user.type === "Student" &&
    !user.isQuizCompleted &&
    location.pathname !== "/quiz"
  ) {
    return <Navigate to="/quiz" replace />;
  }

  // 5️⃣ Prevent quiz re-access after completion (students) // -- DELETED --
  // if (
  //   user.type === "Student" &&
  //   user.isQuizCompleted &&
  //   location.pathname === "/quiz"
  // ) {
  //   return <Navigate to="/" replace />;
  // }

  // 6️⃣ Role-based access control (route-level, if defined)
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
