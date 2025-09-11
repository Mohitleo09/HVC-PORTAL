'use client';

import { useSession } from 'next-auth/react';
import AdminNavbar from '../adminNavigation/nav';
import DashboardPage from '../components/Dashboard/page';
import ProtectedRoute from '../components/ProtectedRoute';

const AdminPage = () => {
  const { data: session } = useSession();

  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminNavbar>
        <DashboardPage />
      </AdminNavbar>
    </ProtectedRoute>
  );
};

export default AdminPage