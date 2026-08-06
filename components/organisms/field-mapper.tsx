"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { mappingApi } from "@/lib/mapping-api";
import { entityTemplateApi } from "@/lib/entity-template-api";
import {
  FieldSuggestion,
  FieldMappingCreate,
} from "@/types/mapping";
import { EntityTemplate } from "@/types/entity-template";
import { ColumnSchema } from "@/types/schema";
import { toast } from "sonner";

interface FieldMapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectorId: string;
  templateId: string;
  sourceColumns: ColumnSchema[];
  onMappingsSaved: () => void;
}

export function FieldMapper({
  open,
  onOpenChange,
  connectorId,
  templateId,
  sourceColumns,
  onMappingsSaved,
}: FieldMapperProps) {
  const [template, setTemplate] = useState<EntityTemplate | null>(null);
  const [suggestions, setSuggestions] = useState<FieldSuggestion[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (open && templateId) {
      loadTemplate();
      loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, templateId]);

  const loadTemplate = async () => {
    try {
      const templateData = await entityTemplateApi.getTemplate(templateId);
      setTemplate(templateData);
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template");
    }
  };

  const loadSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      
      // Validate sourceColumns
      if (!sourceColumns || sourceColumns.length === 0) {
        console.warn("No source columns provided, skipping suggestions");
        setSuggestions([]);
        return;
      }
      
      const response = await mappingApi.getSuggestions(connectorId, {
        template_id: templateId,
        source_columns: sourceColumns.map((col) => ({
          column_name: col.column_name,
          data_type: col.data_type,
          suggested_target_type: col.suggested_target_type,
          is_pii: col.is_pii,
        })),
      });
      setSuggestions(response.suggestions);

      // Auto-apply high confidence suggestions (>0.7)
      const autoMappings: Record<string, string> = {};
      response.suggestions.forEach((suggestion) => {
        if (suggestion.confidence > 0.7) {
          autoMappings[suggestion.source_column] = suggestion.target_field;
        }
      });
      setMappings(autoMappings);
    } catch (error) {
      console.error("Error loading suggestions:", error);
      toast.error("Failed to load suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleApplySuggestions = () => {
    const newMappings: Record<string, string> = {};
    suggestions.forEach((suggestion) => {
      if (suggestion.confidence > 0.4) {
        newMappings[suggestion.source_column] = suggestion.target_field;
      }
    });
    setMappings(newMappings);
    toast.success("Suggestions applied");
  };

  const handleSaveMappings = async () => {
    if (!template) return;

    try {
      setSaving(true);
      const mappingCreates: FieldMappingCreate[] = Object.entries(mappings).map(
        ([sourceColumn, targetField]) => {
          const sourceCol = sourceColumns.find((c) => c.column_name === sourceColumn);
          const templateField = template.fields.find((f) => f.field_name === targetField);
          const suggestion = suggestions.find((s) => s.source_column === sourceColumn);

          return {
            source_field_name: sourceColumn,
            source_data_type: sourceCol?.data_type || sourceCol?.suggested_target_type || "VARCHAR",
            target_column: targetField,
            target_data_type: templateField?.data_type || "VARCHAR",
            is_pii: templateField?.is_pii || false,
            is_required: templateField?.is_required || false,
            is_unique: templateField?.is_unique || false,
            transformation_rule: suggestion?.suggested_transformation || {},
            validation_rules: templateField?.validation_rules || {},
            description: templateField?.description,
          };
        }
      );

      await mappingApi.createBulkMappings(connectorId, mappingCreates);
      toast.success(`Saved ${mappingCreates.length} field mappings`);
      onMappingsSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving mappings:", error);
      toast.error("Failed to save mappings");
    } finally {
      setSaving(false);
    }
  };

  const getSuggestionForColumn = (columnName: string): FieldSuggestion | undefined => {
    return suggestions.find((s) => s.source_column === columnName);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.7) return "text-green-600";
    if (confidence > 0.4) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence > 0.7) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (confidence > 0.4) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map Fields</DialogTitle>
          <DialogDescription>
            Map your source columns to template fields. Suggestions are provided based on similarity.
          </DialogDescription>
        </DialogHeader>

        {loading || !template ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Suggestions Summary */}
            {suggestions.length > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold">Auto-Suggestions Available</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplySuggestions}
                    disabled={loadingSuggestions}
                  >
                    Apply All Suggestions
                  </Button>
                </div>
                <div className="flex gap-4 text-sm">
                  <span>
                    High: <Badge className="bg-green-100 text-green-800">{suggestions.filter(s => s.confidence > 0.7).length}</Badge>
                  </span>
                  <span>
                    Medium: <Badge className="bg-yellow-100 text-yellow-800">{suggestions.filter(s => s.confidence > 0.4 && s.confidence <= 0.7).length}</Badge>
                  </span>
                  <span>
                    Low: <Badge className="bg-red-100 text-red-800">{suggestions.filter(s => s.confidence <= 0.4).length}</Badge>
                  </span>
                </div>
              </div>
            )}

            {/* Mapping Table */}
            <div className="border rounded-lg">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 border-b">
                <div className="font-semibold">Source Column</div>
                <div className="font-semibold">Target Field</div>
              </div>
              <div className="divide-y">
                {sourceColumns.map((column) => {
                  const suggestion = getSuggestionForColumn(column.column_name);
                  const currentMapping = mappings[column.column_name];

                  return (
                    <div key={column.column_name} className="grid grid-cols-2 gap-4 p-4">
                      <div className="space-y-1">
                        <div className="font-medium">{column.column_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {column.data_type || column.suggested_target_type}
                          {column.is_pii && <Badge variant="destructive" className="ml-2">PII</Badge>}
                        </div>
                        {suggestion && (
                          <div className="text-xs mt-1">
                            {getConfidenceBadge(suggestion.confidence)}
                            <span className={`ml-2 ${getConfidenceColor(suggestion.confidence)}`}>
                              {Math.round(suggestion.confidence * 100)}% match
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <Select
                          value={currentMapping || ""}
                          onValueChange={(value) => {
                            if (value === "__none__") {
                              // Remove mapping
                              const newMappings = { ...mappings };
                              delete newMappings[column.column_name];
                              setMappings(newMappings);
                            } else {
                              setMappings({ ...mappings, [column.column_name]: value });
                            }
                          }}
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-medium">
                            <SelectValue placeholder="Select target field" className="text-gray-900 dark:text-gray-100 font-medium" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] bg-white dark:bg-gray-900 border-2">
                            {template.fields.map((field) => {
                              const isSelected = currentMapping === field.field_name;
                              const isSuggested = suggestion?.target_field === field.field_name;
                              
                              return (
                                <SelectItem 
                                  key={field.field_name} 
                                  value={field.field_name}
                                  className={`cursor-pointer py-3 px-2 ${
                                    isSelected 
                                      ? 'bg-blue-100 dark:bg-blue-900 font-semibold' 
                                      : isSuggested 
                                      ? 'bg-green-50 dark:bg-green-950' 
                                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {field.display_name}
                                    </span>
                                    {field.data_type && (
                                      <span className="text-xs text-gray-600 dark:text-gray-400">
                                        ({field.data_type})
                                      </span>
                                    )}
                                    {field.is_required && (
                                      <Badge variant="outline" className="text-xs">Required</Badge>
                                    )}
                                    {field.is_pii && (
                                      <Badge variant="destructive" className="text-xs">PII</Badge>
                                    )}
                                    {isSuggested && (
                                      <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {suggestion && suggestion.target_field === currentMapping && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {suggestion.reasoning}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveMappings} disabled={saving || Object.keys(mappings).length === 0}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `Save ${Object.keys(mappings).length} Mappings`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

