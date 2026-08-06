"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Building2, User, Lock } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { PhoneInput } from "@/components/ui/phone-input";

interface InviteData {
  email: string;
  role: string;
  expires_at: string;
  organization_id: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    size: string;
    industry: string;
    country: string;
    timezone: string;
  };
}

interface SignupFormData {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  termsAccepted?: string;
  privacyAccepted?: string;
}

export default function InviteSignupPage() {
  const params = useParams();
  const router = useRouter();
  const { signIn } = useAuth();
  const inviteHash = params.hash as string;

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof SignupFormData>>(new Set());
  
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
    privacyAccepted: false,
  });

  const validateInvite = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/auth/join/${inviteHash}`);

      if (response.data.success) {
        setInviteData(response.data.data);
      } else {
        setError("Invalid or expired invite link");
      }
    } catch (err: unknown) {
      console.error("Error validating invite:", err);
      const errorMessage =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response
              ?.data?.detail
          : "Invalid or expired invite link. Please contact the person who invited you.";
      setError(
        errorMessage ||
          "Invalid or expired invite link. Please contact the person who invited you."
      );
    } finally {
      setLoading(false);
    }
  }, [inviteHash]);

  useEffect(() => {
    if (inviteHash) {
      validateInvite();
    }
  }, [inviteHash, validateInvite]);

  // Individual field validation functions
  const validateFirstName = (value: string): string | undefined => {
    if (!value.trim()) return "First name is required";
    if (value.trim().length < 2) return "First name must be at least 2 characters";
    if (value.trim().length > 50) return "First name cannot exceed 50 characters";
    if (!/^[a-zA-Z\s'-]+$/.test(value)) return "First name can only contain letters, spaces, hyphens, and apostrophes";
    return undefined;
  };

  const validateLastName = (value: string): string | undefined => {
    if (!value.trim()) return "Last name is required";
    if (value.trim().length < 2) return "Last name must be at least 2 characters";
    if (value.trim().length > 50) return "Last name cannot exceed 50 characters";
    if (!/^[a-zA-Z\s'-]+$/.test(value)) return "Last name can only contain letters, spaces, hyphens, and apostrophes";
    return undefined;
  };

  const validatePhone = (value: string): string | undefined => {
    if (!value.trim()) return undefined; // Phone is optional
    
    // Check if the value contains any letters
    if (/[a-zA-Z]/.test(value)) {
      return "Please enter a valid phone number";
    }
    
    // Remove all non-digit characters for validation (keep + for international)
    const digitsOnly = value.replace(/[^\d+]/g, '');
    
    // Check if there are any digits at all
    const actualDigits = digitsOnly.replace(/\+/g, '');
    if (actualDigits.length === 0) {
      return "Please enter a valid phone number";
    }
    
    if (actualDigits.length < 10) return "Phone number must be at least 10 digits";
    if (actualDigits.length > 15) return "Phone number cannot exceed 15 digits";
    
    // Basic phone number pattern (allows digits, spaces, hyphens, parentheses, and +)
    const phonePattern = /^[\+]?[(]?[\d\s\-\(\)]+$/;
    if (!phonePattern.test(value)) return "Please enter a valid phone number";
    
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters long";
    if (value.length > 128) return "Password cannot exceed 128 characters";
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    if (!hasUpperCase) return "Password must contain at least one uppercase letter";
    if (!hasLowerCase) return "Password must contain at least one lowercase letter";
    if (!hasNumbers) return "Password must contain at least one number";
    if (!hasSpecialChar) return "Password must contain at least one special character";
    
    return undefined;
  };

  const validateConfirmPassword = (value: string, password: string): string | undefined => {
    if (!value) return "Please confirm your password";
    if (value !== password) return "Passwords do not match";
    return undefined;
  };

  const validateTermsAccepted = (value: boolean): string | undefined => {
    if (!value) return "You must accept the Terms of Service";
    return undefined;
  };

  const validatePrivacyAccepted = (value: boolean): string | undefined => {
    if (!value) return "You must accept the Privacy Policy";
    return undefined;
  };

  // Validate a single field
  const validateField = (field: keyof SignupFormData, value: string | boolean): string | undefined => {
    switch (field) {
      case 'firstName':
        return validateFirstName(value as string);
      case 'lastName':
        return validateLastName(value as string);
      case 'phone':
        return validatePhone(value as string);
      case 'password':
        return validatePassword(value as string);
      case 'confirmPassword':
        return validateConfirmPassword(value as string, formData.password);
      case 'termsAccepted':
        return validateTermsAccepted(value as boolean);
      case 'privacyAccepted':
        return validatePrivacyAccepted(value as boolean);
      default:
        return undefined;
    }
  };

  // Validate all fields
  const validateAllFields = (): FieldErrors => {
    const errors: FieldErrors = {};
    
    errors.firstName = validateFirstName(formData.firstName);
    errors.lastName = validateLastName(formData.lastName);
    errors.phone = validatePhone(formData.phone);
    errors.password = validatePassword(formData.password);
    errors.confirmPassword = validateConfirmPassword(formData.confirmPassword, formData.password);
    errors.termsAccepted = validateTermsAccepted(formData.termsAccepted);
    errors.privacyAccepted = validatePrivacyAccepted(formData.privacyAccepted);

    // Remove undefined errors
    Object.keys(errors).forEach(key => {
      if (errors[key as keyof FieldErrors] === undefined) {
        delete errors[key as keyof FieldErrors];
      }
    });

    return errors;
  };

  const handleInputChange = (
    field: keyof SignupFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate field in real-time if it has been touched
    if (touchedFields.has(field)) {
      const fieldError = validateField(field, value);
      setFieldErrors(prev => ({
        ...prev,
        [field]: fieldError
      }));

      // Special case: re-validate confirm password when password changes
      if (field === 'password' && touchedFields.has('confirmPassword')) {
        const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, value as string);
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: confirmPasswordError
        }));
      }
    }
  };

  const handleFieldBlur = (field: keyof SignupFormData) => {
    setTouchedFields(prev => new Set([...prev, field]));
    
    const value = formData[field];
    const fieldError = validateField(field, value);
    
    setFieldErrors(prev => ({
      ...prev,
      [field]: fieldError
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields: (keyof SignupFormData)[] = [
      'firstName', 'lastName', 'phone', 'password', 'confirmPassword', 'termsAccepted', 'privacyAccepted'
    ];
    setTouchedFields(new Set(allFields));

    // Validate all fields
    const errors = validateAllFields();
    setFieldErrors(errors);

    // Check if there are any errors
    if (Object.keys(errors).length > 0) {
      setError("Please fill the fields below before submitting.");
      // Focus on the first field with an error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      element?.focus();
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await axios.post("/api/auth/join/signup", {
        invite_hash: inviteHash,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        terms_accepted: formData.termsAccepted,
        privacy_accepted: formData.privacyAccepted,
      });

      if (response.data) {
        // Show success toast
        toast.success("Account created successfully! Signing you in...");

        // Automatically sign in the user
        try {
          await signIn({
            email: inviteData?.email || "",
            password: formData.password,
          });

          // Redirect to landing after successful sign-in
          router.push("/landing");
        } catch (signInError: unknown) {
          console.error("Auto sign-in failed:", signInError);
          // If auto sign-in fails, redirect to login page
          toast.error(
            "Account created but auto sign-in failed. Please sign in manually."
          );
          router.push(
            "/"
          );
        }
      }
    } catch (err: unknown) {
      console.error("Error creating account:", err);
      const errorMessage =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response
              ?.data?.detail
          : "Failed to create account. Please try again.";
      setError(errorMessage || "Failed to create account. Please try again.");
      toast.error(
        errorMessage || "Failed to create account. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Validating invite...</span>
        </div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              Invalid Invite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button
                variant="outlineBlack"
                onClick={() => router.push("/")}
                className="w-full"
              >
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md h-[70vh] flex flex-col">
        <CardHeader className="text-center flex-shrink-0">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Join {inviteData?.organization.name}
          </CardTitle>
          <CardDescription>
            You&apos;ve been invited to join as a{" "}
            <span className="font-semibold capitalize">{inviteData?.role}</span>
          </CardDescription>
        </CardHeader>

        {/* Scrollable form */}
        <CardContent className="overflow-y-auto scrollbar-thin">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteData?.email || ""}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    onBlur={() => handleFieldBlur("firstName")}
                    className={`pl-10 ${fieldErrors.firstName ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="John"
                    required
                  />
                </div>
                {fieldErrors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    onBlur={() => handleFieldBlur("lastName")}
                    className={`pl-10 ${fieldErrors.lastName ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="Doe"
                    required
                  />
                </div>
                {fieldErrors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <PhoneInput
                value={formData.phone}
                onChange={(value) => handleInputChange("phone", value)}
                onBlur={() => handleFieldBlur("phone")}
                placeholder="Phone number"
                error={!!fieldErrors.phone}
              />
              {fieldErrors.phone && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onBlur={() => handleFieldBlur("password")}
                  className={`pl-10 ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Create a strong password"
                  required
                />
              </div>
              {fieldErrors.password && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  onBlur={() => handleFieldBlur("confirmPassword")}
                  className={`pl-10 ${fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) =>
                      handleInputChange("termsAccepted", checked as boolean)
                    }
                    className={fieldErrors.termsAccepted ? 'border-red-500' : ''}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I accept the{" "}
                    <a
                      href="/terms"
                      className="text-blue-600 hover:underline"
                      target="_blank"
                    >
                      Terms of Service
                    </a>
                  </Label>
                </div>
                {fieldErrors.termsAccepted && (
                  <p className="text-sm text-red-500 ml-6">{fieldErrors.termsAccepted}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={formData.privacyAccepted}
                    onCheckedChange={(checked) =>
                      handleInputChange("privacyAccepted", checked as boolean)
                    }
                    className={fieldErrors.privacyAccepted ? 'border-red-500' : ''}
                  />
                  <Label htmlFor="privacy" className="text-sm">
                    I accept the{" "}
                    <a
                      href="/privacy"
                      className="text-blue-600 hover:underline"
                      target="_blank"
                    >
                      Privacy Policy
                    </a>
                  </Label>
                </div>
                {fieldErrors.privacyAccepted && (
                  <p className="text-sm text-red-500 ml-6">{fieldErrors.privacyAccepted}</p>
                )}
              </div>
            </div>
          </form>
        </CardContent>

        {/* Sticky button at the bottom */}
        <div className="sticky bottom-0 bg-white px-4 border-t">
          <Button
            type="submit"
            onClick={handleSubmit}
            className="w-full"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/" className="text-blue-600 hover:underline">
                Sign in
              </a>
            </p>
          </div>

          <div className="mt-2 text-center pb-2">
            <p className="text-sm text-gray-600">
              Need help?{" "}
              <a href="mailto:team@ai2me.com" className="text-blue-600 hover:underline">
                Contact us: team@ai2me.com
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
