"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import type { PortfolioItem, PortfolioStatus } from "@/types/portfolio";
import {
  deleteAdminPortfolio,
  fetchAdminPortfolios,
} from "@/lib/api/portfolios.admin";
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
import PortfolioEditor from "@/components/admin/portfolios/PortfolioEditor";

const STATUS_OPTIONS: Array<{ value: PortfolioStatus | "all"; label: string }> =
  [
    { value: "all", label: "All" },
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
    { value: "scheduled", label: "Scheduled" },
    { value: "archived", label: "Archived" },
  ];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "album", label: "Album" },
  { value: "case_study", label: "Case Study" },
  { value: "showreel", label: "Showreel" },
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

export default function AdminPortfoliosPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<PortfolioStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("active");
  const isTrashView = view === "trash";

  const [data, setData] = useState<{
    items: PortfolioItem[];
    total: number;
  } | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PortfolioItem | null>(
    null
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const fetchKey = useMemo(
    () => `${page}-${limit}-${status}-${view}-${typeFilter}-${refreshNonce}`,
    [page, limit, status, view, typeFilter, refreshNonce]
  );

  useEffect(() => {
    let active = true;
    fetchAdminPortfolios({
      page,
      limit,
      status: status === "all" ? undefined : status,
      type: typeFilter === "all" ? undefined : typeFilter,
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
  }, [fetchKey, isTrashView, limit, page, status, typeFilter]);

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
        row.title_i18n?.vi,
        row.title_i18n?.en,
        typeof row.slug_i18n === "string" ? row.slug_i18n : row.slug_i18n?.vi,
        typeof row.slug_i18n === "string" ? row.slug_i18n : row.slug_i18n?.en,
        row.slug,
        row.type,
        (row.tags || []).join(" "),
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
          <h1 className="text-2xl font-semibold">Portfolios</h1>
          <p className="text-sm text-muted-foreground">
            Curate albums, case studies, and showreels.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Create portfolio</Button>
      </div>

      <Separator />

      <Card className="border-slate-200 bg-white">
        <div className="grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_180px_160px_140px]">
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
                setStatus(value as PortfolioStatus | "all");
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
              Type
            </span>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
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
              <TableHead>Type</TableHead>
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
              filteredItems.map((row) => (
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
                    {row.type}
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5}>No portfolios found.</TableCell>
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
              Delete portfolio
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {pendingDelete?.title_i18n?.vi || "this portfolio"}
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
                    await deleteAdminPortfolio(pendingDelete._id);
                    toast.success("Portfolio deleted");
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
                  Create portfolio
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  Add a new album, case study, or showreel.
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
                <PortfolioEditor
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
                  Edit portfolio
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  Update metadata and publishing status.
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
                  <PortfolioEditor
                    mode="edit"
                    portfolioId={editingId}
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
