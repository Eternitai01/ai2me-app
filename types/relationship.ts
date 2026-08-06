/**
 * Relationship TypeScript Types
 */

export type RelationshipType = "one-to-one" | "one-to-many" | "many-to-many";

export interface Relationship {
  id: string;
  organization_id: string;
  relationship_name: string;
  parent_connector_id: string;
  child_connector_id: string;
  join_condition: Record<string, string>; // { parent_column: child_column }
  relationship_type: RelationshipType;
  junction_table?: string;
  junction_config?: Record<string, unknown>;
  cascade_delete: boolean;
  cascade_update: boolean;
  is_active: boolean;
  description?: string;
  validation_rules: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RelationshipCreate {
  relationship_name: string;
  parent_connector_id: string;
  child_connector_id: string;
  join_condition: Record<string, string>;
  relationship_type: RelationshipType;
  junction_table?: string;
  junction_config?: Record<string, unknown>;
  cascade_delete?: boolean;
  cascade_update?: boolean;
  description?: string;
  validation_rules?: Record<string, unknown>;
}

export interface RelationshipListResponse {
  relationships: Relationship[];
  total: number;
  connector_id: string;
}

