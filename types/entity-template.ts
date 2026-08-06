/**
 * Entity Template TypeScript Types
 */

export interface EntityTemplateField {
  field_name: string;
  display_name: string;
  data_type: string;
  is_required: boolean;
  is_pii: boolean;
  is_unique: boolean;
  description?: string;
  common_aliases: string[];
  sample_value?: string;
  validation_rules: Record<string, unknown>;
}

export interface EntityTemplate {
  id: string;
  industry: string;
  template_name: string;
  description?: string;
  fields: EntityTemplateField[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EntityTemplateListResponse {
  templates: EntityTemplate[];
  total: number;
  industry?: string;
}

