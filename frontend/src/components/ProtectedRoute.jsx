import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, logoutRedirectTo } = useAuth();
  const location = useLocation();

  if (!user) {
    if (logoutRedirectTo) {
      return <Navigate to={logoutRedirectTo} replace />;
    }

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
