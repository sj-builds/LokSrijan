import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteHeader } from "@/components/shared/site-header";

import "./globals.css";

// `--font-sans` is the variable `globals.css` maps Tailwind's font-sans
// token to, so the name here must stay in sync with it.
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LokSrijan",
    template: "%s · LokSrijan",
  },
  description:
    "From Citizen Signal to Verified Societal Impact. An AI-assisted " +
    "societal innovation collaboration platform for Jharkhand.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
