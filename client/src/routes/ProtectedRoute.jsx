import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useEffect } from "react";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const hasRequiredRole =
    !allowedRoles ||
    allowedRoles.length === 0 ||
    (user?.role && allowedRoles.includes(user.role));

  useEffect(() => {
    if (isAuthenticated && !hasRequiredRole) {
      toast.error("You do not have permission to access that area.");
    }
  }, [isAuthenticated, hasRequiredRole]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRequiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}