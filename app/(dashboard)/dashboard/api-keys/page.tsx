"use client";

import { useEffect, useState } from "react";
import { DeveloperOnly } from "@/components/guards/PermissionGuard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Key,
  Plus,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Copy,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import apiKeysService, { ApiKey } from "@/app/api/apiKeys";
import { toast } from "sonner";

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState("read,write");
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const data = await apiKeysService.list();
      setApiKeys(data.api_keys || []);
    } catch (err) {
      console.error("Failed to fetch API keys", err);
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async () => {
    setIsCreating(true);
    try {
      const response = await apiKeysService.create({
        key_name: newKeyName,
        permissions: newKeyPermissions,
      });

      // Store the newly created key
      setNewlyCreatedKey(response.new_key);

      // Reset form
      setNewKeyName("");
      setNewKeyDescription("");
      setNewKeyPermissions("read,write");

      // Close create dialog and show key dialog
      setDialogOpen(false);
      setShowKeyDialog(true);

      // Refresh the keys list
      await fetchKeys();

      toast.success("Your new key has been generated successfully.");
    } catch (err) {
      console.error("Failed to create API key", err);
      toast.error("Couldn't create the API key. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRotate = async (id: string) => {
    try {
      const response = await apiKeysService.rotate(id);

      // Store the newly rotated key
      setNewlyCreatedKey(response.new_key);

      // Show key dialog
      setShowKeyDialog(true);

      // Refresh the keys list
      await fetchKeys();

      toast.success("Key rotated successfully");
    } catch (err) {
      console.error("Failed to rotate key", err);
      toast.error("Couldn't rotate the key. Please try again.");
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await apiKeysService.revoke(id);
      await fetchKeys();
      toast.success("Key revoked succesfully");
    } catch (err) {
      console.error("Failed to revoke key", err);
      toast.error("Couldn’t revoke the key. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiKeysService.delete(id);
      await fetchKeys();
      toast.success("The key has been removed permanently.");
    } catch (err) {
      console.error("Failed to delete key", err);
      toast.error("Couldn’t delete the key. Please try again.");
    }
  };

  const getStatusColor = (active: boolean) =>
    active ? "default" : "secondary";

  const Loader = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-2 w-full max-w-md">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const EmptyState = () => (
    <Card>
      <CardHeader>
        <CardTitle>No keys found</CardTitle>
        <CardDescription>
          You haven’t created any API keys yet. Create one to get started.
        </CardDescription>
      </CardHeader>
    </Card>
  );

  return (
    <DeveloperOnly
      fallback={
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Access Restricted</h1>
            <p className="text-muted-foreground mt-2">
              This page is only accessible to Developers.
            </p>
          </div>
          <div className="text-center py-12">
            <Key className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">API Key Management</h2>
            <p className="text-muted-foreground">
              Only users with Developer role can create and manage API keys.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Key Management</h1>
            <p className="text-muted-foreground mt-2">
              Create, manage, and monitor your API keys and permissions.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  Generate a new API key for your application or service.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., Production API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyDescription">Description</Label>
                  <Textarea
                    id="keyDescription"
                    placeholder="Describe what this key will be used for..."
                    value={newKeyDescription}
                    onChange={(e) => setNewKeyDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permissions">Permissions</Label>
                  <Select
                    value={newKeyPermissions}
                    onValueChange={setNewKeyPermissions}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select permissions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">Read Only</SelectItem>
                      <SelectItem value="write">Write Only</SelectItem>
                      <SelectItem value="read,write">Read & Write</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateKey} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create API Key"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New Key Display Dialog */}
          <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>API Key Created Successfully</DialogTitle>
                <DialogDescription>
                  Your new API key has been generated. Copy it now as it
                  won&apos;t be shown again.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newKey">Your API Key</Label>
                  <div className="relative">
                    <Input
                      id="newKey"
                      value={newlyCreatedKey || ""}
                      readOnly
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => {
                        if (newlyCreatedKey) {
                          navigator.clipboard.writeText(newlyCreatedKey);
                          toast.success("API key copied to clipboard!");
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This is the only time you&apos;ll see this key. Make sure to
                    copy and store it securely.
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setShowKeyDialog(false);
                    setNewlyCreatedKey(null);
                  }}
                >
                  I&apos;ve Copied the Key
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Security Notice */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Keep your API keys secure. Never share them in public repositories
            or client-side code. Rotate keys regularly for enhanced security.
          </AlertDescription>
        </Alert>

        {/* API Keys List */}
        {loading ? (
          <Loader />
        ) : apiKeys.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        {apiKey.key_name}
                      </CardTitle>
                      <CardDescription>ID: {apiKey.id}</CardDescription>
                    </div>
                    <Badge variant={getStatusColor(apiKey.is_active)}>
                      {apiKey.is_active ? "active" : "inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Permissions</div>
                      <div className="text-muted-foreground">
                        {apiKey.permissions}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Created</div>
                      <div className="text-muted-foreground">
                        {apiKey.created_at ? apiKey.created_at.slice(0, 10) : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Last Used</div>
                      <div className="text-muted-foreground">
                        {apiKey.last_used || "Never"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outlineGray"
                      size="sm"
                      onClick={() => handleRotate(apiKey.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Rotate
                    </Button>
                    <Button
                      variant="outlineGray"
                      size="sm"
                      className="text-destructive hover:text-destructive bg-transparent"
                      onClick={() => handleRevoke(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Revoke
                    </Button>
                    <Button
                      variant="outlineGray"
                      size="sm"
                      className="text-destructive hover:text-destructive bg-transparent"
                      onClick={() => handleDelete(apiKey.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DeveloperOnly>
  );
}
