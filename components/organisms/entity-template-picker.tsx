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
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Plus } from "lucide-react";
import { entityTemplateApi } from "@/lib/entity-template-api";
import { EntityTemplate } from "@/types/entity-template";
import { TemplateCreator } from "./template-creator";
import { toast } from "sonner";

interface EntityTemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  industry: string;
  onTemplateSelected: (templateId: string) => void;
}

export function EntityTemplatePicker({
  open,
  onOpenChange,
  industry,
  onTemplateSelected,
}: EntityTemplatePickerProps) {
  const [templates, setTemplates] = useState<EntityTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    if (open && industry) {
      loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, industry]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await entityTemplateApi.getTemplates(industry);
      setTemplates(response.templates);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      onTemplateSelected(selectedTemplate);
      onOpenChange(false);
      setSelectedTemplate(null);
    }
  };

  const handleTemplateCreated = (templateId: string) => {
    // Reload templates
    loadTemplates();
    // Auto-select the newly created template
    setSelectedTemplate(templateId);
    setShowCreator(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Entity Template</DialogTitle>
          <DialogDescription>
            Choose a template for {industry} industry to map your connector fields
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              No templates available for {industry} industry
            </p>
            <Button onClick={() => setShowCreator(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{template.template_name}</h3>
                        {selectedTemplate === template.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {template.fields.length} fields
                        </Badge>
                        {template.fields.filter((f) => f.is_required).length > 0 && (
                          <Badge variant="outline">
                            {template.fields.filter((f) => f.is_required).length} required
                          </Badge>
                        )}
                        {template.fields.filter((f) => f.is_pii).length > 0 && (
                          <Badge variant="destructive">
                            {template.fields.filter((f) => f.is_pii).length} PII
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCreator(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New Template
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedTemplate}
                >
                  Select Template
                </Button>
              </div>
            </div>
          </div>
        )}

        <TemplateCreator
          open={showCreator}
          onOpenChange={setShowCreator}
          industry={industry}
          onTemplateCreated={handleTemplateCreated}
        />
      </DialogContent>
    </Dialog>
  );
}

