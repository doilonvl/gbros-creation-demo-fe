"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import { toast } from "sonner";
import type { Blog, BlogStatus } from "@/types/blog";
import {
  deleteAdminBlog,
  fetchAdminBlogs,
  type AdminApiError,
} from "@/lib/api/blogs.admin";
import { formatDate, resolveI18nValue } from "@/lib/blogs";
import { includesSearch } from "@/lib/search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import BlogEditor from "@/components/admin/blogs/BlogEditor";

const STATUS_OPTIONS: Array<{ value: BlogStatus | "all"; label: string }> = [
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

const STATUS_TONE: Record<BlogStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  published: "bg-emerald-100 text-emerald-700",
  scheduled: "bg-amber-100 text-amber-700",
  archived: "bg-rose-100 text-rose-700",
};

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

export default function AdminBlogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<BlogStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("active");
  const [data, setData] = useState<{
    items: Blog[];
    total: number;
  } | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Blog | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const isTrashView = view === "trash";

  const fetchKey = useMemo(
    () => `${page}-${limit}-${status}-${view}-${refreshNonce}`,
    [page, limit, status, view, refreshNonce]
  );

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
        resolveI18nValue(row.title_i18n, "vi"),
        resolveI18nValue(row.title_i18n, "en"),
        resolveI18nValue(row.excerpt_i18n, "vi"),
        resolveI18nValue(row.excerpt_i18n, "en"),
        typeof row.slug_i18n === "string" ? row.slug_i18n : row.slug_i18n?.vi,
        typeof row.slug_i18n === "string" ? row.slug_i18n : row.slug_i18n?.en,
        row.slug,
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
  const columnCount = isTrashView ? 7 : 6;

  useEffect(() => {
    let active = true;
    fetchAdminBlogs({
      page,
      limit,
      status: status === "all" ? undefined : status,
      sort: "-updatedAt",
      deleted: isTrashView,
    })
      .then((res) => {
        if (!active) return;
        setData(res);
        setAccessDenied(false);
      })
      .catch((error: AdminApiError) => {
        if (!active) return;
        if (error?.status === 401 || error?.status === 403) {
          setAccessDenied(true);
          return;
        }
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

  const handleStatusChange = (value: string) => {
    setStatus(value as BlogStatus | "all");
    setPage(1);
  };

  const handleViewChange = (value: string) => {
    setView(value);
    setPage(1);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextLimit = Math.max(1, Number(event.target.value || 1));
    setLimit(nextLimit);
    setPage(1);
  };

  const removeFromList = (id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const nextItems = prev.items.filter((item) => item._id !== id);
      return {
        items: nextItems,
        total: Math.max(0, prev.total - 1),
      };
    });
  };

  const closeEditDialog = () => {
    setEditingBlogId(null);
    setRefreshNonce((value) => value + 1);
  };

  if (accessDenied) {
    return (
      <Card className="p-6">
        <h1 className="text-lg font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
            Content
          </p>
          <h1 className="text-2xl font-semibold">Blog Management</h1>
          <p className="text-sm text-muted-foreground">
            Create, update, and publish blog posts quickly.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Create blog</Button>
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
              placeholder="Search by title..."
            />
          </div>
          <div className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Status
            </span>
            <Select value={status} onValueChange={handleStatusChange}>
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
            <Select value={view} onValueChange={handleViewChange}>
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
              <TableHead>Post</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Updated</TableHead>
              {isTrashView ? <TableHead>Deleted</TableHead> : null}
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columnCount}>Loading...</TableCell>
              </TableRow>
            ) : filteredItems.length ? (
              filteredItems.map((row) => {
                const titleVi = resolveI18nValue(row.title_i18n, "vi");
                const titleEn = resolveI18nValue(row.title_i18n, "en");
                return (
                  <TableRow key={row._id} className="text-sm">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-14 overflow-hidden rounded-lg bg-slate-100">
                          {row.coverImage?.url ? (
                            <img
                              src={row.coverImage.url}
                              alt={row.coverImage.alt_i18n?.vi || "cover"}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-neutral-900">
                            {titleVi || titleEn || "(untitled)"}
                          </p>
                          {titleEn ? (
                            <p className="text-xs text-muted-foreground">
                              {titleEn}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span
                        className={[
                          "inline-flex rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
                          STATUS_TONE[row.status] ||
                            "bg-slate-100 text-slate-600",
                        ].join(" ")}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(row.publishedAt || row.createdAt, "vi")}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(row.updatedAt, "vi")}
                    </TableCell>
                    {isTrashView ? (
                      <TableCell className="text-xs">
                        {formatDate(row.deletedAt, "vi")}
                      </TableCell>
                    ) : null}
                    <TableCell className="text-xs">
                      {row.isFeatured ? "Yes" : "No"}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isTrashView ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBlogId(row._id)}
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
                <TableCell colSpan={columnCount}>
                  No blog posts found.
                </TableCell>
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
              Delete blog post
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {pendingDelete
                  ? resolveI18nValue(pendingDelete.title_i18n, "vi")
                  : "this blog"}
              </span>
              ? This action cannot be undone.
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
                    await deleteAdminBlog(pendingDelete._id);
                    toast.success("Blog deleted");
                    removeFromList(pendingDelete._id);
                    setPendingDelete(null);
                    const nextTotal = Math.max(0, total - 1);
                    const nextTotalPages = Math.max(
                      1,
                      Math.ceil(nextTotal / limit)
                    );
                    if (page > nextTotalPages) {
                      setPage(nextTotalPages);
                    } else {
                      setRefreshNonce((value) => value + 1);
                    }
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
            className="fixed left-1/2 top-1/2 flex h-[92vh] w-[96vw] max-w-[1200px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white px-8 py-5">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  Create blog post
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  Fill in blog content and metadata, then save as draft or
                  publish later.
                </Dialog.Description>
                <p className="text-xs text-muted-foreground">
                  Drafts are saved automatically while you edit.
                </p>
              </div>
              <Dialog.Close asChild>
                <Button variant="outline" className="rounded-full">
                  Close
                </Button>
              </Dialog.Close>
            </div>
            <div
              className="flex-1 min-h-0 overflow-y-auto bg-slate-50 px-8 py-6"
              data-lenis-prevent
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <BlogEditor
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
        open={!!editingBlogId}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 flex h-[92vh] w-[96vw] max-w-[1200px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white px-8 py-5">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  Edit blog post
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  Update blog content and metadata, then save changes.
                </Dialog.Description>
                <p className="text-xs text-muted-foreground">
                  Autosave is on while you edit.
                </p>
              </div>
              <Dialog.Close asChild>
                <Button variant="outline" className="rounded-full">
                  Close
                </Button>
              </Dialog.Close>
            </div>
            <div
              className="flex-1 min-h-0 overflow-y-auto bg-slate-50 px-8 py-6"
              data-lenis-prevent
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                {editingBlogId ? (
                  <BlogEditor
                    key={editingBlogId}
                    mode="edit"
                    blogId={editingBlogId}
                    embedded
                    onCancel={closeEditDialog}
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
