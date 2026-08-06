"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppBuilderRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/project/new?agent_id=ai-builder");
  }, [router]);
  return null;
}
