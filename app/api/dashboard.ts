import apiService from "@/lib/axios";

const base = "/dashboard";

export type DashboardResponse = {
  provider: number;
  uptimeSLA: number;
  complianceStandard: number;
};
export const dashboardService = {
  list: async() => {
    return apiService.get<DashboardResponse>(`${base}/`);
  },
};

export default dashboardService;
