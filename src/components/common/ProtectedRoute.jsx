import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // If user is not logged in, redirect to login page with return state
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route requires specific role (e.g. ['admin']) and user's role is not allowed
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role || "customer";
    const hasRole =
      allowedRoles.includes(userRole) ||
      (allowedRoles.includes("admin") && Boolean(user.isAdmin));
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
