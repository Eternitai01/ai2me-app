// Connection configuration types
export interface S3ConnectionConfig {
  s3_url: string;
  aws_access_key: string;
  aws_secret_key: string;
}

export interface PostgreSQLConnectionConfig {
  postgres_url: string;
}

export interface StripeConnectionConfig {
  stripe_secret_key: string;
  stripe_publishable_key?: string;
}

export type ConnectionConfig = S3ConnectionConfig | PostgreSQLConnectionConfig | StripeConnectionConfig;

// Type guards
export const isS3ConnectionConfig = (
  config: ConnectionConfig
): config is S3ConnectionConfig => {
  return "s3_url" in config;
};

export const isPostgreSQLConnectionConfig = (
  config: ConnectionConfig
): config is PostgreSQLConnectionConfig => {
  return "postgres_url" in config;
};

export const isStripeConnectionConfig = (
  config: ConnectionConfig
): config is StripeConnectionConfig => {
  return "stripe_secret_key" in config;
};

export interface Connector {
  id: string;
  organization_id: string;
  name: string;
  connector_type: "s3" | "postgresql" | "stripe";
  industry?: string; // Optional until migration is applied
  redshift_table?: string; // Redshift table name
  status: "pending" | "active" | "failed" | "testing" | "inactive";
  connection_config: ConnectionConfig;
  created_at: string;
  updated_at: string;
  created_by?: string;
  catalog_database?: string;
  catalog_status?: string;
  catalog_crawler_name?: string;
  redshift_connection_name?: string;
  redshift_schema?: string;
  meta_data?: {
    glue_connection_name?: string;
    schema_discovered?: boolean;
    [key: string]: unknown;
  };
}

export interface ConnectorCreate {
  name: string;
  connector_type: "s3" | "postgresql" | "stripe";
  industry?: string; // Optional since it will be populated from user's organization
  redshift_table?: string; // Redshift table name
  status?: "pending" | "active" | "failed" | "testing" | "inactive"; // Default to pending
  connection_config?: ConnectionConfig;
}

export interface ConnectorUpdate {
  name: string;
}

export interface ConnectorListResponse {
  connectors: Connector[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface ConnectorDeleteResponse {
  message: string;
  connector_id: string;
}

export const CONNECTOR_TYPES = ["s3", "postgresql", "stripe"] as const;

export const CONNECTOR_STATUSES = [
  "pending",
  "active",
  "failed",
  "testing",
  "inactive",
] as const;

export const INDUSTRIES = [
  "Finance",
  "Healthcare",
  "Academia",
  "Retail",
  "Telco",
  "Transportation",
  "Food",
  "Other",
] as const;
