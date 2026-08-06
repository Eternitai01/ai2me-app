import { Suspense } from "react";
import SubscriptionClient from "./SubscriptionClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SubscriptionClient />
    </Suspense>
  );
}
