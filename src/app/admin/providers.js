'use client';

import { AuthProvider } from '@/context/AuthContext';
import { MosqueeProvider } from '@/context/MosqueeContext';

export default function AdminProviders({ children }) {
  return (
    <AuthProvider>
      <MosqueeProvider>
        {children}
      </MosqueeProvider>
    </AuthProvider>
  );
}