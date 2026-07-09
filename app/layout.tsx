import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/sonner";
import { AchievementNotifier } from "@/components/achievements/achievement-notifier";
import { AchievementCelebration } from "@/components/achievements/achievement-celebration";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "보드게임위키",
  description: "보드게임 위키 & 커뮤니티",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SiteHeader />
          {children}
          <Toaster />
          <AchievementNotifier />
          <AchievementCelebration />
        </ThemeProvider>
      </body>
    </html>
  );
}
