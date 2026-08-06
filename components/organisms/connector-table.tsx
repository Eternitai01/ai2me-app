"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Plus, Play, Search, Loader2, Workflow, Trash2, Activity, Zap, Database, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { connectorApi } from "@/lib/connector-api";
import { schemaDiscoveryApi } from "@/lib/schema-discovery-api";
import { glueJobApi } from "@/lib/glue-job-api";
import {
  Connector,
  isS3ConnectionConfig,
  isPostgreSQLConnectionConfig,
  isStripeConnectionConfig,
} from "@/types/connector";
import { SchemaResponse, ColumnSchema } from "@/types/schema";
import { Relationship } from "@/types/relationship";
import { ConnectorModal } from "./connector-modal";
import { SchemaViewer } from "./schema-viewer";
import { EntityTemplatePicker } from "./entity-template-picker";
import { FieldMapper } from "./field-mapper";
import { RelationshipBuilder } from "./relationship-builder";
import { GlueJobConfig } from "./glue-job-config";
import { JobProgressTracker } from "./job-progress-tracker";
import { GlueConnectionWizard } from "./glue-connection-wizard";
import { CrawlerStatus } from "./crawler-status";
import { ConnectorSetupWizard } from "./connector-setup-wizard";
import { CatalogSetup } from "./catalog-setup";
import { ValidationResults } from "./validation-results";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ConnectorTableProps {
  connectors: Connector[];
  onConnectorUpdated: () => void;
}

export function ConnectorTable({
  connectors,
  onConnectorUpdated,
}: ConnectorTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(
    null
  );
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activatingConnector, setActivatingConnector] = useState<string | null>(
    null
  );
  const [discoveringSchema, setDiscoveringSchema] = useState<string | null>(
    null
  );
  const [schemaViewerOpen, setSchemaViewerOpen] = useState(false);
  const [discoveredSchema, setDiscoveredSchema] = useState<SchemaResponse | null>(
    null
  );
  const [discoveredConnectorId, setDiscoveredConnectorId] = useState<string | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [fieldMapperOpen, setFieldMapperOpen] = useState(false);
  const [relationshipBuilderOpen, setRelationshipBuilderOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [availableConnectors, setAvailableConnectors] = useState<Connector[]>(connectors);
  const [existingRelationships, setExistingRelationships] = useState<Relationship[]>([]);
  const [connectorForMapping, setConnectorForMapping] = useState<Connector | null>(null);
  const [glueJobConfigOpen, setGlueJobConfigOpen] = useState(false);
  const [generatedJobId, setGeneratedJobId] = useState<string | null>(null);
  const [generatingJob, setGeneratingJob] = useState<string | null>(null);
  const [jobProgressOpen, setJobProgressOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedConnectorForJob, setSelectedConnectorForJob] = useState<Connector | null>(null);
  const [deletingConnector, setDeletingConnector] = useState<string | null>(null);
  const [glueWizardOpen, setGlueWizardOpen] = useState(false);
  const [crawlerStatusOpen, setCrawlerStatusOpen] = useState(false);
  const [selectedCrawlerName, setSelectedCrawlerName] = useState<string | null>(null);
  const [setupWizardOpen, setSetupWizardOpen] = useState(false);
  const [catalogSetupOpen, setCatalogSetupOpen] = useState(false);
  const [selectedConnectorForCatalog, setSelectedConnectorForCatalog] = useState<Connector | null>(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const [selectedConnectorForValidation, setSelectedConnectorForValidation] = useState<Connector | null>(null);

  // Helper to check if connector should show advanced options
  // Show if schema was just discovered OR if connector is PostgreSQL/S3 (assume schema can be discovered)
  const shouldShowAdvancedOptions = (connector: Connector) => {
    return (
      discoveredConnectorId === connector.id ||
      connector.connector_type === "postgresql" ||
      connector.connector_type === "s3"
    );
  };

  const handleCreateConnector = () => {
    setSelectedConnector(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleEditConnector = (connector: Connector) => {
    setSelectedConnector(connector);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDeleteConnector = async (connector: Connector) => {
    if (!confirm(`Are you sure you want to delete "${connector.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingConnector(connector.id);
    const toastId = toast.loading("Deleting connector...");

    try {
      await connectorApi.deleteConnector(connector.id);

      toast.dismiss(toastId);
      toast.success("Connector deleted successfully");

      // Wait a bit before refreshing to avoid rate limit
      setTimeout(() => {
        onConnectorUpdated();
      }, 500);
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error("Error deleting connector:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { detail?: string } } }).response
            ?.data?.detail || "Failed to delete connector"
          : "Failed to delete connector";
      toast.error(errorMessage);
    } finally {
      setDeletingConnector(null);
    }
  };

  const handleActivateConnector = async (connector: Connector) => {
    setActivatingConnector(connector.id);
    try {
      // First check prerequisites
      const { validationApi } = await import("@/lib/validation-api");
      const activationCheck = await validationApi.checkCanActivate(connector.id);
      
      if (!activationCheck.can_activate) {
        // Show blocking reasons and offer to start guided setup
        const reasons = activationCheck.blocking_reasons.join("\n• ");
        const startGuide = confirm(
          `Cannot activate connector. Prerequisites not met:\n\n• ${reasons}\n\nWould you like to start the Guided Setup to complete these steps?`
        );
        
        if (startGuide) {
          // Open the guided setup wizard
          handleGetStarted(connector);
        }
        return;
      }
      
      // All prerequisites met, proceed with activation using POST endpoint
      // which also validates prerequisites on backend
      const response = await validationApi.activateConnector(connector.id);
      if (response.success) {
        toast.success("🎉 Connector activated successfully!");
        onConnectorUpdated();
      }
    } catch (error: unknown) {
      console.error("Error activating connector:", error);
      const errorResponse = error as { response?: { data?: { detail?: { message?: string; blocking_reasons?: string[] } | string } } };
      const detail = errorResponse?.response?.data?.detail;
      
      if (typeof detail === 'object' && detail?.blocking_reasons) {
        // Show detailed blocking reasons
        const reasons = detail.blocking_reasons.join("\n• ");
        toast.error(`Cannot activate:\n• ${reasons}`, { duration: 6000 });
      } else {
        const errorMessage = typeof detail === 'string' ? detail : "Failed to activate connector";
        toast.error(errorMessage);
      }
    } finally {
      setActivatingConnector(null);
    }
  };

  const handleDiscoverSchema = async (connector: Connector) => {
    setDiscoveringSchema(connector.id);
    const toastId = toast.loading("Discovering schema...");

    try {
      const schema = await schemaDiscoveryApi.discoverSchema({
        connector_id: connector.id,
        force_refresh: false,
      });

      // Dismiss loading toast and show success
      toast.dismiss(toastId);

      // Calculate table/column counts for success message
      const tableCount = schema.source_type === "postgresql"
        ? schema.total_tables
        : 1;
      const colCount = schema.source_type === "postgresql"
        ? schema.total_columns
        : schema.total_columns || 0;

      toast.success(`Schema discovered! Found ${tableCount} tables with ${colCount} columns`);

      setDiscoveredSchema(schema);
      setDiscoveredConnectorId(connector.id);
      setConnectorForMapping(connector); // Set connector for mapping actions
      setSchemaViewerOpen(true);
    } catch (error: unknown) {
      // Dismiss loading toast and show error
      toast.dismiss(toastId);

      console.error("Error discovering schema:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { detail?: string } } }).response
            ?.data?.detail || "Failed to discover schema"
          : "Failed to discover schema";
      toast.error(errorMessage);
    } finally {
      setDiscoveringSchema(null);
    }
  };

  const handleMapFields = async (connector: Connector) => {
    setConnectorForMapping(connector);
    // First discover schema if not already discovered
    if (!discoveredSchema || discoveredConnectorId !== connector.id) {
      await handleDiscoverSchema(connector);
      // Wait a bit for schema to be set
      setTimeout(() => {
        setTemplatePickerOpen(true);
      }, 500);
    } else {
      setTemplatePickerOpen(true);
    }
  };

  const handleTemplateSelected = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setTemplatePickerOpen(false);
    setFieldMapperOpen(true);
  };

  const handleViewJobStatus = async (connector: Connector) => {
    try {
      const { glueJobApi } = await import("@/lib/glue-job-api");
      const jobsResponse = await glueJobApi.listJobs(connector.id, 1, 1);

      if (jobsResponse.jobs && jobsResponse.jobs.length > 0) {
        const latestJob = jobsResponse.jobs[0];
        setSelectedJobId(latestJob.id);
        setSelectedConnectorForJob(connector);
        setJobProgressOpen(true);
      } else {
        toast.info("No jobs found for this connector");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load job status");
    }
  };

  const handleGenerateJob = async (connector: Connector) => {
    setGeneratingJob(connector.id);
    setConnectorForMapping(connector);

    try {
      const { glueJobApi } = await import("@/lib/glue-job-api");

      // First check if jobs already exist
      const toastId = toast.loading("Checking for existing jobs...");

      try {
        const existingJobs = await glueJobApi.listJobs(connector.id, 1, 10);

        if (existingJobs.jobs && existingJobs.jobs.length > 0) {
          // Job already exists, open config with existing job
          const existingJob = existingJobs.jobs[0];
          toast.dismiss(toastId);
          toast.info(`Using existing job: ${existingJob.job_name}`, {
            description: existingJob.status === "created" ? "Ready to start import" : `Status: ${existingJob.status}`
          });
          setGeneratedJobId(existingJob.id);
          setGlueJobConfigOpen(true);
          setGeneratingJob(null);
          return;
        }
      } catch (e) {
        // No existing jobs, proceed with generation
      }

      toast.dismiss(toastId);
      const toastId2 = toast.loading("Generating PySpark ETL script...");

      try {
        const result = await glueJobApi.generateScript(connector.id);

        toast.dismiss(toastId2);
        toast.success(
          `ETL script generated! ${result.metadata.field_count} fields mapped`,
          {
            description: `Job: ${result.job_name}`,
          }
        );

        setGeneratedJobId(result.job_id);
        setGlueJobConfigOpen(true);
      } catch (scriptError: any) {
        toast.dismiss(toastId2);
        toast.error(scriptError.message || "Failed to generate ETL script");
        console.error("Error generating script:", scriptError);
        return; // Don't re-throw, error already shown
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate ETL job");
      console.error("Error generating job:", error);
    } finally {
      setGeneratingJob(null);
    }
  };

  const handleDefineRelationships = async (connector: Connector) => {
    setConnectorForMapping(connector);

    // Always open the modal, even if loading fails
    setRelationshipBuilderOpen(true);

    try {
      // Load all connectors
      const connectorsResponse = await connectorApi.getConnectors(1, 100);
      setAvailableConnectors(connectorsResponse.connectors);
    } catch (error) {
      console.error("Error loading connectors:", error);
      toast.error("Failed to load connectors, using current list");
      // Fallback to connectors prop
      setAvailableConnectors(connectors);
    }

    // Load relationships (separate try-catch to not block modal)
    try {
      const { relationshipApi } = await import("@/lib/relationship-api");
      const relationshipsResponse = await relationshipApi.getRelationships(connector.id);
      setExistingRelationships(relationshipsResponse.relationships);
    } catch (error) {
      console.error("Error loading relationships:", error);
      setExistingRelationships([]);
      // Don't show error toast, just use empty list
    }
  };

  // Helper to close all modals
  const closeAllModals = () => {
    setCatalogSetupOpen(false);
    setCrawlerStatusOpen(false);
    setSchemaViewerOpen(false);
    setFieldMapperOpen(false);
    setRelationshipBuilderOpen(false);
    setGlueJobConfigOpen(false);
    setJobProgressOpen(false);
    setSetupWizardOpen(false);
    setValidationOpen(false);
    setGlueWizardOpen(false);
    setSelectedConnectorForCatalog(null);
    setSelectedCrawlerName(null);
    setSelectedConnector(null);
    setSelectedConnectorForValidation(null);
  };

  const handleSetupConnection = (connector: Connector) => {
    closeAllModals();
    setConnectorForMapping(connector);
    setGlueWizardOpen(true);
  };

  const handleValidateData = (connector: Connector) => {
    closeAllModals();
    setSelectedConnectorForValidation(connector);
    setValidationOpen(true);
  };

  const handleSetupCatalog = (connector: Connector) => {
    closeAllModals();
    setSelectedConnectorForCatalog(connector);
    setCatalogSetupOpen(true);
  };

  const handleManageCrawler = (connector: Connector) => {
    closeAllModals();
    setSelectedCrawlerName(connector.catalog_crawler_name || null);
    setConnectorForMapping(connector);
    setCrawlerStatusOpen(true);
  };

  const handleGetStarted = (connector: Connector) => {
    setConnectorForMapping(connector);
    setSetupWizardOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      case "testing":
        return "outline";
      case "inactive":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getConnectionUrl = (connector: Connector) => {
    if (
      connector.connector_type === "s3" &&
      isS3ConnectionConfig(connector.connection_config)
    ) {
      const s3Url = connector.connection_config.s3_url;
      if (!s3Url) return "N/A";

      // Mask S3 URL: show protocol and domain, mask bucket name
      try {
        const url = new URL(s3Url);
        const hostname = url.hostname;
        // Extract bucket name (first part before .s3)
        const bucketMatch = hostname.match(/^([^.]+)\.s3/);
        if (bucketMatch) {
          const bucketName = bucketMatch[1];
          const maskedBucket =
            bucketName.length > 4
              ? `${bucketName.substring(0, 2)}***${bucketName.substring(bucketName.length - 2)}`
              : "***";
          return `${url.protocol}//${maskedBucket}.s3${hostname.substring(hostname.indexOf(".s3"))}`;
        }
        return `${url.protocol}//***.s3.amazonaws.com`;
      } catch {
        return "***.s3.amazonaws.com";
      }
    } else if (
      connector.connector_type === "postgresql" &&
      isPostgreSQLConnectionConfig(connector.connection_config)
    ) {
      const postgresUrl = connector.connection_config.postgres_url;
      if (!postgresUrl) return "N/A";

      try {
        const url = new URL(postgresUrl);
        const hostname = url.hostname;
        const port = url.port;
        const maskedHost =
          hostname.length > 4
            ? `${hostname.substring(0, 2)}***${hostname.substring(hostname.length - 2)}`
            : "***";
        return `${url.protocol}//${maskedHost}${port ? `:${port}` : ""}`;
      } catch {
        return "***:***";
      }
    } else if (
      connector.connector_type === "stripe" &&
      isStripeConnectionConfig(connector.connection_config)
    ) {
      const key = connector.connection_config.stripe_secret_key || "";
      const mode = key.startsWith("sk_live_") ? "Live" : "Test";
      return `Stripe ${mode} (sk_***${key.slice(-4)})`;
    }
    return "N/A";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Data Connectors</h2>
        <Button
          onClick={handleCreateConnector}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Connector
        </Button>
      </div>

      {connectors.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>
            No connectors found. Create your first connector to get started.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connectors.map((connector) => (
                <TableRow key={connector.id}>
                  <TableCell className="font-medium">
                    {connector.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {connector.connector_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{connector.industry || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(connector.status)}>
                      {connector.status.charAt(0).toUpperCase() +
                        connector.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {getConnectionUrl(connector)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* Get Started - Guided Setup Wizard */}
                        <DropdownMenuItem
                          onClick={() => handleGetStarted(connector)}
                          className="flex items-center gap-2 text-green-600 font-semibold"
                        >
                          <Zap className="h-4 w-4" />
                          Get Started (Guided Setup)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDiscoverSchema(connector)}
                          disabled={discoveringSchema === connector.id}
                          className="flex items-center gap-2 text-blue-600"
                        >
                          {discoveringSchema === connector.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                          {discoveringSchema === connector.id
                            ? "Discovering..."
                            : "Discover Schema"}
                        </DropdownMenuItem>
                        {/* Setup Catalog & Crawler - Only for S3 connectors */}
                        {/* PostgreSQL uses direct JDBC, no catalog/crawler needed */}
                        {connector.connector_type === 's3' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleSetupCatalog(connector)}
                              className="flex items-center gap-2 text-purple-600"
                            >
                              <Database className="h-4 w-4" />
                              Setup Catalog
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleManageCrawler(connector)}
                              className="flex items-center gap-2 text-teal-600"
                            >
                              <Search className="h-4 w-4" />
                              Manage Crawler
                            </DropdownMenuItem>
                          </>
                        )}
                        {shouldShowAdvancedOptions(connector) && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleMapFields(connector)}
                              className="flex items-center gap-2 text-green-600"
                            >
                              <Plus className="h-4 w-4" />
                              Map Fields
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDefineRelationships(connector)}
                              className="flex items-center gap-2 text-purple-600"
                            >
                              <Search className="h-4 w-4" />
                              Define Relationships
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleGenerateJob(connector)}
                              disabled={generatingJob === connector.id}
                              className="flex items-center gap-2 text-blue-600"
                            >
                              {generatingJob === connector.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Workflow className="h-4 w-4" />
                              )}
                              {generatingJob === connector.id
                                ? "Generating..."
                                : "Generate ETL Job"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewJobStatus(connector)}
                              className="flex items-center gap-2 text-indigo-600"
                            >
                              <Activity className="h-4 w-4" />
                              View Job Status
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleValidateData(connector)}
                              className="flex items-center gap-2 text-green-600"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Validate Data
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleEditConnector(connector)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteConnector(connector)}
                          disabled={deletingConnector === connector.id}
                          className="flex items-center gap-2 text-red-600"
                        >
                          {deletingConnector === connector.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          {deletingConnector === connector.id ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                        {connector.status === "pending" && (
                          <DropdownMenuItem
                            onClick={() => handleActivateConnector(connector)}
                            disabled={activatingConnector === connector.id}
                            className="flex items-center gap-2 text-green-600"
                          >
                            <Play className="h-4 w-4" />
                            {activatingConnector === connector.id
                              ? "Activating..."
                              : "Activate"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConnectorModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConnectorSaved={onConnectorUpdated}
        connector={selectedConnector}
        mode={modalMode}
      />

      <SchemaViewer
        schema={discoveredSchema}
        isOpen={schemaViewerOpen}
        onClose={() => setSchemaViewerOpen(false)}
        onMapFields={connectorForMapping ? () => {
          setSchemaViewerOpen(false);
          setTimeout(() => setTemplatePickerOpen(true), 100);
        } : undefined}
        onDefineRelationships={connectorForMapping ? () => {
          setSchemaViewerOpen(false);
          setTimeout(() => handleDefineRelationships(connectorForMapping), 100);
        } : undefined}
        showActions={!!connectorForMapping}
      />

      {connectorForMapping && (
        <>
          <EntityTemplatePicker
            open={templatePickerOpen}
            onOpenChange={setTemplatePickerOpen}
            industry={connectorForMapping.industry || "Other"}
            onTemplateSelected={handleTemplateSelected}
          />

          {selectedTemplateId && discoveredSchema && connectorForMapping && (
            <FieldMapper
              open={fieldMapperOpen}
              onOpenChange={(open) => {
                setFieldMapperOpen(open);
                if (!open) {
                  setSelectedTemplateId(null);
                  setConnectorForMapping(null);
                }
              }}
              connectorId={connectorForMapping.id}
              templateId={selectedTemplateId}
              sourceColumns={
                discoveredSchema.source_type === "postgresql"
                  ? ((discoveredSchema as { tables?: Array<{ columns: ColumnSchema[] }> }).tables?.[0]?.columns || [])
                  : ((discoveredSchema as { columns?: ColumnSchema[] }).columns || [])
              }
              onMappingsSaved={() => {
                onConnectorUpdated();
                setSelectedTemplateId(null);
                setConnectorForMapping(null);
              }}
            />
          )}

          {connectorForMapping && (
            <RelationshipBuilder
              open={relationshipBuilderOpen}
              onOpenChange={(open) => {
                setRelationshipBuilderOpen(open);
                if (!open) {
                  setConnectorForMapping(null);
                }
              }}
              connectorId={connectorForMapping.id}
              availableConnectors={availableConnectors}
              existingRelationships={existingRelationships}
              onRelationshipSaved={async () => {
                onConnectorUpdated();
                // Reload relationships
                if (connectorForMapping) {
                  try {
                    const { relationshipApi } = await import("@/lib/relationship-api");
                    const relationshipsResponse = await relationshipApi.getRelationships(connectorForMapping.id);
                    setExistingRelationships(relationshipsResponse.relationships);
                  } catch (error) {
                    console.error("Error reloading relationships:", error);
                  }
                }
              }}
            />
          )}

          {/* Glue Job Configuration Modal */}
          {connectorForMapping && (
            <GlueJobConfig
              connectorId={connectorForMapping.id}
              connectorName={connectorForMapping.name}
              jobId={generatedJobId}
              isOpen={glueJobConfigOpen}
              onClose={() => {
                setGlueJobConfigOpen(false);
                setGeneratedJobId(null);
              }}
              onJobCreated={() => {
                onConnectorUpdated();
              }}
              onJobStarted={(jobId) => {
                setSelectedConnectorForJob(connectorForMapping);
                setSelectedJobId(jobId);
                setJobProgressOpen(true);
              }}
            />
          )}

          {/* Job Progress Tracker Modal */}
          <Dialog open={jobProgressOpen} onOpenChange={setJobProgressOpen}>
            <DialogContent className="max-w-3xl" aria-describedby="job-status-description">
              <DialogHeader>
                <DialogTitle>
                  Job Status{selectedConnectorForJob ? ` - ${selectedConnectorForJob.name}` : ''}
                </DialogTitle>
                <p id="job-status-description" className="sr-only">
                  View the progress and status of your Glue ETL job
                </p>
              </DialogHeader>
              {selectedConnectorForJob && selectedJobId ? (
                <JobProgressTracker
                  connectorId={selectedConnectorForJob.id}
                  jobId={selectedJobId}
                  onComplete={async () => {
                    toast.success("Job completed successfully!");
                    onConnectorUpdated();
                    
                    // Auto-trigger validation after job completes
                    try {
                      const { validationApi } = await import("@/lib/validation-api");
                      toast.info("Running validation...");
                      const result = await validationApi.triggerValidation(selectedConnectorForJob.id);
                      if (result.status === 'passed') {
                        toast.success('Validation passed! Connector ready to activate.');
                      } else if (result.status === 'warning') {
                        toast.warning(`Validation completed with ${result.warning_count} warnings.`);
                      } else {
                        toast.error(`Validation has ${result.error_count} errors.`);
                      }
                      onConnectorUpdated();
                    } catch {
                      // Validation might fail, that's OK - user can run manually
                      console.log("Auto-validation skipped");
                    }
                  }}
                  onError={(error) => {
                    toast.error(`Job failed: ${error}`);
                  }}
                  onRestart={async () => {
                    try {
                      toast.info("Starting job...");
                      const result = await glueJobApi.startImport(selectedConnectorForJob.id, selectedJobId);
                      toast.success(`Job started: ${result.run_id}`);
                    } catch (err) {
                      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to start job';
                      toast.error(message);
                    }
                  }}
                />
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Loading job status...
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Glue Connection Wizard */}
          {glueWizardOpen && connectorForMapping && (
            <GlueConnectionWizard
              open={glueWizardOpen}
              onOpenChange={(open) => {
                setGlueWizardOpen(open);
                if (!open) setConnectorForMapping(null);
              }}
              connectorId={connectorForMapping.id}
              connectorName={connectorForMapping.name}
              connectorType={connectorForMapping.connector_type}
              onConnectionCreated={() => {
                onConnectorUpdated();
                setGlueWizardOpen(false);
                setConnectorForMapping(null);
              }}
            />
          )}

          {/* Crawler Status Modal */}
          {connectorForMapping && (
            <CrawlerStatus
              connectorId={connectorForMapping.id}
              crawlerName={selectedCrawlerName}
              open={crawlerStatusOpen}
              onClose={() => {
                setCrawlerStatusOpen(false);
                setConnectorForMapping(null);
                setSelectedCrawlerName(null);
              }}
            />
          )}

          {/* Connector Setup Wizard - Guided Flow */}
          {connectorForMapping && (
            <ConnectorSetupWizard
              open={setupWizardOpen}
              onOpenChange={(open) => {
                setSetupWizardOpen(open);
                if (!open) setConnectorForMapping(null);
              }}
              connectorId={connectorForMapping.id}
              connectorName={connectorForMapping.name}
              connectorType={connectorForMapping.connector_type}
              onComplete={() => {
                onConnectorUpdated();
              }}
            />
          )}

          {/* Catalog Setup Modal */}
          {catalogSetupOpen && selectedConnectorForCatalog && (
            <CatalogSetup
              open={catalogSetupOpen}
              onClose={() => {
                setCatalogSetupOpen(false);
                setSelectedConnectorForCatalog(null);
              }}
              connectorId={selectedConnectorForCatalog.id}
              connectorName={selectedConnectorForCatalog.name}
              connectorType={
                selectedConnectorForCatalog.connector_type === 'postgresql' ? 'postgres' : 
                selectedConnectorForCatalog.connector_type === 's3' ? 's3' : 
                'postgres' // default fallback
              }
              connectionName={
                // Use stored glue_connection_name from meta_data if available, otherwise generate a default
                selectedConnectorForCatalog.meta_data?.glue_connection_name ||
                ((selectedConnectorForCatalog.connector_type === 'postgresql' || selectedConnectorForCatalog.connector_type === 'postgres') && 
                isPostgreSQLConnectionConfig(selectedConnectorForCatalog.connection_config)
                  ? `${selectedConnectorForCatalog.name.toLowerCase().replace(/\s+/g, '-')}-connection`
                  : undefined)
              }
              s3Path={
                selectedConnectorForCatalog.connector_type === 's3' && 
                isS3ConnectionConfig(selectedConnectorForCatalog.connection_config)
                  ? selectedConnectorForCatalog.connection_config.s3_url
                  : undefined
              }
              onComplete={() => {
                onConnectorUpdated();
                setCatalogSetupOpen(false);
                setSelectedConnectorForCatalog(null);
              }}
            />
          )}
          
          {/* Validation Results Modal */}
          {validationOpen && selectedConnectorForValidation && (
            <ValidationResults
              open={validationOpen}
              onClose={() => {
                setValidationOpen(false);
                setSelectedConnectorForValidation(null);
              }}
              connectorId={selectedConnectorForValidation.id}
              connectorName={selectedConnectorForValidation.name}
              onActivated={() => {
                onConnectorUpdated();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
