import type { Metadata } from "next";

import { env } from "@/config/env";

export const siteConfig = Object.freeze({
  name: env.appName,
  description:
    "A modern health and beauty commerce experience built around trusted products.",
  url: env.appUrl,
});

export const siteMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
};
