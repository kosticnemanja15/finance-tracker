import { AuthProvider } from "@/context/AuthContext";
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { bricolage, inter } from "./fonts";
import { ThemeProvider } from "./theme-provider";



export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Track your income and expenses at a glance.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning je OBAVEZAN uz next-themes (server ne zna temu → mismatch bez ovoga)
    <html lang="en" suppressHydrationWarning className={`${bricolage.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <Toaster />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}