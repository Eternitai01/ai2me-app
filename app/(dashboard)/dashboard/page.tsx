import { Suspense } from "react";
import DashboardPageClient from "./DashboardClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DashboardPageClient />
    </Suspense>
  );
}
