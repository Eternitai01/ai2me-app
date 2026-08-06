/**
 * Validation API Client
 * Handles connector validation operations
 */

import apiService from './axios';

export interface ValidationIssue {
  type: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  details?: Record<string, unknown>;
}

export interface ColumnMetrics {
  source_field: string;
  target_column?: string;
  has_validation_rules: boolean;
  is_pii: boolean;
  null_count?: number;
  unique_count?: number;
}

export interface ValidationResult {
  id: string;
  connector_id: string;
  job_run_id?: string;
  source_row_count?: number;
  target_row_count?: number;
  row_count_match: string;
  row_count_difference?: number;
  schema_match: string;
  schema_issues?: ValidationIssue[];
  quality_score?: number;
  null_percentage?: number;
  duplicate_percentage?: number;
  column_metrics?: Record<string, ColumnMetrics>;
  issues?: ValidationIssue[];
  issue_count: number;
  warning_count: number;
  error_count: number;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  validated_at?: string;
  created_at?: string;
}

export interface ActivationCheck {
  can_activate: boolean;
  blocking_reasons: string[];
  connector_status: string;
  prerequisites: {
    schema_discovered: boolean;
    fields_mapped: boolean;
    catalog_ready: boolean;
    etl_job_succeeded: boolean;
    validation_passed: boolean;
  };
}

export interface ActivationResponse {
  success: boolean;
  message: string;
  connector_id: string;
  new_status: string;
}

export const validationApi = {
  /**
   * Trigger validation for a connector
   */
  async triggerValidation(connectorId: string, jobRunId?: string): Promise<ValidationResult> {
    const data = await apiService.post<ValidationResult, { job_run_id?: string }>(
      `/connectors/${connectorId}/validate`,
      { job_run_id: jobRunId }
    );
    return data;
  },

  /**
   * Get validation history for a connector
   */
  async getValidationResults(connectorId: string, limit: number = 10): Promise<ValidationResult[]> {
    const data = await apiService.get<ValidationResult[]>(
      `/connectors/${connectorId}/validation-results`,
      { params: { limit } }
    );
    return data;
  },

  /**
   * Get the latest validation result
   */
  async getLatestValidation(connectorId: string): Promise<ValidationResult> {
    const data = await apiService.get<ValidationResult>(
      `/connectors/${connectorId}/validation-results/latest`
    );
    return data;
  },

  /**
   * Check if a connector can be activated
   */
  async checkCanActivate(connectorId: string): Promise<ActivationCheck> {
    const data = await apiService.get<ActivationCheck>(
      `/connectors/${connectorId}/can-activate`
    );
    return data;
  },

  /**
   * Activate a connector
   */
  async activateConnector(connectorId: string): Promise<ActivationResponse> {
    const data = await apiService.post<ActivationResponse, void>(
      `/connectors/${connectorId}/activate`
    );
    return data;
  },
};

