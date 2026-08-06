/**
 * Entity Template API Client
 */

import apiService from "./axios";
import { EntityTemplate, EntityTemplateListResponse } from "@/types/entity-template";
import { EntityTemplateField } from "@/types/entity-template";

interface CreateTemplateRequest {
  industry: string;
  template_name: string;
  description?: string;
  fields: EntityTemplateField[];
  is_active?: boolean;
}

export const entityTemplateApi = {
  /**
   * Get all entity templates, optionally filtered by industry
   */
  getTemplates: async (industry?: string): Promise<EntityTemplateListResponse> => {
    const params = industry ? { industry } : {};
    return apiService.get<EntityTemplateListResponse>("/entity-templates", { params });
  },

  /**
   * Get a specific template by ID
   */
  getTemplate: async (templateId: string): Promise<EntityTemplate> => {
    return apiService.get<EntityTemplate>(`/entity-templates/${templateId}`);
  },

  /**
   * Create a new entity template
   */
  createTemplate: async (template: CreateTemplateRequest): Promise<EntityTemplate> => {
    return apiService.post<EntityTemplate, CreateTemplateRequest>(
      "/entity-templates",
      template
    );
  },
};

