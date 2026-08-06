"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AdminOnly } from "@/components/guards/PermissionGuard";
import { Loader2, ShieldAlert, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type WaitlistEntry = {
  id: string;
  email: string;
  status: string;
  is_approved: boolean;
  created_at: string;
  approved_at?: string | null;
};

type SortColumn = "email" | "signup_date";
type SortDirection = "asc" | "desc";

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>("email");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const pageSize = 20;

  const sortedEntries = useMemo(() => {
    const copy = [...entries];
    copy.sort((a, b) => {
      if (sortColumn === "email") {
        const cmp = (a.email ?? "").localeCompare(b.email ?? "", undefined, { sensitivity: "base" });
        return sortDirection === "asc" ? cmp : -cmp;
      }
      // signup_date
      const dateA = new Date(a.created_at ?? 0).getTime();
      const dateB = new Date(b.created_at ?? 0).getTime();
      const cmp = dateA - dateB;
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [entries, sortColumn, sortDirection]);

  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    );
  };

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedEntries.length / pageSize)),
    [sortedEntries.length]
  );

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedEntries.slice(start, end);
  }, [sortedEntries, currentPage, pageSize]);

  useEffect(() => {
    // Reset to first page when sort changes
    setCurrentPage(1);
  }, [sortColumn, sortDirection]);

  useEffect(() => {
    const fetchWaitlist = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/waitlist-user", { method: "GET" });
        const data = await res.json();

        if (!res.ok || data?.success === false) {
          throw new Error(
            data?.error || data?.detail || "Failed to load waitlist"
          );
        }

        const list: WaitlistEntry[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setEntries(list);
      } catch (err: unknown) {
        console.error("Failed to load waitlist entries", err);
        setError(
          err instanceof Error ? err.message : "Failed to load waitlist"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWaitlist();
  }, []);

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  return (
    <AdminOnly
      fallback={
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Access Restricted</h1>
            <p className="text-muted-foreground mt-2">
              This page is only accessible to Admin users.
            </p>
          </div>
          <div className="text-center py-12">
            <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Waitlist Dashboard</h2>
            <p className="text-muted-foreground">
              Only organization administrators can view and manage waitlist
              entries.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Waitlist</h1>
          <p className="text-muted-foreground mt-2">
            View all email addresses that have joined the AI2me waitlist.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Waitlist Entries</CardTitle>
            <CardDescription>
              Showing {entries.length}{" "}
              {entries.length === 1 ? "entry" : "entries"} from the waitlist
              table.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading waitlist entries...</span>
              </div>
            ) : error ? (
              <div className="py-6 text-center text-sm text-red-500">
                {error}
              </div>
            ) : entries.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No waitlist entries found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center font-medium hover:opacity-80"
                        onClick={() => toggleSort("email")}
                      >
                        Email
                        <SortIcon column="email" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center font-medium hover:opacity-80"
                        onClick={() => toggleSort("signup_date")}
                      >
                        Signup Date
                        <SortIcon column="signup_date" />
                      </button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.email}</TableCell>
                      <TableCell>{formatDate(entry.created_at)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.is_approved
                              ? "default"
                              : entry.status === "pending"
                              ? "outline"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {entries.length > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <button
                  type="button"
                  className="px-2 py-1 rounded border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  {"<<"}
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {"<"}
                </button>
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`h-8 w-8 rounded border text-center ${
                        page === currentPage
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input hover:bg-accent"
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="px-2 py-1 rounded border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {">"}
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  {">>"}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminOnly>
  );
}

