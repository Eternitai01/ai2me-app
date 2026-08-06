"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { entityTemplateApi } from "@/lib/entity-template-api";
import { EntityTemplateField } from "@/types/entity-template";
import { toast } from "sonner";

interface TemplateCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  industry: string;
  onTemplateCreated: (templateId: string) => void;
}

interface FieldForm {
  field_name: string;
  display_name: string;
  data_type: string;
  is_required: boolean;
  is_pii: boolean;
  is_unique: boolean;
  description: string;
  common_aliases: string[];
  sample_value: string;
}

const DATA_TYPES = [
  "VARCHAR",
  "TEXT",
  "INTEGER",
  "BIGINT",
  "DECIMAL",
  "NUMERIC",
  "DATE",
  "TIMESTAMP",
  "BOOLEAN",
];

export function TemplateCreator({
  open,
  onOpenChange,
  industry,
  onTemplateCreated,
}: TemplateCreatorProps) {
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FieldForm[]>([
    {
      field_name: "",
      display_name: "",
      data_type: "VARCHAR",
      is_required: false,
      is_pii: false,
      is_unique: false,
      description: "",
      common_aliases: [],
      sample_value: "",
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [aliasInputs, setAliasInputs] = useState<Record<number, string>>({});

  const addField = () => {
    setFields([
      ...fields,
      {
        field_name: "",
        display_name: "",
        data_type: "VARCHAR",
        is_required: false,
        is_pii: false,
        is_unique: false,
        description: "",
        common_aliases: [],
        sample_value: "",
      },
    ]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<FieldForm>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const addAlias = (fieldIndex: number) => {
    const alias = aliasInputs[fieldIndex]?.trim();
    if (!alias) return;

    const newFields = [...fields];
    if (!newFields[fieldIndex].common_aliases.includes(alias)) {
      newFields[fieldIndex].common_aliases.push(alias);
      setFields(newFields);
    }
    setAliasInputs({ ...aliasInputs, [fieldIndex]: "" });
  };

  const removeAlias = (fieldIndex: number, aliasIndex: number) => {
    const newFields = [...fields];
    newFields[fieldIndex].common_aliases.splice(aliasIndex, 1);
    setFields(newFields);
  };

  const handleCreate = async () => {
    if (!templateName.trim()) {
      toast.error("Template name is required");
      return;
    }

    const validFields = fields.filter(
      (f) => f.field_name.trim() && f.display_name.trim()
    );

    if (validFields.length === 0) {
      toast.error("At least one field is required");
      return;
    }

    try {
      setSaving(true);
      const templateFields: EntityTemplateField[] = validFields.map((f) => ({
        field_name: f.field_name.trim().toLowerCase().replace(/\s+/g, "_"),
        display_name: f.display_name.trim(),
        data_type: f.data_type,
        is_required: f.is_required,
        is_pii: f.is_pii,
        is_unique: f.is_unique,
        description: f.description.trim() || undefined,
        common_aliases: f.common_aliases,
        sample_value: f.sample_value.trim() || undefined,
        validation_rules: {},
      }));

      const response = await entityTemplateApi.createTemplate({
        industry,
        template_name: templateName.trim(),
        description: description.trim() || undefined,
        fields: templateFields,
        is_active: true,
      });

      toast.success("Template created successfully!");
      onTemplateCreated(response.id);
      onOpenChange(false);
      
      // Reset form
      setTemplateName("");
      setDescription("");
      setFields([
        {
          field_name: "",
          display_name: "",
          data_type: "VARCHAR",
          is_required: false,
          is_pii: false,
          is_unique: false,
          description: "",
          common_aliases: [],
          sample_value: "",
        },
      ]);
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Entity Template</DialogTitle>
          <DialogDescription>
            Create a new template for {industry} industry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="space-y-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Product Catalog"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this template represents"
                rows={2}
              />
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Fields</Label>
              <Button type="button" variant="outline" size="sm" onClick={addField}>
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            {fields.map((field, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-4 bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Field {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Field Name (snake_case) *</Label>
                    <Input
                      value={field.field_name}
                      onChange={(e) =>
                        updateField(index, { field_name: e.target.value })
                      }
                      placeholder="e.g., product_id"
                    />
                  </div>
                  <div>
                    <Label>Display Name *</Label>
                    <Input
                      value={field.display_name}
                      onChange={(e) =>
                        updateField(index, { display_name: e.target.value })
                      }
                      placeholder="e.g., Product ID"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data Type *</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.data_type}
                      onChange={(e) =>
                        updateField(index, { data_type: e.target.value })
                      }
                    >
                      {DATA_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Sample Value</Label>
                    <Input
                      value={field.sample_value}
                      onChange={(e) =>
                        updateField(index, { sample_value: e.target.value })
                      }
                      placeholder="e.g., PROD-12345"
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={field.description}
                    onChange={(e) =>
                      updateField(index, { description: e.target.value })
                    }
                    placeholder="Field description"
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.is_required}
                      onChange={(e) =>
                        updateField(index, { is_required: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Required</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.is_pii}
                      onChange={(e) =>
                        updateField(index, { is_pii: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <span className="text-sm">PII</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.is_unique}
                      onChange={(e) =>
                        updateField(index, { is_unique: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Unique</span>
                  </label>
                </div>

                {/* Common Aliases */}
                <div>
                  <Label>Common Aliases</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={aliasInputs[index] || ""}
                      onChange={(e) =>
                        setAliasInputs({
                          ...aliasInputs,
                          [index]: e.target.value,
                        })
                      }
                      placeholder="Add alias (e.g., id, identifier)"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAlias(index);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addAlias(index)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {field.common_aliases.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.common_aliases.map((alias, aliasIndex) => (
                        <Badge
                          key={aliasIndex}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {alias}
                          <button
                            type="button"
                            onClick={() => removeAlias(index, aliasIndex)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Template"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

