import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RoleProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles,
}) => {
  const { role, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
