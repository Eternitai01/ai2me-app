"use client";

import { useState } from "react";
import {
  SchemaResponse,
  TableSchema,
  ColumnSchema,
  RelationshipSchema,
} from "@/types/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Database,
  Table as TableIcon,
  Key,
  Lock,
  AlertCircle,
  FileText,
  Link,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SchemaViewerProps {
  schema: SchemaResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onMapFields?: () => void;
  onDefineRelationships?: () => void;
  showActions?: boolean;
}

export function SchemaViewer({
  schema,
  isOpen,
  onClose,
  onMapFields,
  onDefineRelationships,
  showActions = false
}: SchemaViewerProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  if (!schema) return null;

  const isPostgres = schema.source_type === "postgresql";
  const postgresSchema = isPostgres ? (schema as import("@/types/schema").PostgresSchemaResponse) : null;
  const s3Schema = !isPostgres ? (schema as import("@/types/schema").S3SchemaResponse) : null;

  const tables: TableSchema[] = isPostgres
    ? postgresSchema?.tables || []
    : s3Schema?.columns
    ? [
        {
          table_name: s3Schema.table_name || "S3 Data",
          columns: s3Schema.columns,
          column_count: s3Schema.total_columns || 0,
          pii_columns: s3Schema.pii_columns || [],
        },
      ]
    : [];

  const selectedTableData = tables.find(
    (t) => t.table_name === selectedTable
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[75vw] sm:!max-w-[75vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Schema Discovery Results</span>
          </DialogTitle>
          <DialogDescription className="break-words">
            {schema.source_type === "s3"
              ? `S3 Source: ${schema.source_location}`
              : `PostgreSQL Database: ${postgresSchema?.database || "N/A"}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-100 dark:border-blue-900 flex flex-col justify-between min-h-[100px]">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 whitespace-nowrap">Total Tables</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {isPostgres ? postgresSchema?.total_tables : tables.length}
              </div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-100 dark:border-green-900 flex flex-col justify-between min-h-[100px]">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 whitespace-nowrap">Total Columns</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {isPostgres
                  ? postgresSchema?.total_columns
                  : schema.total_columns || 0}
              </div>
            </div>
            {isPostgres && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-100 dark:border-purple-900 flex flex-col justify-between min-h-[100px]">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 whitespace-nowrap">Relationships</div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {postgresSchema?.total_relationships || 0}
                </div>
              </div>
            )}
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-100 dark:border-orange-900 flex flex-col justify-between min-h-[100px]">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 whitespace-nowrap">Source Type</div>
              <div className="text-lg font-semibold uppercase text-orange-700 dark:text-orange-300">
                {schema.source_type === "postgresql" ? "PSQL" : schema.source_type.toUpperCase()}
              </div>
            </div>
          </div>

          {/* S3 Specific Info */}
          {schema.source_type === "s3" && schema.status === "requires_crawler" && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Crawler Required
                  </div>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200 break-words mt-1">
                    {schema.message}
                  </div>
                  {schema.recommendation && (
                    <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 break-words">
                      {schema.recommendation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tables and Columns */}
          {tables.length > 0 && (
            <Tabs defaultValue="tables" className="w-full">
              <TabsList>
                <TabsTrigger value="tables">
                  <TableIcon className="h-4 w-4 mr-2" />
                  Tables
                </TabsTrigger>
                {isPostgres && postgresSchema?.relationships && postgresSchema.relationships.length > 0 && (
                  <TabsTrigger value="relationships">
                    <Link className="h-4 w-4 mr-2" />
                    Relationships
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="tables" className="space-y-4">
                {/* Table List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tables.map((table: TableSchema) => (
                    <div
                      key={table.table_name}
                      onClick={() => setSelectedTable(table.table_name)}
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedTable === table.table_name
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                          : ""
                      }`}
                    >
                      <div className="font-semibold truncate" title={table.table_name}>
                        {table.table_name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {table.column_count} columns
                      </div>
                      {table.pii_columns && table.pii_columns.length > 0 && (
                        <Badge variant="destructive" className="mt-2">
                          <Lock className="h-3 w-3 mr-1" />
                          {table.pii_columns.length} PII
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Selected Table Details */}
                {selectedTableData && (
                  <div className="border rounded-lg p-4 overflow-hidden">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 flex-wrap">
                      <TableIcon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate max-w-md" title={selectedTableData.table_name}>
                        {selectedTableData.table_name}
                      </span>
                      <Badge variant="outline" className="flex-shrink-0">
                        {selectedTableData.column_count} columns
                      </Badge>
                    </h3>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[180px]">Column Name</TableHead>
                            <TableHead className="min-w-[120px]">Data Type</TableHead>
                            <TableHead className="min-w-[120px]">Target Type</TableHead>
                            <TableHead className="min-w-[150px]">Constraints</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTableData.columns.map((col: ColumnSchema) => (
                            <TableRow key={col.column_name}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="truncate" title={col.column_name}>
                                    {col.column_name}
                                  </span>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {col.is_pii && (
                                      <Lock className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                    )}
                                    {col.is_primary_key && (
                                      <Key className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded whitespace-nowrap">
                                  {col.data_type}
                                </code>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded whitespace-nowrap">
                                  {col.suggested_target_type || "N/A"}
                                </code>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                  {col.is_primary_key && (
                                    <Badge variant="default" className="text-xs">
                                      PK
                                    </Badge>
                                  )}
                                  {col.is_pii && (
                                    <Badge variant="destructive" className="text-xs">
                                      PII
                                    </Badge>
                                  )}
                                  {!col.is_nullable && (
                                    <Badge variant="outline" className="text-xs">
                                      NOT NULL
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>

              {isPostgres && postgresSchema?.relationships && postgresSchema.relationships.length > 0 && (
                <TabsContent value="relationships">
                  <div className="border rounded-lg p-4 overflow-hidden">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Link className="h-5 w-5 flex-shrink-0" />
                      Foreign Key Relationships
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[150px]">Source Table</TableHead>
                            <TableHead className="min-w-[150px]">Source Column</TableHead>
                            <TableHead className="min-w-[150px]">Target Table</TableHead>
                            <TableHead className="min-w-[150px]">Target Column</TableHead>
                            <TableHead className="min-w-[120px]">Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {postgresSchema?.relationships?.map(
                            (rel: RelationshipSchema, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  <span className="truncate block max-w-[200px]" title={rel.source_table}>
                                    {rel.source_table}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="truncate block max-w-[200px]" title={rel.source_column}>
                                    {rel.source_column}
                                  </span>
                                </TableCell>
                                <TableCell className="font-medium">
                                  <span className="truncate block max-w-[200px]" title={rel.target_table}>
                                    {rel.target_table}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="truncate block max-w-[200px]" title={rel.target_column}>
                                    {rel.target_column}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="whitespace-nowrap">
                                    {rel.relationship_type}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}

          {/* No Tables Found */}
          {tables.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tables discovered</p>
              {schema.source_type === "s3" && (
                <p className="text-sm mt-2">
                  A Glue crawler may need to be run first
                </p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-500 pt-4 border-t">
            Discovered at: {new Date(schema.discovered_at).toLocaleString()}
          </div>
        </div>

        {/* Action Buttons - Always show at least Close button */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t mt-4">
          <Button
            variant="outlineBlack"
            onClick={onClose}
            className="sm:flex-none"
          >
            Close
          </Button>
          {showActions && (onMapFields || onDefineRelationships) && (
            <div className="flex gap-2 flex-1 justify-end flex-col sm:flex-row">
              {onDefineRelationships && isPostgres && (
                <Button
                  variant="outlineBlack"
                  onClick={() => {
                    onClose();
                    onDefineRelationships();
                  }}
                  className="gap-2"
                >
                  <Link className="h-4 w-4" />
                  Define Relationships
                </Button>
              )}
              {onMapFields && (
                <Button
                  variant="default"
                  onClick={() => {
                    onClose();
                    onMapFields();
                  }}
                  className="gap-2"
                >
                  Map Fields
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
