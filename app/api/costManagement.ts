
import { getPublicApiBaseUrl } from "@/lib/api-base";

export interface CostMetrics {
  this_month: number;
  daily_average: number;
  daily_average_change: number;
  cost_per_1k_calls: number;
  cost_per_1k_change: number;
  savings_this_month: number;
  budget_usage_percentage: number;
}

export interface WeeklyBreakdown {
  week: string;
  total: number;
  by_provider: Record<string, number>;
}

export interface SpendingOverTime {
  weekly_breakdown: WeeklyBreakdown[];
  total_monthly: number;
}

export interface ProviderCost {
  provider: string;
  cost: number;
}

export interface CostByProvider {
  providers: ProviderCost[];
  total: number;
}

export interface OptimizationBreakdown {
  percentage: number;
  savings: number;
  description: string;
}

export interface CostOptimization {
  breakdown: Record<string, OptimizationBreakdown>;
  total_savings: number;
}

export interface BudgetManagement {
  monthly_budget: number;
  current_usage: number;
  usage_percentage: number;
  alert_threshold: number;
  days_remaining: number;
}

export interface MonthlyProjection {
  month: string;
  projected: number;
  actual?: number;
}

export interface CostForecast {
  monthly_projections: MonthlyProjection[];
  growth_rate: number;
}

export interface CostManagementData {
  metrics: CostMetrics;
  spending_over_time: SpendingOverTime;
  cost_by_provider: CostByProvider;
  cost_optimization: CostOptimization;
  budget_management: BudgetManagement;
  cost_forecast: CostForecast;
  last_updated: string;
}

class CostManagementService {
  private baseUrl = getPublicApiBaseUrl();

  private getHeaders() {
    // Get the auth token from cookies for user authentication
    const authToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth-token="))
      ?.split("=")[1];

    if (!authToken) {
      throw new Error("User not authenticated. Please log in first.");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };
  }

  async getCostManagementOverview(
    timeRange: string = "30d"
  ): Promise<CostManagementData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/cost/overview?timeRange=${timeRange}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Failed to fetch cost management data"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching cost management data:", error);
      throw error;
    }
  }
}

const costManagementService = new CostManagementService();
export default costManagementService;
