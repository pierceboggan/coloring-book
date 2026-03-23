import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { AmplitudeInitializer } from '@/components/AmplitudeInitializer';

export const metadata: Metadata = {
  title: "Coloring Book AI",
  description: "Transform your images into beautiful coloring pages with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <AmplitudeInitializer />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
