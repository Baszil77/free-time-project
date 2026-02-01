import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Context",
  description: "Camera-first context for places around you"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-mist text-ink">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}
