"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, X, Cookie } from "lucide-react";
import Link from "next/link";
import {
  saveCookieConsent,
  getCookieConsent,
  updateCookieConsentId,
} from "@/lib/cookie-consent";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function PrivacyPolicyModal({
  isOpen,
  onClose,
  onAccept,
}: PrivacyPolicyModalProps) {
  const [isAccepting, setIsAccepting] = React.useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    // Save necessary cookie consent
    const consentData = {
      accepted: true,
      preferences: {
        necessary: true,
        analytics: true,
        marketing: true,
        functional: true,
      },
    };

    // Persist locally immediately for responsiveness
    saveCookieConsent(consentData);
    onAccept(); // Close modal immediately after local save

    // Forward to backend in background
    try {
      const currentConsent = getCookieConsent();
      const hasExistingConsent = currentConsent?.consentId;
      const url = hasExistingConsent
        ? `/api/cookie-consent/${currentConsent.consentId}`
        : "/api/cookie-consent";

      const method = hasExistingConsent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentData,
          privacyPolicyVersion: "1.0",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (!hasExistingConsent && result.data?.consent_id) {
          updateCookieConsentId(result.data.consent_id);
        }
      }
    } catch (err) {
      console.error("Failed to send cookie consent:", err);
    } finally {
      setIsAccepting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-auto light">
      <Card
        className="w-full max-w-md mx-4 shadow-2xl border-2 relative pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="text-center pb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 mx-auto">
              <Shield className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-lg font-semibold text-gray-900">
                Cookie Consent Required
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute right-4 top-4"
              disabled={isAccepting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Cookie className="h-12 w-12 text-orange-500" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 leading-relaxed">
                To access your account, you need to accept our privacy policy
                and cookie preferences. This ensures we can provide you with a
                secure and personalized experience.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> You can still browse our website and view
                public content without accepting cookies, but account access
                requires consent.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleAccept}
              variant="filledBlack"
              className="w-full bg-blue-600 text-white hover:bg-blue-700 h-12"
              disabled={isAccepting}
            >
              {isAccepting ? "Processing..." : "Accept Privacy Policy & Continue"}
            </Button>

            <div className="text-center">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Return to Homepage
              </Link>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our{" "}
              <Link
                href="/privacy-policy"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/term-and-conditions"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
