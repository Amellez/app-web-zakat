'use client';

import { AuthProvider } from '@/context/AuthContext';

export default function AdminProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}