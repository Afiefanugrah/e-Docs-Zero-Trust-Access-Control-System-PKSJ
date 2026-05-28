// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "e-Docs App",
  description: "Aplikasi Manajemen Dokumen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        // PERBAIKAN KRITIS: Menambahkan suppressHydrationWarning
        // Ini akan mengabaikan atribut yang disuntikkan oleh ekstensi browser (misalnya cz-shortcut-listen)
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
