// src/app/ClientLayout.jsx
'use client';
import { useEffect } from 'react';
import { initGlobalPopup } from "@/lib/globalPopup";

export default function ClientLayout({ children }) {
  useEffect(() => {
    initGlobalPopup();
  }, []);

  return <>{children}</>;
}