/**
 * Analytics and reporting related TypeScript interfaces
 * for the AI2me blockchain compliance analytics system
 */

export interface TimeRange {
  start: string;
  end: string;
  period: '24h' | '7d' | '30d' | '90d' | '1y';
}

// Compliance Analytics Interfaces
export interface ComplianceAnalytics {
  timeRange: TimeRange;
  overallScore: number;
  scoreHistory: ComplianceScorePoint[];
  storageDistribution: StorageDistribution;
  verificationMetrics: VerificationMetrics;
  performanceMetrics: PerformanceMetrics;
  costAnalytics: CostAnalytics;
  lastUpdated: string;
}

export interface ComplianceScorePoint {
  timestamp: string;
  score: number;
  components: {
    s3: number;
    azureACL: number;
    polygon: number;
  };
}

export interface StorageDistribution {
  total: number;
  breakdown: {
    s3Only: {
      count: number;
      percentage: number;
      avgSize: number;
    };
    s3AndACL: {
      count: number;
      percentage: number;
      avgSize: number;
    };
    fullCompliance: {
      count: number;
      percentage: number;
      avgSize: number;
    };
  };
  trends: StorageTrendPoint[];
}

export interface StorageTrendPoint {
  timestamp: string;
  s3: number;
  azureACL: number;
  polygon: number;
  totalSize: number;
}

export interface VerificationMetrics {
  totalTransactions: number;
  verifiedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  successRate: number;
  averageVerificationTime: number;
  verificationTrends: VerificationTrendPoint[];
}

export interface VerificationTrendPoint {
  timestamp: string;
  verified: number;
  pending: number;
  failed: number;
  avgTime: number;
}

export interface PerformanceMetrics {
  throughput: {
    current: number; // transactions per minute
    average: number;
    peak: number;
    trends: ThroughputPoint[];
  };
  responseTime: {
    s3Upload: number;
    aclLogging: number;
    blockchainSubmission: number;
    trends: ResponseTimePoint[];
  };
  systemHealth: {
    uptime: number;
    errorRate: number;
    queueLength: number;
    resourceUsage: ResourceUsage;
  };
}

export interface ThroughputPoint {
  timestamp: string;
  transactionsPerMinute: number;
}

export interface ResponseTimePoint {
  timestamp: string;
  s3: number;
  acl: number;
  blockchain: number;
  total: number;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
}

export interface CostAnalytics {
  totalCost: number;
  breakdown: {
    storage: {
      s3: number;
      azureACL: number;
      polygon: number;
    };
    compute: {
      processing: number;
      verification: number;
    };
    network: {
      dataTransfer: number;
      apiCalls: number;
    };
  };
  trends: CostTrendPoint[];
  projections: CostProjection[];
}

export interface CostTrendPoint {
  timestamp: string;
  storage: number;
  compute: number;
  network: number;
  total: number;
}

export interface CostProjection {
  period: string;
  estimatedCost: number;
  confidence: number;
}

// Blockchain Metrics Interfaces
export interface BlockchainMetrics {
  batchProcessing: BatchMetrics;
  transactionQueue: QueueMetrics;
  networkStatus: NetworkStatus;
  gasAnalytics: GasAnalytics;
  contractMetrics: ContractMetrics;
}

export interface BatchMetrics {
  averageBatchSize: number;
  processingTime: number;
  successRate: number;
  pendingBatches: number;
  batchHistory: BatchHistoryPoint[];
}

export interface BatchHistoryPoint {
  timestamp: string;
  batchId: string;
  size: number;
  processingTime: number;
  status: 'completed' | 'processing' | 'failed';
}

export interface QueueMetrics {
  currentLength: number;
  averageWaitTime: number;
  processingRate: number;
  queueHistory: QueueHistoryPoint[];
}

export interface QueueHistoryPoint {
  timestamp: string;
  queueLength: number;
  waitTime: number;
}

export interface NetworkStatus {
  network: 'polygon-amoy' | 'polygon-mainnet' | 'ethereum-sepolia' | 'ethereum-mainnet';
  blockHeight: number;
  gasPrice: number;
  networkHealth: 'healthy' | 'congested' | 'degraded';
  confirmationTime: number;
}

export interface GasAnalytics {
  averageGasUsed: number;
  averageGasPrice: number;
  totalGasCost: number;
  gasOptimization: number; // percentage saved through optimization
  gasTrends: GasTrendPoint[];
}

export interface GasTrendPoint {
  timestamp: string;
  gasUsed: number;
  gasPrice: number;
  totalCost: number;
}

export interface ContractMetrics {
  contractAddress: string;
  totalTransactions: number;
  successfulCalls: number;
  failedCalls: number;
  averageExecutionTime: number;
  contractEvents: ContractEvent[];
}

export interface ContractEvent {
  timestamp: string;
  eventType: string;
  transactionHash: string;
  gasUsed: number;
}

// Regulatory Compliance Interfaces
export interface RegulatoryCompliance {
  frameworks: ComplianceFramework[];
  overallStatus: 'compliant' | 'partial' | 'non-compliant';
  riskScore: number;
  recommendations: ComplianceRecommendation[];
  auditReadiness: AuditReadiness;
}

export interface ComplianceFramework {
  name: 'GDPR' | 'SOX' | 'HIPAA' | 'PCI-DSS' | 'ISO-27001' | 'Custom';
  status: 'compliant' | 'partial' | 'non-compliant';
  score: number;
  requirements: ComplianceRequirement[];
  lastAssessment: string;
  nextReview: string;
  certificationStatus: CertificationStatus;
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  status: 'met' | 'partial' | 'not-met';
  evidence: Evidence[];
  lastVerified: string;
  responsible: string;
}

export interface Evidence {
  type: 'document' | 'log' | 'certificate' | 'audit-trail';
  description: string;
  location: string;
  timestamp: string;
  verified: boolean;
}

export interface CertificationStatus {
  certified: boolean;
  certificationBody?: string;
  certificateNumber?: string;
  validFrom?: string;
  validUntil?: string;
  renewalRequired?: boolean;
}

export interface ComplianceRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'security' | 'privacy' | 'audit' | 'documentation';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  assignee?: string;
}

export interface AuditReadiness {
  score: number;
  status: 'ready' | 'needs-work' | 'not-ready';
  checklist: AuditChecklistItem[];
  missingDocuments: string[];
  estimatedPreparationTime: string;
}

export interface AuditChecklistItem {
  category: string;
  item: string;
  status: 'complete' | 'in-progress' | 'pending';
  lastUpdated: string;
  responsible: string;
}

// Report Generation Interfaces
export interface ComplianceReport {
  id: string;
  title: string;
  type: 'executive-summary' | 'detailed-audit' | 'regulatory-filing' | 'custom';
  format: 'pdf' | 'csv' | 'json' | 'xlsx';
  timeRange: TimeRange;
  frameworks: string[];
  sections: ReportSection[];
  generatedAt: string;
  generatedBy: string;
  status: 'generating' | 'ready' | 'failed';
  downloadUrl?: string;
  expiresAt?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'chart' | 'table' | 'text' | 'compliance-matrix';
  content: unknown; // Flexible content based on section type
  order: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'executive-summary' | 'detailed-audit' | 'regulatory-filing' | 'custom';
  sections: ReportTemplateSection[];
  defaultTimeRange: string;
  applicableFrameworks: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplateSection {
  id: string;
  title: string;
  type: 'summary' | 'chart' | 'table' | 'text' | 'compliance-matrix';
  required: boolean;
  configurable: boolean;
  defaultConfig: unknown;
  order: number;
}

// Chart Data Interfaces
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  category?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area' | 'pie';
}

export interface ChartConfig {
  title: string;
  subtitle?: string;
  type: 'line' | 'bar' | 'area' | 'pie' | 'scatter' | 'heatmap';
  xAxis: {
    title: string;
    type: 'datetime' | 'category' | 'numeric';
  };
  yAxis: {
    title: string;
    format?: 'number' | 'percentage' | 'currency' | 'time';
  };
  series: ChartSeries[];
  timeRange?: TimeRange;
  refreshInterval?: number; // seconds
}

// API Request/Response Interfaces
export interface AnalyticsRequest {
  timeRange: TimeRange;
  metrics: string[];
  filters?: {
    providers?: string[];
    models?: string[];
    status?: string[];
    frameworks?: string[];
  };
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

export interface AnalyticsResponse<T> {
  data: T;
  metadata: {
    timeRange: TimeRange;
    totalRecords: number;
    processingTime: number;
    lastUpdated: string;
    nextUpdate: string;
  };
  status: 'success' | 'partial' | 'error';
  errors?: string[];
}
