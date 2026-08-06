/**
 * Field Mapping API Client
 */

import apiService from "./axios";
import {
  FieldMapping,
  FieldMappingCreate,
  FieldMappingListResponse,
  FieldSuggestionRequest,
  FieldSuggestionResponse,
} from "@/types/mapping";

export const mappingApi = {
  /**
   * Get field suggestions for a connector
   */
  getSuggestions: async (
    connectorId: string,
    request: FieldSuggestionRequest
  ): Promise<FieldSuggestionResponse> => {
    return apiService.post<FieldSuggestionResponse, FieldSuggestionRequest>(
      `/connectors/${connectorId}/suggestions`,
      request
    );
  },

  /**
   * Get all field mappings for a connector
   */
  getMappings: async (connectorId: string): Promise<FieldMappingListResponse> => {
    return apiService.get<FieldMappingListResponse>(
      `/connectors/${connectorId}/mappings`
    );
  },

  /**
   * Create a field mapping
   */
  createMapping: async (
    connectorId: string,
    mapping: FieldMappingCreate
  ): Promise<FieldMapping> => {
    return apiService.post<FieldMapping, FieldMappingCreate>(
      `/connectors/${connectorId}/mappings`,
      mapping
    );
  },

  /**
   * Create multiple field mappings (bulk)
   */
  createBulkMappings: async (
    connectorId: string,
    mappings: FieldMappingCreate[]
  ): Promise<FieldMapping[]> => {
    return apiService.post<FieldMapping[], { mappings: FieldMappingCreate[] }>(
      `/connectors/${connectorId}/mappings/bulk`,
      { mappings }
    );
  },

  /**
   * Update a field mapping
   */
  updateMapping: async (
    connectorId: string,
    mappingId: string,
    updates: Partial<FieldMappingCreate>
  ): Promise<FieldMapping> => {
    return apiService.put<FieldMapping, Partial<FieldMappingCreate>>(
      `/connectors/${connectorId}/mappings/${mappingId}`,
      updates
    );
  },

  /**
   * Delete a field mapping
   */
  deleteMapping: async (connectorId: string, mappingId: string): Promise<void> => {
    return apiService.delete(`/connectors/${connectorId}/mappings/${mappingId}`);
  },
};

