import { Suspense } from "react";
import CreditPurchaseSuccessPageClient from "./SuccessClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreditPurchaseSuccessPageClient />
    </Suspense>
  );
}
