import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/app/providers";
import { env } from "@/config/env";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: env.appName, template: `%s | ${env.appName}` },
  description:
    "Secure administration application for the GlowCare commerce platform.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
