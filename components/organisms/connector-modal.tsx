"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCompanySettings } from "@/context/CompanySettingsContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { connectorApi } from "@/lib/connector-api";
import {
  Connector,
  ConnectorCreate,
  ConnectorUpdate,
  CONNECTOR_TYPES,
  ConnectionConfig,
  isS3ConnectionConfig,
  isPostgreSQLConnectionConfig,
} from "@/types/connector";

interface ConnectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectorSaved: () => void;
  connector?: Connector | null;
  mode: "create" | "edit";
}

export function ConnectorModal({
  open,
  onOpenChange,
  onConnectorSaved,
  connector,
  mode,
}: ConnectorModalProps) {
  const [formData, setFormData] = useState({
    name: connector?.name || "",
    connector_type: connector?.connector_type || "",
    // S3 connection fields
    s3_url: "",
    aws_secret_key: "",
    aws_access_key: "",
    // PostgreSQL connection fields
    postgres_url: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { industry: userIndustryFromContext } = useCompanySettings();
  const [userIndustry, setUserIndustry] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Use company industry from context when modal opens in create mode
  useEffect(() => {
    if (open && mode === "create") {
      setUserIndustry(userIndustryFromContext || "Other");
    }
  }, [open, mode, userIndustryFromContext]);

  // Populate form fields when editing a connector
  useEffect(() => {
    if (connector && mode === "edit") {
      const config = connector.connection_config;
      setFormData({
        name: connector.name || "",
        connector_type: connector.connector_type || "",
        // S3 connection fields
        s3_url: isS3ConnectionConfig(config) ? config.s3_url : "",
        aws_secret_key: isS3ConnectionConfig(config)
          ? config.aws_secret_key
          : "",
        aws_access_key: isS3ConnectionConfig(config)
          ? config.aws_access_key
          : "",
        // PostgreSQL connection fields
        postgres_url: isPostgreSQLConnectionConfig(config)
          ? config.postgres_url
          : "",
        // Stripe connection fields
        stripe_secret_key: isStripeConnectionConfig(config)
          ? config.stripe_secret_key
          : "",
        stripe_publishable_key: isStripeConnectionConfig(config)
          ? config.stripe_publishable_key || ""
          : "",
      });
    }
  }, [connector, mode]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateConnectionFields = () => {
    const errors: Record<string, string> = {};

    if (formData.connector_type === "s3") {
      if (!formData.s3_url.trim()) {
        errors.s3_url = "S3 URL is required";
      } else {
        // Validate S3 URL format
        const s3UrlRegex =
          /^https?:\/\/([a-zA-Z0-9.-]+)\.s3(?:[a-zA-Z0-9.-]*)?\.amazonaws\.com(?:\/.*)?$/;
        if (!s3UrlRegex.test(formData.s3_url.trim())) {
          errors.s3_url =
            "Please enter a valid S3 URL (e.g., https://bucket-name.s3.amazonaws.com)";
        }
      }
      // AWS credentials are now optional - no validation needed
    } else if (formData.connector_type === "postgresql") {
      if (!formData.postgres_url.trim()) {
        errors.postgres_url = "PostgreSQL URL is required";
      } else {
        // Validate PostgreSQL URL format
        const postgresUrlRegex =
          /^postgres(?:ql)?:\/\/(?:[^:]+):(?:[^@]+)@(?:[^:]+)(?::\d+)?\/(?:[^?]+)(?:\?.*)?$/;
        if (!postgresUrlRegex.test(formData.postgres_url.trim())) {
          errors.postgres_url =
            "Please enter a valid PostgreSQL URL (e.g., postgresql://username:password@host:port/database)";
        }
      }
    } else if (formData.connector_type === "stripe") {
      if (!formData.stripe_secret_key.trim()) {
        errors.stripe_secret_key = "Stripe Secret Key is required";
      } else if (!formData.stripe_secret_key.trim().startsWith("sk_")) {
        errors.stripe_secret_key = "Stripe Secret Key must start with sk_live_ or sk_test_";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Connector name is required");
      return;
    }

    if (!formData.connector_type) {
      toast.error("Connector type is required");
      return;
    }

    if (mode === "create" && !validateConnectionFields()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        // Build connection config based on connector type
        let connectionConfig: ConnectionConfig;
        if (formData.connector_type === "s3") {
          connectionConfig = {
            s3_url: formData.s3_url.trim(),
            aws_access_key: formData.aws_access_key.trim(),
            aws_secret_key: formData.aws_secret_key.trim(),
          };
        } else if (formData.connector_type === "postgresql") {
          connectionConfig = {
            postgres_url: formData.postgres_url.trim(),
          };
        } else if (formData.connector_type === "stripe") {
          connectionConfig = {
            stripe_secret_key: formData.stripe_secret_key.trim(),
            stripe_publishable_key: formData.stripe_publishable_key.trim() || undefined,
          };
        } else {
          throw new Error("Invalid connector type");
        }

        const createData: ConnectorCreate = {
          name: formData.name.trim(),
          connector_type: formData.connector_type as "s3" | "postgresql" | "stripe",
          industry: userIndustry,
          connection_config: connectionConfig,
        };

        await connectorApi.createConnector(createData);
        toast.success("Connector created successfully!");
      } else if (mode === "edit" && connector) {
        const updateData: ConnectorUpdate = {
          name: formData.name.trim(),
        };

        await connectorApi.updateConnector(connector.id, updateData);
        toast.success("Connector updated successfully!");
      }

      onConnectorSaved();
      onOpenChange(false);
      resetForm();
    } catch (error: unknown) {
      console.error("Error saving connector:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { detail?: string } } }).response
              ?.data?.detail || "Failed to save connector"
          : "Failed to save connector";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      connector_type: "",
      // S3 connection fields
      s3_url: "",
      aws_secret_key: "",
      aws_access_key: "",
      // PostgreSQL connection fields
      postgres_url: "",
      // Stripe connection fields
      stripe_secret_key: "",
      stripe_publishable_key: "",
    });
    setFieldErrors({});
  };

  const handleClose = () => {
    onOpenChange(false);
    if (mode === "create") {
      resetForm();
    } else {
      setFieldErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Connector" : "Edit Connector"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new data connector for your organization."
              : "Update the connector name."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Connector Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter connector name"
              required
            />
          </div>

          {/* Show connection configuration in edit mode */}
          {mode === "edit" && connector && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700">
                Connection Configuration
              </h3>
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Type:</strong>{" "}
                  {connector.connector_type.toUpperCase()}
                </p>
                {connector.connector_type === "s3" &&
                  isS3ConnectionConfig(connector.connection_config) && (
                    <>
                      <p>
                        <strong>S3 URL:</strong>{" "}
                        {connector.connection_config.s3_url || "N/A"}
                      </p>
                      <p>
                        <strong>AWS Access Key:</strong>{" "}
                        {connector.connection_config.aws_access_key
                          ? "••••••••"
                          : "N/A"}
                      </p>
                      <p>
                        <strong>AWS Secret Key:</strong>{" "}
                        {connector.connection_config.aws_secret_key
                          ? "••••••••"
                          : "N/A"}
                      </p>
                    </>
                  )}
                {connector.connector_type === "postgresql" &&
                  isPostgreSQLConnectionConfig(connector.connection_config) && (
                    <p>
                      <strong>PostgreSQL URL:</strong>{" "}
                      {connector.connection_config.postgres_url || "N/A"}
                    </p>
                  )}
                {connector.connector_type === "stripe" &&
                  isStripeConnectionConfig(connector.connection_config) && (
                    <>
                      <p>
                        <strong>Secret Key:</strong> ••••••••
                      </p>
                      {connector.connection_config.stripe_publishable_key && (
                        <p>
                          <strong>Publishable Key:</strong>{" "}
                          {connector.connection_config.stripe_publishable_key}
                        </p>
                      )}
                    </>
                  )}
              </div>
              <p className="text-xs text-gray-500">
                Connection configuration cannot be modified after creation. Only
                the connector name can be updated.
              </p>
            </div>
          )}

          {mode === "create" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="connector_type">Connector Type *</Label>
                <Select
                  value={formData.connector_type}
                  onValueChange={(value) =>
                    handleInputChange("connector_type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select connector type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONNECTOR_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* S3 Connection Fields */}
              {formData.connector_type === "s3" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="s3_url">S3 URL *</Label>
                    <Input
                      id="s3_url"
                      value={formData.s3_url}
                      onChange={(e) =>
                        handleInputChange("s3_url", e.target.value)
                      }
                      placeholder="https://your-bucket.s3.amazonaws.com"
                      required
                      className={fieldErrors.s3_url ? "border-red-500" : ""}
                    />
                    {fieldErrors.s3_url && (
                      <p className="text-sm text-red-500">
                        {fieldErrors.s3_url}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aws_access_key">AWS Access Key</Label>
                    <Input
                      id="aws_access_key"
                      value={formData.aws_access_key}
                      onChange={(e) =>
                        handleInputChange("aws_access_key", e.target.value)
                      }
                      placeholder="AKIA... "
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aws_secret_key">AWS Secret Key</Label>
                    <Input
                      id="aws_secret_key"
                      type="password"
                      value={formData.aws_secret_key}
                      onChange={(e) =>
                        handleInputChange("aws_secret_key", e.target.value)
                      }
                      placeholder="Enter AWS secret key (optional)"
                    />
                  </div>
                </>
              )}

              {/* PostgreSQL Connection Fields */}
              {formData.connector_type === "postgresql" && (
                <div className="space-y-2">
                  <Label htmlFor="postgres_url">PostgreSQL URL *</Label>
                  <Input
                    id="postgres_url"
                    value={formData.postgres_url}
                    onChange={(e) =>
                      handleInputChange("postgres_url", e.target.value)
                    }
                    placeholder="postgresql://username:password@host:port/database"
                    required
                    className={fieldErrors.postgres_url ? "border-red-500" : ""}
                  />
                  {fieldErrors.postgres_url && (
                    <p className="text-sm text-red-500">
                      {fieldErrors.postgres_url}
                    </p>
                  )}
                </div>
              )}

              {/* Stripe Connection Fields */}
              {formData.connector_type === "stripe" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="stripe_secret_key">Stripe Secret Key *</Label>
                    <Input
                      id="stripe_secret_key"
                      type="password"
                      value={formData.stripe_secret_key}
                      onChange={(e) =>
                        handleInputChange("stripe_secret_key", e.target.value)
                      }
                      placeholder="sk_live_... or sk_test_..."
                      required
                      className={fieldErrors.stripe_secret_key ? "border-red-500" : ""}
                    />
                    {fieldErrors.stripe_secret_key && (
                      <p className="text-sm text-red-500">
                        {fieldErrors.stripe_secret_key}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripe_publishable_key">Stripe Publishable Key</Label>
                    <Input
                      id="stripe_publishable_key"
                      value={formData.stripe_publishable_key}
                      onChange={(e) =>
                        handleInputChange("stripe_publishable_key", e.target.value)
                      }
                      placeholder="pk_live_... or pk_test_... (optional)"
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outlineBlack"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create Connector"
                  : "Update Connector"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
