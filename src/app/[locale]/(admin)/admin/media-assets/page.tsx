"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import type { MediaAsset } from "@/types/media";
import {
  deleteAdminMediaAsset,
  fetchAdminMediaAssets,
} from "@/lib/api/mediaAssets.admin";
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
import MediaAssetEditor from "@/components/admin/media-assets/MediaAssetEditor";

const ACTIVE_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const VIEW_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "trash", label: "Trash" },
];

const KIND_OPTIONS = [
  { value: "all", label: "All kinds" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "document", label: "Document" },
];

const PROVIDER_OPTIONS = [
  { value: "all", label: "All providers" },
  { value: "cloudinary", label: "Cloudinary" },
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
  { value: "direct", label: "Direct" },
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

export default function AdminMediaAssetsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("active");
  const [activeFilter, setActiveFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const isTrashView = view === "trash";

  const [data, setData] = useState<{
    items: MediaAsset[];
    total: number;
  } | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MediaAsset | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const fetchKey = useMemo(
    () =>
      `${page}-${limit}-${view}-${activeFilter}-${kindFilter}-${providerFilter}-${refreshNonce}`,
    [page, limit, view, activeFilter, kindFilter, providerFilter, refreshNonce]
  );

  useEffect(() => {
    let active = true;
    fetchAdminMediaAssets({
      page,
      limit,
      sort: "-updatedAt",
      deleted: isTrashView,
      kind: kindFilter === "all" ? undefined : kindFilter,
      provider: providerFilter === "all" ? undefined : providerFilter,
      isActive:
        activeFilter === "all"
          ? undefined
          : activeFilter === "active"
          ? true
          : false,
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
  }, [
    fetchKey,
    activeFilter,
    isTrashView,
    kindFilter,
    limit,
    page,
    providerFilter,
  ]);

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
      const searchText = [
        row.url,
        row.thumbnailUrl,
        row.publicId,
        row.kind,
        row.provider,
        (row.tags || []).join(" "),
        row.alt_i18n?.vi,
        row.alt_i18n?.en,
        row.caption_i18n?.vi,
        row.caption_i18n?.en,
      ]
        .filter(Boolean)
        .join(" ");
      return includesSearch(searchText, term);
    });
  }, [searchTerm, visibleItems]);
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
            Content
          </p>
          <h1 className="text-2xl font-semibold">Media Assets</h1>
          <p className="text-sm text-muted-foreground">
            Upload or register media used across services and portfolios.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Add media</Button>
      </div>

      <Separator />

      <Card className="border-slate-200 bg-white">
        <div className="grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_160px_170px_150px_130px]">
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
              placeholder="Search URL or tag..."
            />
          </div>
          <div className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Kind
            </span>
            <Select
              value={kindFilter}
              onValueChange={(value) => {
                setKindFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kind" />
              </SelectTrigger>
              <SelectContent>
                {KIND_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Provider
            </span>
            <Select
              value={providerFilter}
              onValueChange={(value) => {
                setProviderFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Active
            </span>
            <Select
              value={activeFilter}
              onValueChange={(value) => {
                setActiveFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Active" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVE_FILTERS.map((option) => (
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
              <TableHead>Preview</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Provider</TableHead>
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
              filteredItems.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 overflow-hidden rounded-lg bg-slate-100">
                        {row.thumbnailUrl || row.url ? (
                          <img
                            src={row.thumbnailUrl || row.url}
                            alt={row.alt_i18n?.vi || "media"}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {row.url}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.kind}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.provider}
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5}>No media assets found.</TableCell>
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
              Delete media asset
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Are you sure you want to delete this media asset?
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
                    await deleteAdminMediaAsset(pendingDelete._id);
                    toast.success("Media asset deleted");
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
                  Add media asset
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  Register a new media asset for use in services.
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
                <MediaAssetEditor
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
                  Edit media asset
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  Update media metadata, tags, and visibility.
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
                  <MediaAssetEditor
                    mode="edit"
                    assetId={editingId}
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
