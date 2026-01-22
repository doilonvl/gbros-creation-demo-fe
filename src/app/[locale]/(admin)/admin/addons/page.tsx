"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import type { AddOn, Service } from "@/types/service";
import { deleteAdminAddOn, fetchAdminAddOns } from "@/lib/api/addons.admin";
import { fetchAdminServices } from "@/lib/api/services.admin";
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
import AddOnEditor from "@/components/admin/addons/AddOnEditor";

const VIEW_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "trash", label: "Trash" },
];

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

export default function AdminAddOnsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("active");
  const [serviceFilter, setServiceFilter] = useState("all");
  const isTrashView = view === "trash";

  const [data, setData] = useState<{ items: AddOn[]; total: number } | null>(
    null
  );
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AddOn | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    let active = true;
    fetchAdminServices({ page: 1, limit: 200, sort: "sortOrder" })
      .then((res) => {
        if (!active) return;
        setServices(res.items || []);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  const serviceMap = useMemo(() => {
    const map = new Map<string, Service>();
    services.forEach((service) => map.set(service._id, service));
    return map;
  }, [services]);

  const fetchKey = useMemo(
    () =>
      `${page}-${limit}-${view}-${serviceFilter}-${refreshNonce}`,
    [page, limit, view, serviceFilter, refreshNonce]
  );

  useEffect(() => {
    let active = true;
    fetchAdminAddOns({
      page,
      limit,
      sort: "-updatedAt",
      deleted: isTrashView,
      serviceId: serviceFilter === "all" ? undefined : serviceFilter,
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
  }, [fetchKey, isTrashView, limit, page, serviceFilter]);

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
      const service = row.serviceId ? serviceMap.get(row.serviceId) : null;
      const searchText = [
        row.name_i18n?.vi,
        row.name_i18n?.en,
        service?.title_i18n?.vi,
        service?.title_i18n?.en,
      ]
        .filter(Boolean)
        .join(" ");
      return includesSearch(searchText, term);
    });
  }, [searchTerm, serviceMap, visibleItems]);
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
          <h1 className="text-2xl font-semibold">Add-ons</h1>
          <p className="text-sm text-muted-foreground">
            Optional services that can be attached to a package.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Create add-on</Button>
      </div>

      <Separator />

      <Card className="border-slate-200 bg-white">
        <div className="grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_240px_150px]">
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
              placeholder="Search add-on..."
            />
          </div>
          <div className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Service
            </span>
            <Select
              value={serviceFilter}
              onValueChange={(value) => {
                setServiceFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service._id} value={service._id}>
                    {service.title_i18n?.vi || service.title_i18n?.en}
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
              <TableHead>Name</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Active</TableHead>
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
                const service = row.serviceId
                  ? serviceMap.get(row.serviceId)
                  : null;
                return (
                  <TableRow key={row._id}>
                    <TableCell className="text-sm font-medium">
                      {row.name_i18n?.vi || row.name_i18n?.en || "(untitled)"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {service?.title_i18n?.vi ||
                        service?.title_i18n?.en ||
                        "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.price?.amount?.toLocaleString() || 0} VND
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.isActive ? "Yes" : "No"}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isTrashView ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(row._id || null)}
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
                <TableCell colSpan={5}>No add-ons found.</TableCell>
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
              Delete add-on
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Are you sure you want to delete this add-on?
            </Dialog.Description>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.Close>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!pendingDelete?._id) return;
                  try {
                    await deleteAdminAddOn(pendingDelete._id);
                    toast.success("Add-on deleted");
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
            className="fixed left-1/2 top-1/2 flex h-[90vh] w-[94vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  Create add-on
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  Add optional extras to services.
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
                <AddOnEditor
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
            className="fixed left-1/2 top-1/2 flex h-[90vh] w-[94vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  Edit add-on
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  Update pricing and conditions.
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
                  <AddOnEditor
                    mode="edit"
                    addonId={editingId}
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
