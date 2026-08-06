"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCompanySettings } from "@/context/CompanySettingsContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Building2, CreditCard, User, Loader2, Trash2, Eye, EyeOff, Globe, Check, ChevronDown } from "lucide-react";
import settingsService, {
  UpdateCompanyDetailsRequest,
  TeamMember,
} from "@/app/api/settings";
import { AdminOnly } from "@/components/guards/PermissionGuard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLazyCreditData } from "@/hooks/use-lazy-credit-data";

function SettingsPage() {
  const searchParams = useSearchParams();
  // Default to "security" tab if ?tab=security is in the URL (e.g. from password toast link)
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "company");

  // Credits data (reused from Credits tab)
  const {
    creditBalance,
    creditBalanceLoading,
    creditBalanceError,
    loadCreditBalance,
    purchaseHistory,
    purchaseHistoryLoading,
    purchaseHistoryError,
    loadPurchaseHistory,
  } = useLazyCreditData();

  useEffect(() => {
    // Load credits info for Billing tab
    loadCreditBalance().catch((err) => {
      console.error("Failed to load credit balance:", err);
    });
    loadPurchaseHistory().catch((err) => {
      console.error("Failed to load purchase history:", err);
    });
  }, [loadCreditBalance, loadPurchaseHistory]);

  useEffect(() => {
    if (creditBalanceError) {
      console.warn("Credit balance unavailable");
    }
    if (purchaseHistoryError) {
      console.warn("Purchase history unavailable");
    }
  }, [creditBalanceError, purchaseHistoryError]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Company Information State
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  // Contact Information State
  const [primaryContact, setPrimaryContact] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [timezone, setTimezone] = useState("");
  const [contactImageUrl, setContactImageUrl] = useState("");
  const [selectedContactImage, setSelectedContactImage] = useState<File | null>(
    null
  );
  const [isUploadingContactImage, setIsUploadingContactImage] = useState(false);

  // User permissions
  const [isPrimaryUser, setIsPrimaryUser] = useState(false);

  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false);
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);

  // Validation errors
  const [companyErrors, setCompanyErrors] = useState<Record<string, string>>(
    {}
  );
  const [contactErrors, setContactErrors] = useState<Record<string, string>>(
    {}
  );

  // Team data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("developer");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Preferences
  const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "de", label: "Deutsch" },
    { code: "fr", label: "Français" },
    { code: "hi", label: "हिन्दी" },
    { code: "id", label: "Bahasa Indonesia" },
    { code: "it", label: "Italiano" },
    { code: "ja", label: "日本語" },
    { code: "ko", label: "한국어" },
    { code: "pt", label: "Português" },
    { code: "th", label: "ไทย" },
    { code: "zh", label: "中文" },
  ] as const;
  type LangCode = (typeof LANGUAGES)[number]["code"];
  const [language, setLanguage] = useState<LangCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("ai2me_language") as LangCode) || "en";
    }
    return "en";
  });
  const [langOpen, setLangOpen] = useState(false);
  const selectedLang = LANGUAGES.find(l => l.code === language) ?? LANGUAGES[0];
  const handleSaveLanguage = () => {
    localStorage.setItem("ai2me_language", language);
    window.dispatchEvent(new Event("ai2me-language-change"));
    toast.success(`Language set to ${selectedLang.label}`);
    setLangOpen(false);
  };
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  // Security (change password)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const passwordsMatch = newPassword.length > 0 && currentPassword.length > 0 && newPassword !== currentPassword
    ? false
    : newPassword.length > 0 && currentPassword.length > 0
    ? true
    : null;

  // true = passwords are different (valid), false = same (invalid), null = not enough input
  const passwordValid = newPassword.length > 0 && currentPassword.length > 0
    ? newPassword !== currentPassword
    : null;

  const router = useRouter();
  const { signOut, updateUser } = useAuth();
  const { companyDetails, loading: companyDetailsLoading, refetch: refetchCompanyDetails } = useCompanySettings();

  // Populate form from company settings context
  useEffect(() => {
    if (!companyDetails) {
      setIsLoadingData(companyDetailsLoading);
      return;
    }
    setIsLoadingData(false);
    setCompanyName(companyDetails.companyName || "");
    setIndustry(companyDetails.industry || "");
    setCompanySize(companyDetails.companySize || "");
    setDescription(companyDetails.companyDescription || "");
    setWebsite(companyDetails.website || "");
    setPrimaryContact(companyDetails.primaryContact || "");
    setEmail(companyDetails.email || "");
    setPhoneNumber(companyDetails.phone || "");
    setTimezone(companyDetails.timezone || "");
    setContactImageUrl(companyDetails.contactImageUrl || "");
    setIsPrimaryUser(companyDetails.is_primary || false);
  }, [companyDetails, companyDetailsLoading]);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setIsLoadingTeam(true);
        const response = await settingsService.getTeamMembers();

        // Handle the API response structure based on your example
        if (Array.isArray(response)) {
          // Direct array response
          setTeamMembers(response);
        } else if (
          response &&
          typeof response === "object" &&
          "data" in response
        ) {
          // Response with wrapper object containing data array
          const responseData = response as {
            success: boolean;
            message: string;
            data: TeamMember[];
          };
          setTeamMembers(
            Array.isArray(responseData.data) ? responseData.data : []
          );
        } else {
          console.warn(
            "Team API response is not in expected format:",
            response
          );
          setTeamMembers([]);
        }
      } catch (error) {
        console.error("Failed to fetch team members:", error);
        setTeamMembers([]);
      } finally {
        setIsLoadingTeam(false);
      }
    };

    fetchTeamMembers();
  }, []);

  // Validation helper functions
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidPhoneNumber = (phone: string) => {
    const phoneRegex = /^[\+]?[^A-Za-z\s][\d\s\-()]{3,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const isValidEmail = (val: string) => {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(val);
  };

  // Form validation functions
  const validateCompanyForm = () => {
    const errors: Record<string, string> = {};

    if (!companyName.trim()) {
      errors.companyName = "Company name is required";
    }

    if (!industry) {
      errors.industry = "Industry is required";
    }

    if (!companySize) {
      errors.companySize = "Company size is required";
    }

    if (!description.trim()) {
      errors.description = "Company description is required";
    }

    if (website && !isValidUrl(website)) {
      errors.website = "Please enter a valid website URL";
    }

    setCompanyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateContactForm = () => {
    const errors: Record<string, string> = {};

    if (!primaryContact.trim()) {
      errors.primaryContact = "Primary contact name is required";
    }

    if (!phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!isValidPhoneNumber(phoneNumber)) {
      errors.phoneNumber = "Please enter a valid phone number";
    }

    if (!timezone) {
      errors.timezone = "Timezone is required";
    }

    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCompanyUpdate = async () => {
    if (!isPrimaryUser) {
      console.error("Only primary users can update company information");
      return;
    }

    if (!validateCompanyForm()) {
      return;
    }

    setIsUpdatingCompany(true);
    try {
      const payload: UpdateCompanyDetailsRequest = {
        companyName,
        industry,
        companySize,
        companyDescription: description,
        website,
      };

      await settingsService.updateCompanyDetails(payload);
      setCompanyErrors({});
      updateUser({ company_name: companyName });
      await refetchCompanyDetails();

      // Show success toast
      toast.success("Company information updated successfully");
    } catch (error) {
      console.error("Failed to update company information:", error);

      // Show error toast
      toast.error("Failed to update company information. Please try again.");
    } finally {
      setIsUpdatingCompany(false);
    }
  };

  const handleContactUpdate = async () => {
    if (!isPrimaryUser) {
      console.error("Only primary users can update contact information");
      return;
    }

    if (!validateContactForm()) {
      return;
    }

    setIsUpdatingContact(true);
    try {
      const payload: UpdateCompanyDetailsRequest = {
        primaryContact,
        phone: phoneNumber,
        timezone,
      };

      await settingsService.updateCompanyDetails(payload);
      setContactErrors({});
      updateUser({ full_name: primaryContact });
      await refetchCompanyDetails();

      // Show success toast
      toast.success("Contact information updated successfully");
    } catch (error) {
      console.error("Failed to update contact information:", error);

      // Show error toast
      toast.error("Failed to update contact information. Please try again.");
    } finally {
      setIsUpdatingContact(false);
    }
  };

  const handleContactImageUpload = async () => {
    if (!isPrimaryUser || !selectedContactImage) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(selectedContactImage.type)) {
      toast.error("Only JPG, PNG, or WEBP images are allowed.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (selectedContactImage.size > maxSize) {
      toast.error("Image size must be 5MB or less.");
      return;
    }

    setIsUploadingContactImage(true);
    try {
      const response = await settingsService.uploadContactImage(
        selectedContactImage
      );
      const uploadedImageUrl = response.imageUrl || "";
      setContactImageUrl(uploadedImageUrl);
      window.dispatchEvent(
        new CustomEvent("contact-image-updated", {
          detail: { imageUrl: uploadedImageUrl },
        })
      );
      setSelectedContactImage(null);
      toast.success("Contact image uploaded successfully");
    } catch (error) {
      console.error("Failed to upload contact image:", error);
      toast.error("Failed to upload contact image. Please try again.");
    } finally {
      setIsUploadingContactImage(false);
    }
  };

  const handleInviteSubmit = async () => {
    setInviteError(null);
    if (!inviteEmail.trim()) {
      setInviteError("Email is required");
      return;
    }
    if (!isValidEmail(inviteEmail.trim())) {
      setInviteError("Please enter a valid email");
      return;
    }
    setIsInviting(true);
    try {
      await settingsService.createInvite(inviteEmail.trim(), inviteRole);

      // Show success toast
      toast.success(`Invite sent successfully to ${inviteEmail.trim()}`);

      // Clear and close
      setInviteEmail("");
      setInviteRole("developer");
      setIsInviteOpen(false);
      // Refresh team members to show the newly invited user
      const teamData = await settingsService.getTeamMembers();
      setTeamMembers(teamData);
    } catch (err: unknown) {
      console.error("Failed to send invite", err);
      // Extract specific error message from the API response
      const errorMessage =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response
            ?.data?.detail
          : err instanceof Error
            ? err.message
            : "Failed to send invite";

      // Show error toast
      toast.error(errorMessage);

      // Also set the error for inline display
      setInviteError(errorMessage || "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setPasswordError("");
    if (!currentPassword || !newPassword) {
      toast.error("Please enter current and new password");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await settingsService.changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");

      toast.success("Password updated. Please sign in again.");
      await signOut();
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      console.error("Failed to update password", err);
      const errorMessage =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response
            ?.data?.detail
          : err instanceof Error
            ? err.message
            : "Failed to update password";

      const msg = errorMessage || "Failed to update password";
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete || !memberToDelete.id) {
      setIsDeleteOpen(false);
      return;
    }
    try {
      setIsDeleting(true);
      await settingsService.deleteTeamMember(String(memberToDelete.id));

      // Show success toast
      toast.success(`Team member ${memberToDelete.email} has been removed`);

      setTeamMembers((prev) =>
        prev.filter((m) => m.email !== memberToDelete.email)
      );
    } catch (e) {
      console.error("Failed to delete team member:", e);

      // Show error toast
      toast.error("Failed to remove team member. Please try again.");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setMemberToDelete(null);
    }
  };

  // Fetch team members (duplicate cleanup maintained)
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setIsLoadingTeam(true);
        const response = await settingsService.getTeamMembers();

        if (Array.isArray(response)) {
          setTeamMembers(response);
        } else if (
          response &&
          typeof response === "object" &&
          "data" in response
        ) {
          const responseData = response as {
            success: boolean;
            message: string;
            data: TeamMember[];
          };
          setTeamMembers(
            Array.isArray(responseData.data) ? responseData.data : []
          );
        } else {
          console.warn(
            "Team API response is not in expected format:",
            response
          );
          setTeamMembers([]);
        }
      } catch (error) {
        console.error("Failed to fetch team members:", error);
        setTeamMembers([]);
      } finally {
        setIsLoadingTeam(false);
      }
    };

    fetchTeamMembers();
  }, []);

  // Helper function to format last login time
  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return "Never";

    try {
      const loginDate = new Date(lastLogin);
      const now = new Date();
      const diffInMs = now.getTime() - loginDate.getTime();

      if (isNaN(diffInMs)) return "Unknown";

      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60)
        return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
      if (diffInHours < 24)
        return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
      if (diffInDays === 1) return "1 day ago";
      return `${diffInDays} days ago`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown";
    }
  };

  const billingHistory = [
    {
      date: "2024-01-01",
      description: "Professional Plan - Monthly",
      amount: "$10,0000.00",
      status: "paid",
    },
    {
      date: "2023-12-01",
      description: "Professional Plan - Monthly",
      amount: "$25,000.00",
      status: "paid",
    },
    {
      date: "2023-11-01",
      description: "Professional Plan - Monthly",
      amount: "$50,000.00",
      status: "paid",
    },
    {
      date: "2023-11-01",
      description: "Professional Plan - Monthly",
      amount: "$100,000.00",
      status: "paid",
    },
  ];

  return (
    <div className="settings-page-enhanced space-y-8">
      <style jsx>{`
        .settings-page-enhanced :global(input),
        .settings-page-enhanced :global(textarea),
        .settings-page-enhanced :global([role="combobox"]) {
          border: 1px solid #52525b;
          box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.08); /* Increased default shadow */
          transition: all 0.2s ease;
        }
        
        .dark .settings-page-enhanced :global(input),
        .dark .settings-page-enhanced :global(textarea),
        .dark .settings-page-enhanced :global([role="combobox"]) {
          border: 1px solid #52525b;
          box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.35); /* Increased default shadow */
        }
        
        .settings-page-enhanced :global(input:focus),
        .settings-page-enhanced :global(textarea:focus),
        .settings-page-enhanced :global([role="combobox"]:focus) {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), 0 2px 4px 0 rgba(0, 0, 0, 0.1);
        }
        
        .dark .settings-page-enhanced :global(input:focus),
        .dark .settings-page-enhanced :global(textarea:focus),
        .dark .settings-page-enhanced :global([role="combobox"]:focus) {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2), 0 4px 6px 0 rgba(0, 0, 0, 0.4);
        }
        
        .settings-page-enhanced :global(input:hover:not(:disabled):not(:focus)),
        .settings-page-enhanced :global(textarea:hover:not(:disabled):not(:focus)),
        .settings-page-enhanced :global([role="combobox"]:hover:not(:disabled):not(:focus)) {
          border-color: hsl(var(--accent));
          box-shadow: 0 4px 6px 0 rgba(0, 0, 0, 0.12);
        }
        
        .dark .settings-page-enhanced :global(input:hover:not(:disabled):not(:focus)),
        .dark .settings-page-enhanced :global(textarea:hover:not(:disabled):not(:focus)),
        .dark .settings-page-enhanced :global([role="combobox"]:hover:not(:disabled):not(:focus)) {
          border-color: hsl(var(--accent));
          box-shadow: 0 4px 6px 0 rgba(0, 0, 0, 0.5);
        }
      `}</style>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your company profile, billing, and preferences.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden h-auto p-1 bg-muted/50 scrollbar-hide flex-nowrap whitespace-nowrap">
          <TabsTrigger value="company" className="flex-1 sm:flex-none px-4 py-2">Company</TabsTrigger>
          <TabsTrigger value="billing" className="flex-1 sm:flex-none px-4 py-2">Billing</TabsTrigger>
          <TabsTrigger value="team" className="flex-1 sm:flex-none px-4 py-2">Team</TabsTrigger>
          <TabsTrigger value="security" className="flex-1 sm:flex-none px-4 py-2">Security</TabsTrigger>
          <TabsTrigger value="preferences" className="flex-1 sm:flex-none px-4 py-2">Preferences</TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 sm:flex-none px-4 py-2">Notifications</TabsTrigger>
        </TabsList>

        {/* Company Profile */}
        <TabsContent value="company" className="space-y-6">
          {isLoadingData ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading company details...</span>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>
                    Update your company details and profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 ">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={
                          isPrimaryUser
                            ? (e) => setCompanyName(e.target.value)
                            : undefined
                        }
                        readOnly={!isPrimaryUser}
                        disabled={isUpdatingCompany || !isPrimaryUser}
                        className={`${companyErrors.companyName && isPrimaryUser ? "border-red-500" : ""} ${!isPrimaryUser ? "bg-muted text-muted-foreground cursor-not-allowed select-none" : ""}`}
                        tabIndex={!isPrimaryUser ? -1 : 0}
                        style={
                          !isPrimaryUser
                            ? { userSelect: "none", pointerEvents: "none" }
                            : {}
                        }
                      />
                      {companyErrors.companyName && isPrimaryUser && (
                        <p className="text-sm text-red-500">
                          {companyErrors.companyName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      {!isPrimaryUser ? (
                        <Input
                          value={industry}
                          readOnly
                          disabled
                          className="bg-muted text-muted-foreground cursor-not-allowed select-none"
                          tabIndex={-1}
                          style={{ userSelect: "none", pointerEvents: "none" }}
                        />
                      ) : (
                        <Select
                          value={industry}
                          onValueChange={setIndustry}
                          disabled={isUpdatingCompany}
                        >
                          <SelectTrigger
                            className={
                              companyErrors.industry ? "border-red-500" : ""
                            }
                          >
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Banking & Financial Services">
                              Banking & Financial Services
                            </SelectItem>
                            <SelectItem value="Healthcare & Life Sciences">
                              Healthcare & Life Sciences
                            </SelectItem>
                            <SelectItem value="Telecommunications">
                              Telecommunications
                            </SelectItem>
                            <SelectItem value="Government & Public Sector">
                              Government & Public Sector
                            </SelectItem>
                            <SelectItem value="Travel">Travel</SelectItem>
                            <SelectItem value="Technology">
                              Technology
                            </SelectItem>
                            <SelectItem value="Retail & E-commerce">
                              Retail & E-commerce
                            </SelectItem>
                            <SelectItem value="Manufacturing">
                              Manufacturing
                            </SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {companyErrors.industry && isPrimaryUser && (
                        <p className="text-sm text-red-500">
                          {companyErrors.industry}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companySize">Company Size</Label>
                      {!isPrimaryUser ? (
                        <Input
                          value={companySize}
                          readOnly
                          disabled
                          className="bg-muted text-muted-foreground cursor-not-allowed select-none"
                          tabIndex={-1}
                          style={{ userSelect: "none", pointerEvents: "none" }}
                        />
                      ) : (
                        <Select
                          value={companySize}
                          onValueChange={setCompanySize}
                          disabled={isUpdatingCompany}
                        >
                          <SelectTrigger
                            className={
                              companyErrors.companySize ? "border-red-500" : ""
                            }
                          >
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-50">1-50 employees</SelectItem>
                            <SelectItem value="51-200">
                              51-200 employees
                            </SelectItem>
                            <SelectItem value="201-1000">
                              201-1000 employees
                            </SelectItem>
                            <SelectItem value="1000+">
                              1000+ employees
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {companyErrors.companySize && isPrimaryUser && (
                        <p className="text-sm text-red-500">
                          {companyErrors.companySize}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website (Optional)</Label>
                      <Input
                        id="website"
                        value={website}
                        onChange={
                          isPrimaryUser
                            ? (e) => setWebsite(e.target.value)
                            : undefined
                        }
                        readOnly={!isPrimaryUser}
                        disabled={isUpdatingCompany || !isPrimaryUser}
                        placeholder={isPrimaryUser ? "https://example.com" : ""}
                        className={`${companyErrors.website && isPrimaryUser ? "border-red-500" : ""} ${!isPrimaryUser ? "bg-muted text-muted-foreground cursor-not-allowed select-none" : ""}`}
                        tabIndex={!isPrimaryUser ? -1 : 0}
                        style={
                          !isPrimaryUser
                            ? { userSelect: "none", pointerEvents: "none" }
                            : {}
                        }
                      />
                      {companyErrors.website && isPrimaryUser && (
                        <p className="text-sm text-red-500">
                          {companyErrors.website}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={
                        isPrimaryUser
                          ? (e) => setDescription(e.target.value)
                          : undefined
                      }
                      readOnly={!isPrimaryUser}
                      rows={3}
                      disabled={isUpdatingCompany || !isPrimaryUser}
                      placeholder={
                        isPrimaryUser ? "Brief description of your company" : ""
                      }
                      className={`${companyErrors.description && isPrimaryUser ? "border-red-500" : ""} ${!isPrimaryUser ? "bg-muted text-muted-foreground cursor-not-allowed select-none" : ""}`}
                      tabIndex={!isPrimaryUser ? -1 : 0}
                      style={
                        !isPrimaryUser
                          ? {
                            userSelect: "none",
                            pointerEvents: "none",
                            resize: "none",
                          }
                          : {}
                      }
                    />
                    {companyErrors.description && isPrimaryUser && (
                      <p className="text-sm text-red-500">
                        {companyErrors.description}
                      </p>
                    )}
                  </div>

                  {isPrimaryUser && (
                    <Button
                      onClick={handleCompanyUpdate}
                      disabled={isUpdatingCompany}
                      variant="outlineBlack"
                    >
                      {isUpdatingCompany && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isUpdatingCompany ? "Saving..." : "Save Changes"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>
                    Primary contact details for your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profile Picture</Label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
                        {contactImageUrl ? (
                          <img
                            src={contactImageUrl}
                            alt="Contact"
                            className="w-full h-full object-cover"
                            onError={() => setContactImageUrl("")}
                          />
                        ) : (
                          <User className="h-7 w-7 text-muted-foreground" />
                        )}
                      </div>
                      {isPrimaryUser && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) =>
                              setSelectedContactImage(
                                e.target.files?.[0] || null
                              )
                            }
                            disabled={isUploadingContactImage}
                            className="max-w-xs"
                          />
                          <Button
                            onClick={handleContactImageUpload}
                            disabled={
                              isUploadingContactImage || !selectedContactImage
                            }
                            variant="outlineBlack"
                          >
                            {isUploadingContactImage && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {isUploadingContactImage ? "Uploading..." : "Upload"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Contact</Label>
                      <Input
                        value={primaryContact}
                        onChange={
                          isPrimaryUser
                            ? (e) => setPrimaryContact(e.target.value)
                            : undefined
                        }
                        readOnly={!isPrimaryUser}
                        disabled={!isPrimaryUser || isUpdatingContact}
                        placeholder={isPrimaryUser ? "Full name" : ""}
                        className={`${contactErrors.primaryContact && isPrimaryUser ? "border-red-500" : ""} ${!isPrimaryUser ? "bg-muted text-muted-foreground cursor-not-allowed select-none" : ""}`}
                        tabIndex={!isPrimaryUser ? -1 : 0}
                        style={
                          !isPrimaryUser
                            ? { userSelect: "none", pointerEvents: "none" }
                            : {}
                        }
                      />
                      {contactErrors.primaryContact && isPrimaryUser && (
                        <p className="text-sm text-red-500">
                          {contactErrors.primaryContact}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        value={email}
                        readOnly
                        disabled
                        className="bg-muted text-muted-foreground cursor-not-allowed select-none"
                        tabIndex={-1}
                        style={{ userSelect: "none", pointerEvents: "none" }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        value={phoneNumber}
                        onChange={
                          isPrimaryUser
                            ? (e) => setPhoneNumber(e.target.value)
                            : undefined
                        }
                        readOnly={!isPrimaryUser}
                        disabled={!isPrimaryUser || isUpdatingContact}
                        placeholder={isPrimaryUser ? "Phone number" : ""}
                        className={`${contactErrors.phoneNumber && isPrimaryUser ? "border-red-500" : ""} ${!isPrimaryUser ? "bg-muted text-muted-foreground cursor-not-allowed select-none" : ""}`}
                        tabIndex={!isPrimaryUser ? -1 : 0}
                        style={
                          !isPrimaryUser
                            ? { userSelect: "none", pointerEvents: "none" }
                            : {}
                        }
                      />
                      {contactErrors.phoneNumber && isPrimaryUser && (
                        <p className="text-sm text-red-500">
                          {contactErrors.phoneNumber}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Time Zone</Label>
                      {!isPrimaryUser ? (
                        <Input
                          value={timezone}
                          readOnly
                          disabled
                          className="bg-muted text-muted-foreground cursor-not-allowed select-none"
                          tabIndex={-1}
                          style={{ userSelect: "none", pointerEvents: "none" }}
                        />
                      ) : (
                        <Select
                          value={timezone}
                          onValueChange={setTimezone}
                          disabled={isUpdatingContact}
                        >
                          <SelectTrigger
                            className={
                              contactErrors.timezone ? "border-red-500" : ""
                            }
                          >
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="america/new_york">
                              Eastern Time (ET)
                            </SelectItem>
                            <SelectItem value="america/chicago">
                              Central Time (CT)
                            </SelectItem>
                            <SelectItem value="america/denver">
                              Mountain Time (MT)
                            </SelectItem>
                            <SelectItem value="america/los_angeles">
                              Pacific Time (PT)
                            </SelectItem>
                            <SelectItem value="europe/london">
                              London (GMT)
                            </SelectItem>
                            <SelectItem value="europe/paris">
                              Paris (CET)
                            </SelectItem>
                            <SelectItem value="asia/tokyo">
                              Tokyo (JST)
                            </SelectItem>
                            <SelectItem value="asia/kolkata">
                              India (IST)
                            </SelectItem>
                            <SelectItem value="australia/sydney">
                              Sydney (AEST)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {contactErrors.timezone && isPrimaryUser && (
                        <p className="text-sm text-red-500">
                          {contactErrors.timezone}
                        </p>
                      )}
                    </div>
                  </div>
                  {isPrimaryUser && (
                    <Button
                      onClick={handleContactUpdate}
                      disabled={isUpdatingContact}
                      variant={"outlineBlack"}
                    >
                      {isUpdatingContact && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isUpdatingContact
                        ? "Updating..."
                        : "Update Contact Info"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Your current subscription and usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {(() => {
                      // Derive selected plan/package from last purchase
                      const last = [...purchaseHistory].sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )[0];
                      if (purchaseHistoryLoading) return "Loading...";
                      if (!last) return "Credits Plan";
                      return `${last.credits_purchased.toLocaleString()} credits package`;
                    })()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      const last = [...purchaseHistory].sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )[0];
                      if (purchaseHistoryLoading) return "";
                      if (!last) return "";
                      return `${last.credits_purchased.toLocaleString()} credits`;
                    })()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {(() => {
                      const last = [...purchaseHistory].sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )[0];
                      if (purchaseHistoryLoading) return "";
                      if (!last) return "";
                      return `$${last.amount_usd.toFixed(2)}`;
                    })()}
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid items-center text-center ">
                <div>
                  <div className="text-2xl font-bold">
                    {creditBalanceLoading
                      ? "—"
                      : (creditBalance?.available_credits ?? 0).toLocaleString(
                        "en-US"
                      )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Credits Remaining
                  </div>
                </div>
                {/* <div>
                  <div className="text-2xl font-bold">Jan 31</div>
                  <div className="text-xs text-muted-foreground">
                    Next Billing
                  </div>
                </div> */}
                {/* <div>
                  <div className="text-2xl font-bold">$543</div>
                  <div className="text-xs text-muted-foreground">
                    This Month
                  </div>
                </div> */}
              </div>
              {/* <div className="flex gap-2">
                <Button variant={"outlineBlack"}>Upgrade Plan</Button>
                <Button variant="outlineBlack">Change Plan</Button>
              </div> */}
            </CardContent>
          </Card>

          {/* Payment Method (hidden as requested) */}
          {false && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  Manage your payment information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="font-medium">•••• •••• •••• 4242</div>
                      <div className="text-sm text-muted-foreground">
                        Expires 12/25
                      </div>
                    </div>
                  </div>
                  <Badge variant="default">Primary</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                Your recent invoices and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Description</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const last = [...purchaseHistory].sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )[0];
                      if (purchaseHistoryLoading) {
                        return (
                          <tr className="border-b">
                            <td className="py-3" colSpan={4}>
                              Loading...
                            </td>
                          </tr>
                        );
                      }
                      if (!last) {
                        return (
                          <tr className="border-b">
                            <td className="py-3" colSpan={4}>
                              No purchases found
                            </td>
                          </tr>
                        );
                      }
                      const date = new Date(
                        last.created_at
                      ).toLocaleDateString();
                      const desc = `Credits Purchase - ${last.credits_purchased.toLocaleString()} credits`;
                      const amount = `$${last.amount_usd.toFixed(2)}`;
                      const status = (last.status || "paid").toLowerCase();
                      return (
                        <tr className="border-b">
                          <td className="py-3">{date}</td>
                          <td className="py-3">{desc}</td>
                          <td className="py-3">{amount}</td>
                          <td className="py-3">
                            <Badge
                              variant={
                                status === "paid" || status === "succeeded"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Management */}
        <TabsContent value="team" className="space-y-6">
          <AdminOnly
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Access restricted to administrators only
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Only administrators can manage team members.</p>
                    <p className="text-sm mt-2">
                      Contact your administrator for team management access.
                    </p>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage your team access and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Dialog
                    open={isInviteOpen}
                    onOpenChange={(open) => {
                      setIsInviteOpen(open);
                      if (!open) {
                        setInviteEmail("");
                        setInviteRole("developer");
                        setInviteError(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant={"outlineBlack"}>
                        Invite Team Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Invite team member</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="inviteEmail">Email</Label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            placeholder="user@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                          {inviteError && (
                            <p className="text-sm text-red-500">
                              {inviteError}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select
                            value={inviteRole}
                            onValueChange={setInviteRole}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="developer">
                                Developer
                              </SelectItem>
                              <SelectItem value="executive">
                                Executive
                              </SelectItem>
                              <SelectItem value="compliance-officer">
                                Compliance Officer
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outlineBlack"
                          onClick={() => setIsInviteOpen(false)}
                          disabled={isInviting}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleInviteSubmit}
                          disabled={isInviting}
                          variant={"filledBlack"}
                        >
                          {isInviting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send Invite"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Delete Confirmation Modal */}
                  <Dialog
                    open={isDeleteOpen}
                    onOpenChange={(o) => {
                      if (!o) {
                        setIsDeleteOpen(false);
                        setMemberToDelete(null);
                      }
                    }}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete team member</DialogTitle>
                      </DialogHeader>
                      <div className="text-sm text-muted-foreground">
                        Are you sure you want to delete {memberToDelete?.email}?
                        This will remove their access.
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDeleteOpen(false);
                            setMemberToDelete(null);
                          }}
                          disabled={isDeleting}
                        >
                          No
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={confirmDeleteMember}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Yes, Delete"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {isLoadingTeam ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading team members...</span>
                    </div>
                  ) : !Array.isArray(teamMembers) ||
                    teamMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No team members found in your organization.</p>
                      <p className="text-sm mt-2">
                        Click &quot;Invite Team Member&quot; to add your first
                        team member.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Name</th>
                            <th className="text-left py-2">Email</th>
                            <th className="text-left py-2">Role</th>
                            <th className="text-left py-2">Status</th>
                            <th className="text-left py-2">Last Active</th>
                            <th className="text-left py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamMembers.map((member, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-3 font-medium">
                                {member.full_name}
                              </td>
                              <td className="py-3 text-muted-foreground">
                                {member.email}
                              </td>
                              <td className="py-3">
                                <Badge variant="outline" className="capitalize">
                                  {member.role}
                                </Badge>
                              </td>
                              <td className="py-3">
                                <Badge
                                  variant={
                                    member.status === "active"
                                      ? "default"
                                      : member.status === "invited"
                                        ? "outline"
                                        : "secondary"
                                  }
                                  className="capitalize"
                                >
                                  {member.status}
                                </Badge>
                              </td>
                              <td className="py-3 text-sm text-muted-foreground">
                                {formatLastLogin(member.last_login_at)}
                              </td>
                              <td className="py-3">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setMemberToDelete(member);
                                    setIsDeleteOpen(true);
                                  }}
                                >
                                  <Trash2 />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </AdminOnly>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="font-medium">Change Password</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={isUpdatingPassword}
                        className={`pr-10 transition-colors ${
                          passwordValid === true ? "border-green-500 focus-visible:ring-green-500" :
                          passwordValid === false ? "border-red-500 focus-visible:ring-red-500" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isUpdatingPassword}
                        className={`pr-10 transition-colors ${
                          passwordValid === true ? "border-green-500 focus-visible:ring-green-500" :
                          passwordValid === false ? "border-red-500 focus-visible:ring-red-500" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordValid === false && (
                      <p className="text-xs text-red-500">New password must be different from current password</p>
                    )}
                    {passwordValid === true && (
                      <p className="text-xs text-green-500">✓ Passwords are ready to update</p>
                    )}
                  </div>
                </div>
                {passwordError && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 space-y-1">
                    <p className="text-sm font-medium text-red-700">{passwordError}</p>
                    <p className="text-xs text-red-600">Password requirements:</p>
                    <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5">
                      <li>At least 8 characters</li>
                      <li>At least one uppercase letter (A–Z)</li>
                      <li>At least one lowercase letter (a–z)</li>
                      <li>At least one number (0–9)</li>
                      <li>At least one special character (!@#$%^&amp;*...)</li>
                      <li>No more than 4 identical consecutive characters</li>
                    </ul>
                  </div>
                )}
                <Button
                  variant={"outlineBlack"}
                  onClick={handlePasswordUpdate}
                  disabled={
                    isUpdatingPassword || !currentPassword || !newPassword
                  }
                >
                  {isUpdatingPassword && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
              {/* API Access section hidden - moving to subscription model
              <Separator />
              <div className="space-y-4">
                <div className="font-medium">API Access</div>
                <div className="text-sm text-muted-foreground">
                  Manage API keys and access tokens for your applications
                </div>
                <Button
                  variant="outlineBlack"
                  onClick={() => router.push("/dashboard/api-keys")}
                >
                  Manage API Keys
                </Button>
              </div>
              */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Personalize how AI2me works for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language */}
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Language</div>
                    <div className="text-sm text-muted-foreground">Choose the language AI2me uses for your account.</div>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setLangOpen(!langOpen)}
                    className="inline-flex items-center gap-2 border border-input bg-background rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors min-w-[130px] justify-between"
                  >
                    <span>{selectedLang.label}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${langOpen ? "rotate-180" : ""}`} />
                  </button>
                  {langOpen && (
                    <div className="absolute right-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl w-48 py-1 max-h-72 overflow-y-auto">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                          className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                        >
                          <span>{lang.label}</span>
                          {language === lang.code && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Separator />
              <Button variant="outlineBlack" onClick={handleSaveLanguage}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive updates and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive updates about your account and usage
                    </div>
                  </div>
                  <Button
                    variant={"outlineBlack"}
                    onClick={() => setEmailNotifications(!emailNotifications)}
                  >
                    {emailNotifications ? "Enabled" : "Disabled"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">SMS Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive critical alerts via text message
                    </div>
                  </div>
                  <Button
                    variant={"outlineBlack"}
                    onClick={() => setSmsNotifications(!smsNotifications)}
                  >
                    {smsNotifications ? "Enabled" : "Disabled"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Marketing Emails</div>
                    <div className="text-sm text-muted-foreground">
                      Product updates, tips, and company news
                    </div>
                  </div>
                  <Button
                    variant={"outlineBlack"}
                    onClick={() => setMarketingEmails(!marketingEmails)}
                  >
                    {marketingEmails ? "Enabled" : "Disabled"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Security Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Important security and compliance notifications
                    </div>
                  </div>
                  <Button
                    variant={"outlineBlack"}
                    onClick={() => setSecurityAlerts(!securityAlerts)}
                  >
                    {securityAlerts ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>
              <Button variant={"outlineBlack"}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPageWrapper() {
  return (
    <Suspense>
      <SettingsPage />
    </Suspense>
  );
}
