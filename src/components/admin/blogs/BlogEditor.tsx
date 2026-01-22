"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Blog, BlogStatus, BlogUpsertPayload } from "@/types/blog";
import {
  archiveAdminBlog,
  createAdminBlog,
  fetchAdminBlogById,
  publishAdminBlog,
  scheduleAdminBlog,
  updateAdminBlog,
  uploadBlogImage,
  type AdminApiError,
} from "@/lib/api/blogs.admin";
import { getLocalePrefix } from "@/lib/routes";
import LexicalContentRenderer, {
  extractHeadingsFromLexical,
  type LexicalDoc,
} from "@/components/blog/LexicalContentRenderer";
import { normalizeTocIds } from "@/lib/blogs";
import LexicalEditor from "@/components/admin/blogs/LexicalEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

const AUTO_SAVE_INTERVAL = 30000;
const EMPTY_LEXICAL_DOC: LexicalDoc = {
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: null,
    children: [
      {
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: null,
        children: [],
      },
    ],
  },
};

type BlogEditorProps = {
  mode: "create" | "edit";
  blogId?: string;
  embedded?: boolean;
  onCreated?: (blog: Blog) => void;
  onCancel?: () => void;
};

type FieldErrors = {
  titleVi?: string;
  titleEn?: string;
  slugVi?: string;
  slugEn?: string;
};

function slugifyText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0110\u0111]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTags(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
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

function toInputDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString();
}

export default function BlogEditor({
  mode,
  blogId,
  embedded = false,
  onCreated,
  onCancel,
}: BlogEditorProps) {
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale || "vi");
  const localePrefix = getLocalePrefix(locale as "vi" | "en");
  const adminBase = `${localePrefix}/admin`;

  const [activeMode, setActiveMode] = useState<"create" | "edit">(mode);
  const [activeBlogId, setActiveBlogId] = useState<string>(blogId || "");
  const [loading, setLoading] = useState(activeMode === "edit");
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [editorVersion, setEditorVersion] = useState(0);

  const mountedRef = useRef(false);
  const suspendDirtyRef = useRef(false);
  const dirtyRef = useRef(false);
  const autoSavingRef = useRef(false);
  const savingRef = useRef(false);

  const [titleVi, setTitleVi] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleViTouched, setTitleViTouched] = useState(false);
  const [titleEnTouched, setTitleEnTouched] = useState(false);
  const [slugVi, setSlugVi] = useState("");
  const [slugEn, setSlugEn] = useState("");
  const [slugViTouched, setSlugViTouched] = useState(false);
  const [slugEnTouched, setSlugEnTouched] = useState(false);
  const [excerptVi, setExcerptVi] = useState("");
  const [excerptEn, setExcerptEn] = useState("");

  const [coverUrl, setCoverUrl] = useState("");
  const [coverPublicId, setCoverPublicId] = useState("");
  const [coverAltVi, setCoverAltVi] = useState("");
  const [coverAltEn, setCoverAltEn] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  const [tagsInput, setTagsInput] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(0);

  const [seoTitleVi, setSeoTitleVi] = useState("");
  const [seoTitleEn, setSeoTitleEn] = useState("");
  const [seoDescVi, setSeoDescVi] = useState("");
  const [seoDescEn, setSeoDescEn] = useState("");

  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const [ogUploading, setOgUploading] = useState(false);

  const [contentViDoc, setContentViDoc] = useState<LexicalDoc | null>(null);
  const [contentEnDoc, setContentEnDoc] = useState<LexicalDoc | null>(null);

  const [status, setStatus] = useState<BlogStatus | "draft">("draft");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [scheduleInput, setScheduleInput] = useState("");

  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  useEffect(() => {
    if (!titleVi || slugViTouched || !titleViTouched) return;
    setSlugVi(slugifyText(titleVi));
  }, [slugViTouched, titleVi, titleViTouched]);

  useEffect(() => {
    if (!titleEn || slugEnTouched || !titleEnTouched) return;
    setSlugEn(slugifyText(titleEn));
  }, [slugEnTouched, titleEn, titleEnTouched]);

  const hydrateFromBlog = useCallback((blog: Blog) => {
    suspendDirtyRef.current = true;
    setTitleVi(blog.title_i18n?.vi || "");
    setTitleEn(blog.title_i18n?.en || "");
    setTitleViTouched(false);
    setTitleEnTouched(false);
    setSlugVi(
      typeof blog.slug_i18n === "string"
        ? blog.slug_i18n
        : blog.slug_i18n?.vi || ""
    );
    setSlugEn(
      typeof blog.slug_i18n === "string"
        ? blog.slug_i18n
        : blog.slug_i18n?.en || ""
    );
    setSlugViTouched(false);
    setSlugEnTouched(false);
    setExcerptVi(blog.excerpt_i18n?.vi || "");
    setExcerptEn(blog.excerpt_i18n?.en || "");

    setCoverUrl(blog.coverImage?.url || "");
    setCoverPublicId(blog.coverImage?.publicId || "");
    setCoverAltVi(blog.coverImage?.alt_i18n?.vi || "");
    setCoverAltEn(blog.coverImage?.alt_i18n?.en || "");
    setCoverFile(null);
    setCoverUploading(false);

    setTagsInput((blog.tags || []).join(", "));
    setIsFeatured(!!blog.isFeatured);
    setSortOrder(blog.sortOrder ?? 0);

    setSeoTitleVi(blog.seoTitle_i18n?.vi || "");
    setSeoTitleEn(blog.seoTitle_i18n?.en || "");
    setSeoDescVi(blog.seoDescription_i18n?.vi || "");
    setSeoDescEn(blog.seoDescription_i18n?.en || "");

    setCanonicalUrl(blog.canonicalUrl || "");
    setOgImageUrl(blog.ogImageUrl || "");
    setOgImageFile(null);
    setOgUploading(false);

    const viDoc = blog.content_i18n?.vi ?? null;
    const enDoc = blog.content_i18n?.en ?? null;
    setContentViDoc(viDoc);
    setContentEnDoc(enDoc);

    setStatus(blog.status || "draft");
    setPublishedAt(blog.publishedAt || null);
    setScheduledAt(blog.scheduledAt || null);
    setScheduleInput(toInputDateTime(blog.scheduledAt));
    setEditorVersion((value) => value + 1);
    setTimeout(() => {
      suspendDirtyRef.current = false;
      dirtyRef.current = false;
    }, 0);
  }, []);

  useEffect(() => {
    if (activeMode !== "edit" || !activeBlogId) return;
    let active = true;
    setLoading(true);
    fetchAdminBlogById(activeBlogId)
      .then((blog) => {
        if (!active) return;
        hydrateFromBlog(blog);
        setAccessDenied(false);
      })
      .catch((error: AdminApiError) => {
        if (!active) return;
        if (error.status === 401 || error.status === 403) {
          setAccessDenied(true);
          return;
        }
        toast.error(getErrorMessage(error));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeBlogId, activeMode, hydrateFromBlog]);

  const previewTocVi = useMemo(
    () =>
      normalizeTocIds(
        contentViDoc ? extractHeadingsFromLexical(contentViDoc) : []
      ),
    [contentViDoc]
  );
  const previewTocEn = useMemo(
    () =>
      normalizeTocIds(
        contentEnDoc ? extractHeadingsFromLexical(contentEnDoc) : []
      ),
    [contentEnDoc]
  );

  const validate = () => {
    const nextErrors: FieldErrors = {};
    if (!titleVi.trim()) nextErrors.titleVi = "Title (VI) is required.";
    if (!titleEn.trim()) nextErrors.titleEn = "Title (EN) is required.";
    if (!slugVi.trim()) nextErrors.slugVi = "Slug (VI) is required.";
    if (!slugEn.trim()) nextErrors.slugEn = "Slug (EN) is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = useCallback(
    (
      overrides?: Partial<{
        titleVi: string;
        titleEn: string;
        slugVi: string;
        slugEn: string;
      }>
    ): BlogUpsertPayload => {
      const finalTitleVi = overrides?.titleVi ?? titleVi.trim();
      const finalTitleEn = overrides?.titleEn ?? titleEn.trim();
      const finalSlugVi = overrides?.slugVi ?? slugVi.trim();
      const finalSlugEn = overrides?.slugEn ?? slugEn.trim();
      const payload: BlogUpsertPayload = {
        title_i18n: { vi: finalTitleVi, en: finalTitleEn },
        slug_i18n: { vi: finalSlugVi, en: finalSlugEn },
        content_i18n: {
          vi: contentViDoc || EMPTY_LEXICAL_DOC,
          en: contentEnDoc || EMPTY_LEXICAL_DOC,
        },
      };

      if (excerptVi.trim() || excerptEn.trim()) {
        payload.excerpt_i18n = {
          vi: excerptVi.trim(),
          en: excerptEn.trim(),
        };
      }

      if (coverUrl.trim()) {
        payload.coverImage = {
          url: coverUrl.trim(),
          publicId: coverPublicId.trim() || undefined,
          alt_i18n:
            coverAltVi.trim() || coverAltEn.trim()
              ? {
                  vi: coverAltVi.trim(),
                  en: coverAltEn.trim(),
                }
              : undefined,
        };
      }

      const tags = parseTags(tagsInput);
      if (tags.length) payload.tags = tags;
      if (typeof isFeatured === "boolean") payload.isFeatured = isFeatured;
      if (sortOrder) payload.sortOrder = sortOrder;

      if (seoTitleVi.trim() || seoTitleEn.trim()) {
        payload.seoTitle_i18n = {
          vi: seoTitleVi.trim(),
          en: seoTitleEn.trim(),
        };
      }
      if (seoDescVi.trim() || seoDescEn.trim()) {
        payload.seoDescription_i18n = {
          vi: seoDescVi.trim(),
          en: seoDescEn.trim(),
        };
      }

      if (canonicalUrl.trim()) payload.canonicalUrl = canonicalUrl.trim();
      if (ogImageUrl.trim()) payload.ogImageUrl = ogImageUrl.trim();

      return payload;
    },
    [
      titleVi,
      titleEn,
      slugVi,
      slugEn,
      excerptVi,
      excerptEn,
      contentViDoc,
      contentEnDoc,
      coverUrl,
      coverPublicId,
      coverAltVi,
      coverAltEn,
      tagsInput,
      isFeatured,
      sortOrder,
      seoTitleVi,
      seoTitleEn,
      seoDescVi,
      seoDescEn,
      canonicalUrl,
      ogImageUrl,
    ]
  );

  const handleSave = async () => {
    if (coverUploading || ogUploading) {
      toast.error("Please wait for image upload to finish.");
      return;
    }
    if (!validate()) return;
    setSaving(true);
    savingRef.current = true;
    try {
      const payload = buildPayload();
      if (activeMode === "create" && !activeBlogId) {
        const created = await createAdminBlog(payload);
        toast.success("Blog created");
        setActiveBlogId(created._id);
        setActiveMode("edit");
        hydrateFromBlog(created);
        if (!embedded) {
          router.push(`${adminBase}/blogs/${created._id}`);
        }
        onCreated?.(created);
        setLastSavedAt(new Date().toISOString());
        return;
      }
      if (!activeBlogId) return;
      const updated = await updateAdminBlog(activeBlogId, payload);
      hydrateFromBlog(updated);
      toast.success("Blog updated");
      setLastSavedAt(new Date().toISOString());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  const handleSaveDraft = async () => {
    if (coverUploading || ogUploading) {
      toast.error("Please wait for image upload to finish.");
      return;
    }
    const fallbackTitleVi = titleVi.trim() || "Untitled draft";
    const fallbackTitleEn = titleEn.trim() || "Untitled draft";
    const fallbackSlugVi =
      slugVi.trim() || slugifyText(fallbackTitleVi) || `draft-${Date.now()}`;
    const fallbackSlugEn =
      slugEn.trim() || slugifyText(fallbackTitleEn) || `draft-${Date.now()}`;
    if (!titleVi.trim()) setTitleVi(fallbackTitleVi);
    if (!titleEn.trim()) setTitleEn(fallbackTitleEn);
    if (!slugVi.trim()) setSlugVi(fallbackSlugVi);
    if (!slugEn.trim()) setSlugEn(fallbackSlugEn);
    setSaving(true);
    savingRef.current = true;
    try {
      const payload = buildPayload({
        titleVi: fallbackTitleVi,
        titleEn: fallbackTitleEn,
        slugVi: fallbackSlugVi,
        slugEn: fallbackSlugEn,
      });
      if (activeMode === "create" && !activeBlogId) {
        const created = await createAdminBlog(payload);
        toast.success("Draft created");
        setActiveBlogId(created._id);
        setActiveMode("edit");
        hydrateFromBlog(created);
        onCreated?.(created);
        if (!embedded) {
          router.push(`${adminBase}/blogs/${created._id}`);
        }
      } else if (activeBlogId) {
        const updated = await updateAdminBlog(activeBlogId, payload);
        hydrateFromBlog(updated);
        toast.success("Draft saved");
      }
      setLastSavedAt(new Date().toISOString());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  const handlePublish = async () => {
    if (!activeBlogId) return;
    try {
      const updated = await publishAdminBlog(activeBlogId);
      hydrateFromBlog(updated);
      toast.success("Blog published");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleArchive = async () => {
    if (!activeBlogId) return;
    try {
      const updated = await archiveAdminBlog(activeBlogId);
      hydrateFromBlog(updated);
      toast.success("Blog archived");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSchedule = async () => {
    if (!activeBlogId) return;
    if (!scheduleInput) {
      toast.error("Please select a schedule time.");
      return;
    }
    try {
      const date = new Date(scheduleInput);
      if (Number.isNaN(date.getTime())) {
        toast.error("Invalid schedule time.");
        return;
      }
      const iso = date.toISOString();
      const updated = await scheduleAdminBlog(activeBlogId, iso);
      hydrateFromBlog(updated);
      toast.success("Blog scheduled");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (suspendDirtyRef.current) return;
    dirtyRef.current = true;
  }, [
    titleVi,
    titleEn,
    slugVi,
    slugEn,
    excerptVi,
    excerptEn,
    coverUrl,
    coverPublicId,
    coverAltVi,
    coverAltEn,
    tagsInput,
    isFeatured,
    sortOrder,
    seoTitleVi,
    seoTitleEn,
    seoDescVi,
    seoDescEn,
    canonicalUrl,
    ogImageUrl,
    contentViDoc,
    contentEnDoc,
  ]);

  useEffect(() => {
    if (activeMode !== "edit" || !activeBlogId) return;
    const interval = setInterval(async () => {
      if (
        loading ||
        savingRef.current ||
        autoSavingRef.current ||
        !dirtyRef.current ||
        coverUploading ||
        ogUploading
      ) {
        return;
      }
      autoSavingRef.current = true;
      setAutoSaving(true);
      try {
        await updateAdminBlog(activeBlogId, buildPayload());
        dirtyRef.current = false;
        setLastSavedAt(new Date().toISOString());
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        autoSavingRef.current = false;
        setAutoSaving(false);
      }
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [
    activeBlogId,
    activeMode,
    buildPayload,
    loading,
    coverUploading,
    ogUploading,
  ]);

  const handleCoverFileChange = async (file: File | null) => {
    setCoverFile(file);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      setCoverFile(null);
      return;
    }
    setCoverUploading(true);
    try {
      const result = await uploadBlogImage(file);
      const url = result.secure_url || result.url;
      if (!url) throw new Error("Upload failed");
      setCoverUrl(url);
      setCoverPublicId(result.publicId || result.public_id || "");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCoverUploading(false);
    }
  };

  const handleOgFileChange = async (file: File | null) => {
    setOgImageFile(file);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      setOgImageFile(null);
      return;
    }
    setOgUploading(true);
    try {
      const result = await uploadBlogImage(file);
      const url = result.secure_url || result.url;
      if (!url) throw new Error("Upload failed");
      setOgImageUrl(url);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setOgUploading(false);
    }
  };

  const handleCancel = () => {
    if (embedded) {
      onCancel?.();
      return;
    }
    router.back();
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {activeMode === "create" ? "Create blog post" : "Edit blog post"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage blog metadata and content in two languages.
          </p>
          <p className="text-xs text-muted-foreground">
            {autoSaving
              ? "Autosaving..."
              : lastSavedAt
              ? `Last saved: ${formatTime(lastSavedAt)}`
              : "Autosave is on"}
          </p>
        </div>
        {activeMode === "edit" ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handlePublish}>
              Publish
            </Button>
            <Button variant="outline" onClick={handleArchive}>
              Archive
            </Button>
            <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <span>Status: {status}</span>
              {publishedAt ? <span>Published</span> : null}
            </div>
          </div>
        ) : null}
      </div>

      <Separator />

      {loading ? (
        <Card className="p-6">Loading...</Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="grid gap-4 lg:col-span-2">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Title & Excerpt
                  </Label>
                  <span className="text-xs text-muted-foreground">VI / EN</span>
                </div>
                <Tabs defaultValue="vi">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="vi">Vietnamese</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>
                  <TabsContent value="vi" className="mt-3 space-y-3">
                    <div className="grid gap-1.5">
                      <Label>Title (VI)</Label>
                      <Input
                        value={titleVi}
                        onChange={(event) => {
                          setTitleVi(event.target.value);
                          setTitleViTouched(true);
                        }}
                        placeholder="Ca phe trung la gi?"
                      />
                      {errors.titleVi ? (
                        <p className="text-xs text-destructive">
                          {errors.titleVi}
                        </p>
                      ) : null}
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Excerpt (VI)</Label>
                      <textarea
                        value={excerptVi}
                        onChange={(event) => setExcerptVi(event.target.value)}
                        className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="en" className="mt-3 space-y-3">
                    <div className="grid gap-1.5">
                      <Label>Title (EN)</Label>
                      <Input
                        value={titleEn}
                        onChange={(event) => {
                          setTitleEn(event.target.value);
                          setTitleEnTouched(true);
                        }}
                        placeholder="What is egg coffee?"
                      />
                      {errors.titleEn ? (
                        <p className="text-xs text-destructive">
                          {errors.titleEn}
                        </p>
                      ) : null}
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Excerpt (EN)</Label>
                      <textarea
                        value={excerptEn}
                        onChange={(event) => setExcerptEn(event.target.value)}
                        className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="grid gap-3">
                <Label className="text-base font-semibold">Content</Label>
                <Tabs defaultValue="vi">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="vi">Vietnamese</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>
                  <TabsContent value="vi" className="mt-3 space-y-2">
                    <LexicalEditor
                      editorKey={`blog-vi-${
                        activeBlogId || "new"
                      }-${editorVersion}`}
                      value={contentViDoc}
                      onChange={setContentViDoc}
                      placeholder="Write Vietnamese content..."
                    />
                  </TabsContent>
                  <TabsContent value="en" className="mt-3 space-y-2">
                    <LexicalEditor
                      editorKey={`blog-en-${
                        activeBlogId || "new"
                      }-${editorVersion}`}
                      value={contentEnDoc}
                      onChange={setContentEnDoc}
                      placeholder="Write English content..."
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <div className="grid gap-3">
                <Label className="text-base font-semibold">Preview</Label>
                <Tabs defaultValue="vi">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="vi">Vietnamese</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>
                  <TabsContent value="vi" className="mt-3">
                    <Card className="p-4">
                      <article className="prose prose-neutral max-w-none">
                        <LexicalContentRenderer
                          doc={contentViDoc}
                          toc={previewTocVi}
                          locale="vi"
                        />
                      </article>
                    </Card>
                  </TabsContent>
                  <TabsContent value="en" className="mt-3">
                    <Card className="p-4">
                      <article className="prose prose-neutral max-w-none">
                        <LexicalContentRenderer
                          doc={contentEnDoc}
                          toc={previewTocEn}
                          locale="en"
                        />
                      </article>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Slug (VI)</Label>
                <Input
                  value={slugVi}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSlugVi(value);
                    setSlugViTouched(value.trim().length > 0);
                  }}
                />
                {errors.slugVi ? (
                  <p className="text-xs text-destructive">{errors.slugVi}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>Slug (EN)</Label>
                <Input
                  value={slugEn}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSlugEn(value);
                    setSlugEnTouched(value.trim().length > 0);
                  }}
                />
                {errors.slugEn ? (
                  <p className="text-xs text-destructive">{errors.slugEn}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label>Cover image</Label>
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl}
                    alt=""
                    className="h-24 w-32 rounded-md border object-cover"
                  />
                ) : null}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleCoverFileChange(event.target.files?.[0] || null)
                  }
                />
                {coverUploading ? (
                  <p className="text-xs text-muted-foreground">Uploading...</p>
                ) : coverFile ? (
                  <p className="text-xs text-muted-foreground">
                    Selected: {coverFile.name}
                  </p>
                ) : null}
                {coverPublicId ? (
                  <p className="text-xs text-muted-foreground">
                    publicId: {coverPublicId}
                  </p>
                ) : null}
                {coverUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCoverUrl("");
                      setCoverPublicId("");
                      setCoverFile(null);
                    }}
                  >
                    Remove cover image
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>Cover alt (VI)</Label>
                <Input
                  value={coverAltVi}
                  onChange={(event) => setCoverAltVi(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Cover alt (EN)</Label>
                <Input
                  value={coverAltEn}
                  onChange={(event) => setCoverAltEn(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Tags (comma separated)</Label>
                <Input
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Featured</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isFeatured}
                    onCheckedChange={setIsFeatured}
                  />
                  <span className="text-sm">Highlight on blog</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(Number(event.target.value || 0))
                  }
                />
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label>SEO title (VI)</Label>
                <Input
                  value={seoTitleVi}
                  onChange={(event) => setSeoTitleVi(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>SEO title (EN)</Label>
                <Input
                  value={seoTitleEn}
                  onChange={(event) => setSeoTitleEn(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>SEO description (VI)</Label>
                <textarea
                  value={seoDescVi}
                  onChange={(event) => setSeoDescVi(event.target.value)}
                  className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label>SEO description (EN)</Label>
                <textarea
                  value={seoDescEn}
                  onChange={(event) => setSeoDescEn(event.target.value)}
                  className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label>Canonical URL</Label>
                <Input
                  value={canonicalUrl}
                  onChange={(event) => setCanonicalUrl(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>OG image</Label>
                {ogImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ogImageUrl}
                    alt=""
                    className="h-24 w-32 rounded-md border object-cover"
                  />
                ) : null}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleOgFileChange(event.target.files?.[0] || null)
                  }
                />
                {ogUploading ? (
                  <p className="text-xs text-muted-foreground">Uploading...</p>
                ) : ogImageFile ? (
                  <p className="text-xs text-muted-foreground">
                    Selected: {ogImageFile.name}
                  </p>
                ) : null}
                {ogImageUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOgImageUrl("");
                      setOgImageFile(null);
                    }}
                  >
                    Remove OG image
                  </Button>
                ) : null}
              </div>

              {activeMode === "edit" ? (
                <>
                  <Separator />
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <div className="text-sm text-muted-foreground">
                      {status}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Published at</Label>
                    <div className="text-sm text-muted-foreground">
                      {publishedAt || "-"}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Scheduled at</Label>
                    <div className="text-sm text-muted-foreground">
                      {scheduledAt || "-"}
                    </div>
                    <Input
                      type="datetime-local"
                      value={scheduleInput}
                      onChange={(event) => setScheduleInput(event.target.value)}
                    />
                    <Button variant="outline" onClick={handleSchedule}>
                      Schedule
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving || autoSaving || coverUploading || ogUploading}
            >
              Save draft
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || autoSaving || coverUploading || ogUploading}
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
