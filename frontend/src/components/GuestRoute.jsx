import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GuestRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="grid min-h-dvh place-items-center text-sm text-slate-500">Restoring your secure session…</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
