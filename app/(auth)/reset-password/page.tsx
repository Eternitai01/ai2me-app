import { Suspense } from "react";
import ResetPassClient from "./ResetPassClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPassClient />
    </Suspense>
  );
}
