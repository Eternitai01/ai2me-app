import apiService from "./axios";

export interface GenerateScriptRequest {
  connector_id: string;
}

export interface GenerateScriptResponse {
  job_id: string;
  job_name: string;
  script: string;
  estimated_dpu: number;
  status: string;
  metadata: {
    connector_id: string;
    connector_name: string;
    source_type: string;
    target_table: string;
    field_count: number;
    relationship_count: number;
    industry: string;
  };
}

export interface CreateJobRequest {
  job_id: string;
  dpu: number;
  timeout_minutes: number;
  max_retries: number;
  job_parameters?: Record<string, string>;
}

export interface CreateJobResponse {
  job_id: string;
  job_name: string;
  job_arn: string | null;
  status: string;
  message: string;
}

export interface StartJobRequest {
  job_id: string;
}

export interface JobRunResponse {
  run_id: string;
  job_name: string;
  status: string;
  started_at: string;
}

export interface JobStatusResponse {
  job_run_id: string;
  job_name: string;
  status: string;
  started_on: string | null;
  completed_on: string | null;
  execution_time: number | null;
  dpu_seconds: number | null;
  error_message: string | null;
  log_group_name: string | null;
  estimated_cost: number | null;
  progress_percentage: number | null;
}

export const glueJobApi = {
  /**
   * Generate PySpark ETL script from connector field mappings
   */
  async generateScript(connectorId: string): Promise<GenerateScriptResponse> {
    return apiService.post<GenerateScriptResponse>(
      `/connectors/${connectorId}/generate-script`
    );
  },

  /**
   * Create AWS Glue job from generated script
   */
  async createJob(
    connectorId: string,
    data: CreateJobRequest
  ): Promise<CreateJobResponse> {
    return apiService.post<CreateJobResponse>(
      `/connectors/${connectorId}/create-job`,
      data
    );
  },

  /**
   * Start Glue job execution (import data)
   */
  async startImport(
    connectorId: string,
    jobId: string
  ): Promise<JobRunResponse> {
    return apiService.post<JobRunResponse>(
      `/connectors/${connectorId}/start-import?job_id=${jobId}`
    );
  },

  /**
   * Get job run status and metrics
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    return apiService.get<JobStatusResponse>(`/glue-jobs/${jobId}/status`);
  },

  /**
   * List Glue jobs for a connector
   */
  async listJobs(
    connectorId: string,
    page: number = 1,
    size: number = 10
  ): Promise<any> {
    return apiService.get(`/connectors/${connectorId}/glue-jobs`, {
      params: { page, size },
    });
  },

  /**
   * Delete a Glue job (draft only)
   */
  async deleteJob(jobId: string): Promise<void> {
    return apiService.delete(`/glue-jobs/${jobId}`);
  },

  /**
   * Get job logs from CloudWatch
   */
  async getJobLogs(
    connectorId: string,
    jobId: string,
    options?: {
      level?: string;
      search?: string;
      limit?: number;
    }
  ): Promise<{
    logs: Array<{
      timestamp: string;
      level: string;
      message: string;
    }>;
    total: number;
    has_more: boolean;
  }> {
    const params = new URLSearchParams();
    if (options?.level) params.append("level", options.level);
    if (options?.search) params.append("search", options.search);
    if (options?.limit) params.append("limit", options.limit.toString());

    return apiService.get(
      `/connectors/${connectorId}/glue-jobs/${jobId}/logs?${params}`
    );
  },

  /**
   * Get job run history
   */
  async getJobHistory(
    connectorId: string,
    jobId: string,
    page: number = 1,
    size: number = 10
  ): Promise<{
    job_id: string;
    job_name: string;
    runs: Array<{
      run_id: string;
      status: string;
      started_at: string | null;
      completed_at: string | null;
      execution_time_seconds: number;
      dpu_seconds: number;
      rows_processed: number | null;
      error_message: string | null;
      estimated_cost: number;
      duration_minutes: number | null;
    }>;
    total_runs: number;
  }> {
    return apiService.get(
      `/connectors/${connectorId}/glue-jobs/${jobId}/history`,
      { params: { page, size } }
    );
  },

  /**
   * Get detailed job metrics
   */
  async getJobMetrics(
    connectorId: string,
    jobId: string
  ): Promise<{
    dpu_allocated: number;
    dpu_seconds: number;
    execution_time_seconds: number;
    rows_processed: number | null;
    files_processed: number | null;
    estimated_cost: number;
    cost_per_row: number | null;
  }> {
    return apiService.get(
      `/connectors/${connectorId}/glue-jobs/${jobId}/metrics`
    );
  },

  /**
   * Cancel a running job
   */
  async cancelJob(
    connectorId: string,
    jobId: string
  ): Promise<{ success: boolean; message: string }> {
    return apiService.post(
      `/connectors/${connectorId}/glue-jobs/${jobId}/cancel`
    );
  },

  /**
   * Analyze job error
   */
  async analyzeError(
    connectorId: string,
    jobId: string
  ): Promise<{
    error_type: string | null;
    confidence: number;
    error_message: string | null;
    user_friendly_message: string;
    resolution_suggestions: string[];
    is_retryable: boolean;
    max_retries: number;
    analyzed_at: string;
  }> {
    return apiService.get(
      `/connectors/${connectorId}/glue-jobs/${jobId}/analyze-error`
    );
  },

  /**
   * Retry a failed job
   */
  async retryJob(
    connectorId: string,
    jobId: string
  ): Promise<{
    success: boolean;
    message: string;
    job_id: string;
    run_id: string;
    retry_count: number;
  }> {
    return apiService.post(
      `/connectors/${connectorId}/glue-jobs/${jobId}/retry`
    );
  },
};

