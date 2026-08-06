import { healthApiService } from "@/lib/axios";

const base = "/health/detailed";

export type ComponentStatus = {
  status: string;
  details: string;
};

export type StatusResponse = {
  service: string;
  version: string;
  timestamp: string;
  components: {
    database: ComponentStatus;
    aws_cognito: ComponentStatus;
    environment: ComponentStatus;
  };
  overall_status: string;
};

export const statusService = {
    list: async (): Promise<StatusResponse> => {
      const response = await healthApiService.get<StatusResponse>(`${base}/`, {
      });
      return response;
    },
  };

export default statusService;