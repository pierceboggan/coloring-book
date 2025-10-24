import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Baloo_2 } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { PasswordProtection } from '@/components/PasswordProtection';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${baloo.variable} antialiased`}
      >
        <PasswordProtection>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PasswordProtection>
      </body>
    </html>
  );
}
