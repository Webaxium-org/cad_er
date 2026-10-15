import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Landing from "../pages/landing";

const ProtectedRoute = ({ requiredRoles = [], requiredTypes = [] }) => {
  const { user, hasLoggedInBefore } = useSelector((state) => state.user);
  const location = useLocation();

  // 1️⃣ Not authenticated
  if (!user) {
    // The public home page must remain accessible after a previous login.
    if (location.pathname !== "/" && hasLoggedInBefore === true) {
      return <Navigate to="/login" replace />;
    }
    return <Landing />;
  }

  // 2️⃣ User-type restriction (route-level, if defined)
  if (!user.type) {
    return <Navigate to="/onboarding/account-type" replace />;
  }

  // 3️⃣ Global quiz access restriction (non-students)
  if (requiredTypes.length > 0 && !requiredTypes.includes(user.type)) {
    return <Navigate to="/" replace />;
  }

  // 4️⃣ Mandatory quiz enforcement (students must complete quiz first)

  if (location.pathname === "/quiz" && user.type !== "Student") {
    return <Navigate to="/unauthorized" replace />;
  }

  // 5️⃣ Prevent quiz re-access after completion (students) // -- DELETED --
  if (
    user.type === "Student" &&
    !user.isQuizCompleted &&
    location.pathname !== "/quiz"
  ) {
    return <Navigate to="/quiz" replace />;
  }

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
