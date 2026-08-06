import { Suspense } from "react";
import CreditPurchaseCancelledPageClient from "./CancelledClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreditPurchaseCancelledPageClient />
    </Suspense>
  );
}
