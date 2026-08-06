"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import settingsService, {
  CompanyDetailsResponse,
} from "@/app/api/settings";

type CompanySettingsContextType = {
  companyDetails: CompanyDetailsResponse | null;
  contactImageUrl: string;
  industry: string;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

const CompanySettingsContext = createContext<
  CompanySettingsContextType | undefined
>(undefined);

export function CompanySettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [companyDetails, setCompanyDetails] =
    useState<CompanyDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchedRef = useRef(false);
  const fetchingRef = useRef(false);

  const fetchCompanyDetails = useCallback(async () => {
    if (!user) {
      setCompanyDetails(null);
      return;
    }
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await settingsService.getCompanyDetails();
      setCompanyDetails(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load company details"));
      setCompanyDetails(null);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCompanyDetails(null);
      fetchedRef.current = false;
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchCompanyDetails();
  }, [user, fetchCompanyDetails]);

  useEffect(() => {
    const handleImageUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ imageUrl?: string }>;
      const imageUrl = customEvent.detail?.imageUrl || "";
      setCompanyDetails((prev) =>
        prev ? { ...prev, contactImageUrl: imageUrl } : null
      );
    };
    window.addEventListener("contact-image-updated", handleImageUpdated);
    return () =>
      window.removeEventListener("contact-image-updated", handleImageUpdated);
  }, []);

  const contactImageUrl = companyDetails?.contactImageUrl ?? "";
  const industry = companyDetails?.industry ?? "";

  const refetch = useCallback(async () => {
    fetchedRef.current = false;
    await fetchCompanyDetails();
    fetchedRef.current = true;
  }, [fetchCompanyDetails]);

  const value: CompanySettingsContextType = {
    companyDetails,
    contactImageUrl,
    industry,
    loading,
    error,
    refetch,
  };

  return (
    <CompanySettingsContext.Provider value={value}>
      {children}
    </CompanySettingsContext.Provider>
  );
}

export function useCompanySettings() {
  const context = useContext(CompanySettingsContext);
  if (context === undefined) {
    throw new Error(
      "useCompanySettings must be used within a CompanySettingsProvider"
    );
  }
  return context;
}
