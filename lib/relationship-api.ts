/**
 * Relationship API Client
 */

import apiService from "./axios";
import {
  Relationship,
  RelationshipCreate,
  RelationshipListResponse,
} from "@/types/relationship";

export const relationshipApi = {
  /**
   * Get all relationships for a connector
   */
  getRelationships: async (connectorId: string): Promise<RelationshipListResponse> => {
    return apiService.get<RelationshipListResponse>(
      `/connectors/${connectorId}/relationships`
    );
  },

  /**
   * Create a relationship
   */
  createRelationship: async (
    connectorId: string,
    relationship: RelationshipCreate
  ): Promise<Relationship> => {
    return apiService.post<Relationship, RelationshipCreate>(
      `/connectors/${connectorId}/relationships`,
      relationship
    );
  },

  /**
   * Update a relationship
   */
  updateRelationship: async (
    connectorId: string,
    relationshipId: string,
    updates: Partial<RelationshipCreate>
  ): Promise<Relationship> => {
    return apiService.put<Relationship, Partial<RelationshipCreate>>(
      `/connectors/${connectorId}/relationships/${relationshipId}`,
      updates
    );
  },

  /**
   * Delete a relationship
   */
  deleteRelationship: async (
    connectorId: string,
    relationshipId: string
  ): Promise<void> => {
    return apiService.delete(`/connectors/${connectorId}/relationships/${relationshipId}`);
  },
};

