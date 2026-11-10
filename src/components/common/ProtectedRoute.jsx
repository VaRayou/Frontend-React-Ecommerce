import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loader from "./Loader";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen message="Checking authorization..." />;
  }

  // If user is not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route requires specific role (e.g. ['admin']) and user's role is not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Normal customer trying to access admin pages is redirected to home
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;

