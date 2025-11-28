// AdminDashboardRoute.jsx
import React from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import AdminDashboard from './AdminDashboard';

const AdminDashboardRoute = () => {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    window.location.href = '/admin';
    return null;
  }

  return <AdminDashboard />;
};

export default AdminDashboardRoute;
