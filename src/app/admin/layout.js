'use client';

import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminProviders from './providers';

function AdminLayoutContent({ children }) {
  const pathname = usePathname();

  // Si on est sur la page login, pas de protection
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AdminProviders>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProviders>
  );
}