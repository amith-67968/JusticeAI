import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WorkspaceLayout from './WorkspaceLayout';

const ProtectedRoute = () => {
  const { user, loading, logoutRedirectTo } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="grid min-h-dvh place-items-center text-sm text-slate-500">Restoring your secure session…</div>;
  }

  if (!user) {
    if (logoutRedirectTo) {
      return <Navigate to={logoutRedirectTo} replace />;
    }

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <WorkspaceLayout />;
};

export default ProtectedRoute;

