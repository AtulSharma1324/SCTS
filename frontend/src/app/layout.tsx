import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Classroom Ecosystem",
  description: "AI-powered scheduling, predictive analytics and intelligent classroom management",
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
