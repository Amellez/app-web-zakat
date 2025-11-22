// src/app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout"; // 🔥 Import du wrapper client

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Gestion Zakat al-Fitr",
  description: "Système de gestion de la Zakat al-Fitr",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}