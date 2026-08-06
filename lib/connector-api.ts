import apiService from "./axios";
import {
  Connector,
  ConnectorCreate,
  ConnectorUpdate,
  ConnectorListResponse,
  ConnectorDeleteResponse,
} from "@/types/connector";

export const connectorApi = {
  // Get all connectors with pagination
  async getConnectors(
    page: number = 1,
    size: number = 10
  ): Promise<ConnectorListResponse> {
    return apiService.get<ConnectorListResponse>("/connectors", {
      params: { page, size },
    });
  },

  // Get a specific connector by ID
  async getConnector(id: string): Promise<Connector> {
    return apiService.get<Connector>(`/connectors/${id}`);
  },

  // Create a new connector
  async createConnector(data: ConnectorCreate): Promise<Connector> {
    return apiService.post<Connector, ConnectorCreate>("/connectors", data);
  },

  // Update a connector (only name can be updated)
  async updateConnector(id: string, data: ConnectorUpdate): Promise<Connector> {
    return apiService.put<Connector, ConnectorUpdate>(
      `/connectors/${id}`,
      data
    );
  },

  // Delete a connector
  async deleteConnector(id: string): Promise<ConnectorDeleteResponse> {
    return apiService.delete<ConnectorDeleteResponse>(`/connectors/${id}`);
  },

  // Activate a connector
  async activateConnector(id: string): Promise<Connector> {
    return apiService.patch<Connector>(`/connectors/${id}/activate`, undefined);
  },
};
