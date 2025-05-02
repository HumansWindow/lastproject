import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AliveHuman Admin Dashboard",
  description: "Admin dashboard for monitoring and managing AliveHuman platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
