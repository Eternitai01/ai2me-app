/**
 * Field Mapping TypeScript Types
 */

export interface FieldMapping {
  id: string;
  connector_id: string;
  organization_id: string;
  source_field_name: string;
  source_data_type: string;
  target_column: string;
  target_data_type: string;
  is_pii: boolean;
  is_required: boolean;
  is_unique: boolean;
  transformation_rule: Record<string, unknown>;
  validation_rules: Record<string, unknown>;
  description?: string;
  sample_value?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FieldMappingCreate {
  source_field_name: string;
  source_data_type: string;
  target_column: string;
  target_data_type: string;
  is_pii?: boolean;
  is_required?: boolean;
  is_unique?: boolean;
  transformation_rule?: Record<string, unknown>;
  validation_rules?: Record<string, unknown>;
  description?: string;
  sample_value?: string;
}

export interface FieldMappingListResponse {
  mappings: FieldMapping[];
  total: number;
  connector_id: string;
}

export interface FieldSuggestion {
  source_column: string;
  target_field: string;
  confidence: number;
  similarity_score: number;
  data_type_match: boolean;
  pii_match: boolean;
  alias_match: boolean;
  reasoning: string;
  suggested_transformation?: Record<string, unknown>;
}

export interface FieldSuggestionRequest {
  template_id: string;
  table_name?: string;
  source_columns?: unknown[];
}

export interface FieldSuggestionResponse {
  suggestions: FieldSuggestion[];
  total_suggestions: number;
  high_confidence_count: number;
  medium_confidence_count: number;
  low_confidence_count: number;
}

