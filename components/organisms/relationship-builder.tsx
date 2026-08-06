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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, ArrowRight } from "lucide-react";
import { relationshipApi } from "@/lib/relationship-api";
import { Relationship, RelationshipCreate, RelationshipType } from "@/types/relationship";
import { Connector } from "@/types/connector";
import { toast } from "sonner";

interface RelationshipBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectorId: string;
  availableConnectors: Connector[];
  existingRelationships: Relationship[];
  onRelationshipSaved: () => void;
}

export function RelationshipBuilder({
  open,
  onOpenChange,
  connectorId,
  availableConnectors,
  existingRelationships,
  onRelationshipSaved,
}: RelationshipBuilderProps) {
  const [relationships, setRelationships] = useState<Relationship[]>(existingRelationships);
  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRelationship, setNewRelationship] = useState<Partial<RelationshipCreate>>({
    relationship_name: "",
    parent_connector_id: connectorId,
    child_connector_id: "",
    join_condition: {},
    relationship_type: "one-to-many",
    cascade_delete: false,
    cascade_update: true,
  });

  useEffect(() => {
    if (open) {
      setRelationships(existingRelationships);
    }
  }, [open, existingRelationships]);

  const handleCreateRelationship = async () => {
    if (!newRelationship.relationship_name || !newRelationship.child_connector_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!newRelationship.join_condition || Object.keys(newRelationship.join_condition).length === 0) {
      toast.error("Please specify join condition");
      return;
    }

    try {
      setSaving(true);
      const created = await relationshipApi.createRelationship(
        connectorId,
        newRelationship as RelationshipCreate
      );
      setRelationships([...relationships, created]);
      setShowCreateForm(false);
      setNewRelationship({
        relationship_name: "",
        parent_connector_id: connectorId,
        child_connector_id: "",
        join_condition: {},
        relationship_type: "one-to-many",
        cascade_delete: false,
        cascade_update: true,
      });
      toast.success("Relationship created successfully");
      onRelationshipSaved();
    } catch (error) {
      console.error("Error creating relationship:", error);
      toast.error("Failed to create relationship");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRelationship = async (relationshipId: string) => {
    if (!confirm("Are you sure you want to delete this relationship?")) {
      return;
    }

    try {
      await relationshipApi.deleteRelationship(connectorId, relationshipId);
      setRelationships(relationships.filter((r) => r.id !== relationshipId));
      toast.success("Relationship deleted");
      onRelationshipSaved();
    } catch (error) {
      console.error("Error deleting relationship:", error);
      toast.error("Failed to delete relationship");
    }
  };

  const getConnectorName = (id: string) => {
    const connector = availableConnectors.find((c) => c.id === id);
    return connector?.name || id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Define Relationships</DialogTitle>
          <DialogDescription>
            Create relationships between connectors to enable multi-table queries
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Relationships */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Existing Relationships</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Relationship
              </Button>
            </div>

            {relationships.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <p>No relationships defined yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {relationships.map((rel) => (
                  <div
                    key={rel.id}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{rel.relationship_name}</span>
                        <Badge>{rel.relationship_type}</Badge>
                        {!rel.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{getConnectorName(rel.parent_connector_id)}</span>
                        <ArrowRight className="h-4 w-4" />
                        <span>{getConnectorName(rel.child_connector_id)}</span>
                      </div>
                      {rel.description && (
                        <p className="text-sm text-muted-foreground mt-1">{rel.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRelationship(rel.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Create New Relationship</h3>

              <div className="grid gap-4">
                <div>
                  <Label>Relationship Name</Label>
                  <Input
                    value={newRelationship.relationship_name || ""}
                    onChange={(e) =>
                      setNewRelationship({
                        ...newRelationship,
                        relationship_name: e.target.value,
                      })
                    }
                    placeholder="e.g., orders_to_customers"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Parent Connector</Label>
                    <Select
                      value={newRelationship.parent_connector_id || ""}
                      onValueChange={(value) =>
                        setNewRelationship({
                          ...newRelationship,
                          parent_connector_id: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableConnectors.map((connector) => (
                          <SelectItem key={connector.id} value={connector.id}>
                            {connector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Child Connector</Label>
                    <Select
                      value={newRelationship.child_connector_id || ""}
                      onValueChange={(value) =>
                        setNewRelationship({
                          ...newRelationship,
                          child_connector_id: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select child connector" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableConnectors
                          .filter((c) => c.id !== newRelationship.parent_connector_id)
                          .map((connector) => (
                            <SelectItem key={connector.id} value={connector.id}>
                              {connector.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Relationship Type</Label>
                  <Select
                    value={newRelationship.relationship_type || "one-to-many"}
                    onValueChange={(value) =>
                      setNewRelationship({
                        ...newRelationship,
                        relationship_type: value as RelationshipType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-to-one">One-to-One</SelectItem>
                      <SelectItem value="one-to-many">One-to-Many</SelectItem>
                      <SelectItem value="many-to-many">Many-to-Many</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Parent Column</Label>
                    <Input
                      value={Object.keys(newRelationship.join_condition || {})[0] || ""}
                      onChange={(e) =>
                        setNewRelationship({
                          ...newRelationship,
                          join_condition: {
                            [e.target.value]: Object.values(newRelationship.join_condition || {})[0] || "",
                          },
                        })
                      }
                      placeholder="parent_column_name"
                    />
                  </div>

                  <div>
                    <Label>Child Column</Label>
                    <Input
                      value={Object.values(newRelationship.join_condition || {})[0] || ""}
                      onChange={(e) =>
                        setNewRelationship({
                          ...newRelationship,
                          join_condition: {
                            [Object.keys(newRelationship.join_condition || {})[0] || ""]: e.target.value,
                          },
                        })
                      }
                      placeholder="child_column_name"
                    />
                  </div>
                </div>

                <div>
                  <Label>Description (Optional)</Label>
                  <Input
                    value={newRelationship.description || ""}
                    onChange={(e) =>
                      setNewRelationship({
                        ...newRelationship,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe this relationship"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewRelationship({
                      relationship_name: "",
                      parent_connector_id: connectorId,
                      child_connector_id: "",
                      join_condition: {},
                      relationship_type: "one-to-many",
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateRelationship} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Relationship"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

