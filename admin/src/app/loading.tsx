import { LoadingScreen } from "@/components/ui/loading-screen";

export default function Loading() {
  return (
    <LoadingScreen
      message="Loading workspace…"
      description="Preparing GlowCare administration tools."
    />
  );
}
