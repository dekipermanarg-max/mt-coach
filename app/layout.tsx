import type { Metadata } from "next";
import "./globals.css";
import Navigation from "./components/Navigation";

export const metadata: Metadata = {
  title: "MT Coach",
  description: "Monitoring, Planning, dan Performance Management",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
