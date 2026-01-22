"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import type { Service, ServiceStatus } from "@/types/service";
import type { ServiceCategory } from "@/types/taxonomy";
import {
  deleteAdminService,
  fetchAdminServices,
} from "@/lib/api/services.admin";
import { fetchAdminServiceCategories } from "@/lib/api/serviceCategories.admin";
import type { AdminApiError } from "@/lib/api/adminFetch";
import { includesSearch } from "@/lib/search";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ServiceEditor from "@/components/admin/services/ServiceEditor";

const STATUS_OPTIONS: Array<{ value: ServiceStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
];

const VIEW_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "trash", label: "Trash" },
];

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") return "Request failed";
  const err = error as AdminApiError;
  if (err.payload && typeof err.payload === "string") return err.payload;
  if (err.payload && typeof err.payload === "object") {
    const payload = err.payload as Record<string, unknown>;
    if (typeof payload.message === "string") return payload.message;
    if (typeof payload.error === "string") return payload.error;
  }
  return err.message || "Request failed";
}

export default function AdminServicesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<ServiceStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("active");
  const isTrashView = view === "trash";

  const [data, setData] = useState<{ items: Service[]; total: number } | null>(
    null
  );
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  useEffect(() => {
    let active = true;
    fetchAdminServiceCategories({ page: 1, limit: 200, sort: "sortOrder" })
      .then((res) => {
        if (!active) return;
        setCategories(res.items || []);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, ServiceCategory>();
    categories.forEach((item) => map.set(item._id, item));
    return map;
  }, [categories]);

  const fetchKey = useMemo(
    () => `${page}-${limit}-${status}-${view}-${refreshNonce}`,
    [page, limit, status, view, refreshNonce]
  );

  useEffect(() => {
    let active = true;
    fetchAdminServices({
      page,
      limit,
      status: status === "all" ? undefined : status,
      sort: "-updatedAt",
      deleted: isTrashView,
    })
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(getErrorMessage(error));
      })
      .finally(() => {
        if (!active) return;
        setLoadedKey(fetchKey);
      });
    return () => {
      active = false;
    };
  }, [fetchKey, isTrashView, limit, page, status]);

  const loading = loadedKey !== fetchKey;
  const visibleItems = useMemo(() => {
    const items = data?.items ?? [];
    return isTrashView
      ? items.filter((item) => item.deletedAt)
      : items.filter((item) => !item.deletedAt);
  }, [data, isTrashView]);
  const filteredItems = useMemo(() => {
    const term = searchTerm.trim();
    if (!term) return visibleItems;
    return visibleItems.filter((row) => {
      const category = row.categoryId ? categoryMap.get(row.categoryId) : null;
      const searchText = [
        row.title_i18n?.vi,
        row.title_i18n?.en,
        row.excerpt_i18n?.vi,
        row.excerpt_i18n?.en,
        typeof row.slug_i18n === "string" ? row.slug_i18n : row.slug_i18n?.vi,
        typeof row.slug_i18n === "string" ? row.slug_i18n : row.slug_i18n?.en,
        row.slug,
        (row.tags || []).join(" "),
        category?.name_i18n?.vi,
        category?.name_i18n?.en,
      ]
        .filter(Boolean)
        .join(" ");
      return includesSearch(searchText, term);
    });
  }, [categoryMap, searchTerm, visibleItems]);
  const total = searchTerm.trim()
    ? filteredItems.length
    : isTrashView
    ? visibleItems.length
    : data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextLimit = Math.max(1, Number(event.target.value || 1));
    setLimit(nextLimit);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
            Catalog
          </p>
          <h1 className="text-2xl font-semibold">Services</h1>
          <p className="text-sm text-muted-foreground">
            Manage service detail pages and publish to the guest site.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Create service</Button>
      </div>

      <Separator />

      <Card className="border-slate-200 bg-white">
        <div className="grid gap-3 p-4 md:grid-cols-[minmax(240px,1fr)_180px_150px]">
          <div className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Search
            </span>
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search title..."
            />
          </div>
          <div className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Status
            </span>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as ServiceStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              View
            </span>
            <Select
              value={view}
              onValueChange={(value) => {
                setView(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                {VIEW_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>Loading...</TableCell>
              </TableRow>
            ) : filteredItems.length ? (
              filteredItems.map((row) => {
                const category = row.categoryId
                  ? categoryMap.get(row.categoryId)
                  : null;
                return (
                  <TableRow key={row._id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-neutral-900">
                          {row.title_i18n?.vi ||
                            row.title_i18n?.en ||
                            "(untitled)"}
                        </p>
                        {row.title_i18n?.en ? (
                          <p className="text-xs text-muted-foreground">
                            {row.title_i18n.en}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {category?.name_i18n?.vi ||
                        category?.name_i18n?.en ||
                        "-"}
                    </TableCell>
                    <TableCell className="text-xs">{row.status}</TableCell>
                    <TableCell className="text-xs">
                      {formatDate(row.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isTrashView ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(row._id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="ml-2"
                            onClick={() => setPendingDelete(row)}
                          >
                            Delete
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Deleted
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5}>No services found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          Total: {total} | Page {page}/{totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={!hasPrev}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={!hasNext}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </Button>
          <Input
            type="number"
            value={limit}
            onChange={handleLimitChange}
            className="w-20"
          />
        </div>
      </div>

      <Dialog.Root
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-5 shadow-2xl">
            <Dialog.Title className="text-base font-semibold">
              Delete service
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {pendingDelete?.title_i18n?.vi || "this service"}
              </span>
              ?
            </Dialog.Description>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.Close>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!pendingDelete) return;
                  try {
                    await deleteAdminService(pendingDelete._id);
                    toast.success("Service deleted");
                    setPendingDelete(null);
                    setRefreshNonce((value) => value + 1);
                  } catch (error) {
                    toast.error(getErrorMessage(error));
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 flex h-[92vh] w-[96vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  Create service
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  Define a new service with pricing and portfolio links.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="outline" className="rounded-full">
                  Close
                </Button>
              </Dialog.Close>
            </div>
            <div
              className="flex-1 min-h-0 overflow-y-auto bg-slate-50 px-6 py-5"
              data-lenis-prevent
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <ServiceEditor
                  mode="create"
                  embedded
                  onCreated={() => {
                    setIsCreateOpen(false);
                    setRefreshNonce((value) => value + 1);
                  }}
                  onCancel={() => setIsCreateOpen(false)}
                />
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={!!editingId}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 flex h-[92vh] w-[96vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  Edit service
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  Update service details and publishing status.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="outline" className="rounded-full">
                  Close
                </Button>
              </Dialog.Close>
            </div>
            <div
              className="flex-1 min-h-0 overflow-y-auto bg-slate-50 px-6 py-5"
              data-lenis-prevent
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                {editingId ? (
                  <ServiceEditor
                    mode="edit"
                    serviceId={editingId}
                    embedded
                    onCancel={() => setEditingId(null)}
                    onCreated={() => {
                      setEditingId(null);
                      setRefreshNonce((value) => value + 1);
                    }}
                  />
                ) : null}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
