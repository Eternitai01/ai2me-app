/**
 * Schema Discovery API Client
 */

import apiService from "./axios";
import {
  SchemaResponse,
  DiscoveryStatusResponse,
  SchemaDiscoveryRequest,
  ConnectionTestResponse,
} from "@/types/schema";

export const schemaDiscoveryApi = {
  /**
   * Discover schema for a connector
   */
  discoverSchema: async (
    request: SchemaDiscoveryRequest
  ): Promise<SchemaResponse> => {
    // Use apiService which automatically handles auth-token cookie
    return apiService.post<SchemaResponse, SchemaDiscoveryRequest>(
      "/schema-discovery/discover",
      request
    );
  },

  /**
   * Get discovery status for a connector
   */
  getDiscoveryStatus: async (
    connectorId: string
  ): Promise<DiscoveryStatusResponse> => {
    // Use apiService which automatically handles auth-token cookie
    return apiService.get<DiscoveryStatusResponse>(
      `/schema-discovery/${connectorId}/status`
    );
  },

  /**
   * Test database connection
   */
  testConnection: async (
    connectorId: string
  ): Promise<ConnectionTestResponse> => {
    // Use apiService which automatically handles auth-token cookie
    return apiService.post<ConnectionTestResponse>(
      "/schema-discovery/test-connection",
      null,
      { params: { connector_id: connectorId } }
    );
  },
};
