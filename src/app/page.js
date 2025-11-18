'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger automatiquement vers la page d'inscription
    router.push('/inscription');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirection...</p>
      </div>
    </div>
  );
}