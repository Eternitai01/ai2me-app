import { Suspense } from "react";
import CreditsClient from "./CreditClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreditsClient />
    </Suspense>
  );
}
