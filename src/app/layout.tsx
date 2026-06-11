import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/Header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Attendance Management System",
  description:
    "Track your attendance, calculate your salary, view analytics, and export reports.",
  keywords: ["attendance calculator", "part-time", "work log", "OCR", "earnings tracker"],
  icons: {
    icon: "/icon graphics.webp",
    apple: "/icon graphics.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background">
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Header />
              <main className="flex-1">{children}</main>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
