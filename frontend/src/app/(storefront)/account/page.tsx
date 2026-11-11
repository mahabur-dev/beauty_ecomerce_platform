import type { Metadata } from "next";

import { AccountView } from "@/features/auth";

export const metadata: Metadata = {
  title: "My account",
  description: "Manage your GlowCare customer profile.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountView />;
}
