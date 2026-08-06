/**
 * Schema Discovery Types
 */

export interface ColumnSchema {
  column_name: string;
  data_type: string;
  suggested_target_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_pii: boolean;
  comment?: string;
  character_maximum_length?: number;
  numeric_precision?: number;
  column_default?: string;
}

export interface TableSchema {
  table_name: string;
  table_type?: string;
  columns: ColumnSchema[];
  column_count: number;
  pii_columns: string[];
  comment?: string;
}

export interface RelationshipSchema {
  relationship_name: string;
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  relationship_type: string;
  update_rule?: string;
  delete_rule?: string;
}

export interface IndexSchema {
  table_name: string;
  index_name: string;
  is_unique: boolean;
  is_primary: boolean;
  columns: string[];
}

export interface PostgresSchemaResponse {
  source_type: "postgresql";
  database: string;
  schema: string;
  host: string;
  port: number;
  tables: TableSchema[];
  relationships: RelationshipSchema[];
  indexes: IndexSchema[];
  total_tables: number;
  total_columns: number;
  total_relationships: number;
  connector_id?: string;
  connector_name?: string;
  industry?: string;
  discovered_at: string;
}

export interface S3SchemaResponse {
  source_type: "s3";
  source_location: string;
  table_name?: string;
  database_name?: string;
  file_format?: string;
  bucket?: string;
  prefix?: string;
  columns?: ColumnSchema[];
  total_columns?: number;
  pii_columns?: string[];
  partition_keys?: string[];
  status?: string;
  message?: string;
  recommendation?: string;
  connector_id?: string;
  connector_name?: string;
  industry?: string;
  discovered_at: string;
}

export type SchemaResponse = PostgresSchemaResponse | S3SchemaResponse;

export interface DiscoveryStatusResponse {
  connector_id: string;
  connector_name: string;
  status: string;
  last_discovery?: {
    discovered_at: string;
    total_tables?: number;
    total_columns?: number;
    status: string;
    error?: string;
  };
  message?: string;
}

export interface SchemaDiscoveryRequest {
  connector_id: string;
  force_refresh?: boolean;
  glue_database?: string;
}

export interface ConnectionTestResponse {
  status: string;
  message: string;
  database_version?: string;
  error_type?: string;
  tested_at: string;
}
