"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  Service,
  ServiceStatus,
  ServiceUpsertPayload,
} from "@/types/service";
import type { Industry, ServiceCategory } from "@/types/taxonomy";
import {
  archiveAdminService,
  createAdminService,
  fetchAdminServiceById,
  publishAdminService,
  scheduleAdminService,
  updateAdminService,
} from "@/lib/api/services.admin";
import {
  createAdminMediaAsset,
  uploadMediaAsset,
  uploadMediaAssets,
} from "@/lib/api/mediaAssets.admin";
import { fetchAdminIndustries } from "@/lib/api/industries.admin";
import { fetchAdminServiceCategories } from "@/lib/api/serviceCategories.admin";
import type { AdminApiError } from "@/lib/api/adminFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

type ServiceEditorProps = {
  mode: "create" | "edit";
  serviceId?: string;
  embedded?: boolean;
  onCreated?: (service: Service) => void;
  onCancel?: () => void;
};

const STATUS_OPTIONS: Array<{ value: ServiceStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
];

function slugifyText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCommaList(raw: string) {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLineList(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function mergeLocalizedLines(viRaw: string, enRaw: string) {
  const viList = parseLineList(viRaw);
  const enList = parseLineList(enRaw);
  const max = Math.max(viList.length, enList.length);
  if (!max) return [];
  return Array.from({ length: max }, (_, index) => ({
    vi: viList[index] || "",
    en: enList[index] || "",
  })).filter((item) => item.vi || item.en);
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

async function createImageAssetFromUpload(result: {
  url?: string;
  secure_url?: string;
  public_id?: string;
  publicId?: string;
  width?: number;
  height?: number;
}) {
  const url = result.secure_url || result.url;
  if (!url) throw new Error("Upload failed");
  return createAdminMediaAsset({
    kind: "image",
    provider: "cloudinary",
    url,
    publicId: result.publicId || result.public_id,
    width: typeof result.width === "number" ? result.width : undefined,
    height: typeof result.height === "number" ? result.height : undefined,
    isActive: true,
  });
}

export default function ServiceEditor({
  mode,
  serviceId,
  embedded = false,
  onCreated,
  onCancel,
}: ServiceEditorProps) {
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);

  const [categoryId, setCategoryId] = useState("");
  const [industryIds, setIndustryIds] = useState<string[]>([]);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [titleVi, setTitleVi] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [excerptVi, setExcerptVi] = useState("");
  const [excerptEn, setExcerptEn] = useState("");
  const [descriptionVi, setDescriptionVi] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [scopeLabelVi, setScopeLabelVi] = useState("");
  const [scopeLabelEn, setScopeLabelEn] = useState("");
  const [highlightsVi, setHighlightsVi] = useState("");
  const [highlightsEn, setHighlightsEn] = useState("");
  const [stepsVi, setStepsVi] = useState("");
  const [stepsEn, setStepsEn] = useState("");
  const [coverAssetId, setCoverAssetId] = useState("");
  const [galleryAssetIds, setGalleryAssetIds] = useState("");
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [status, setStatus] = useState<ServiceStatus>("draft");
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [scheduleInput, setScheduleInput] = useState("");

  useEffect(() => {
    if (!titleVi || slugTouched || !titleTouched) return;
    setSlug(slugifyText(titleVi));
  }, [slugTouched, titleVi, titleTouched]);

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setCoverUploading(true);
    try {
      const upload = await uploadMediaAsset(file);
      const asset = await createImageAssetFromUpload(upload);
      setCoverAssetId(asset._id || "");
      setCoverPreviewUrl(asset.url || "");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCoverUploading(false);
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const fileList = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (!fileList.length) {
      toast.error("Please select image files.");
      return;
    }
    setGalleryUploading(true);
    try {
      const uploads = await uploadMediaAssets(fileList);
      const created = await Promise.all(
        uploads.map((upload) => createImageAssetFromUpload(upload))
      );
      const nextIds = created
        .map((item) => item._id)
        .filter(Boolean) as string[];
      if (nextIds.length) {
        const existing = parseCommaList(galleryAssetIds);
        setGalleryAssetIds([...existing, ...nextIds].join(", "));
      }
      const nextUrls = created
        .map((item) => item.url)
        .filter(Boolean) as string[];
      if (nextUrls.length) {
        setGalleryPreviewUrls((prev) => [...prev, ...nextUrls]);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setGalleryUploading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchAdminServiceCategories({ page: 1, limit: 200, sort: "sortOrder" }),
      fetchAdminIndustries({ page: 1, limit: 200, sort: "sortOrder" }),
    ])
      .then(([categoriesRes, industriesRes]) => {
        if (!active) return;
        setCategories(categoriesRes.items || []);
        setIndustries(industriesRes.items || []);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !serviceId) return;
    let active = true;
    setLoading(true);
    fetchAdminServiceById(serviceId)
      .then((service) => {
        if (!active) return;
        setCategoryId(service.categoryId || "");
        setIndustryIds(service.industryIds || []);
        setSlug(
          typeof service.slug_i18n === "string"
            ? service.slug_i18n
            : service.slug_i18n?.vi || service.slug || ""
        );
        setSlugTouched(false);
        setTitleVi(service.title_i18n?.vi || "");
        setTitleEn(service.title_i18n?.en || "");
        setTitleTouched(false);
        setExcerptVi(service.excerpt_i18n?.vi || "");
        setExcerptEn(service.excerpt_i18n?.en || "");
        setDescriptionVi(service.description_i18n?.vi || "");
        setDescriptionEn(service.description_i18n?.en || "");
        setScopeLabelVi(service.scopeLabel_i18n?.vi || "");
        setScopeLabelEn(service.scopeLabel_i18n?.en || "");
        setHighlightsVi(
          (service.highlights_i18n || [])
            .map((item) => item.vi)
            .filter(Boolean)
            .join("\n")
        );
        setHighlightsEn(
          (service.highlights_i18n || [])
            .map((item) => item.en)
            .filter(Boolean)
            .join("\n")
        );
        setStepsVi(
          (service.includedSteps_i18n || [])
            .map((item) => item.vi)
            .filter(Boolean)
            .join("\n")
        );
        setStepsEn(
          (service.includedSteps_i18n || [])
            .map((item) => item.en)
            .filter(Boolean)
            .join("\n")
        );
        setCoverAssetId(service.coverAssetId || "");
        setGalleryAssetIds((service.galleryAssetIds || []).join(", "));
        setTagsInput((service.tags || []).join(", "));
        setIsFeatured(!!service.isFeatured);
        setSortOrder(service.sortOrder ?? 0);
        setStatus(service.status || "draft");
        setScheduledAt(service.scheduledAt || null);
        setScheduleInput(toInputDateTime(service.scheduledAt));
      })
      .catch((error) => {
        toast.error(getErrorMessage(error));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode, serviceId]);

  const payload: ServiceUpsertPayload = useMemo(
    () => ({
      categoryId: categoryId || undefined,
      industryIds,
      slug,
      slug_i18n: { vi: slug, en: slug },
      title_i18n: { vi: titleVi, en: titleEn },
      excerpt_i18n: { vi: excerptVi, en: excerptEn },
      description_i18n: { vi: descriptionVi, en: descriptionEn },
      scopeLabel_i18n: { vi: scopeLabelVi, en: scopeLabelEn },
      highlights_i18n: mergeLocalizedLines(highlightsVi, highlightsEn),
      includedSteps_i18n: mergeLocalizedLines(stepsVi, stepsEn),
      coverAssetId: coverAssetId || undefined,
      galleryAssetIds: parseCommaList(galleryAssetIds),
      tags: parseCommaList(tagsInput),
      isFeatured,
      sortOrder,
      status,
      scheduledAt: scheduleInput ? new Date(scheduleInput).toISOString() : null,
    }),
    [
      categoryId,
      industryIds,
      slug,
      titleVi,
      titleEn,
      excerptVi,
      excerptEn,
      descriptionVi,
      descriptionEn,
      scopeLabelVi,
      scopeLabelEn,
      highlightsVi,
      highlightsEn,
      stepsVi,
      stepsEn,
      coverAssetId,
      galleryAssetIds,
      tagsInput,
      isFeatured,
      sortOrder,
      status,
      scheduleInput,
    ]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved =
        mode === "edit" && serviceId
          ? await updateAdminService(serviceId, payload)
          : await createAdminService(payload);
      toast.success(mode === "edit" ? "Service updated" : "Service created");
      onCreated?.(saved);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!serviceId) return;
    setSaving(true);
    try {
      const saved = await publishAdminService(serviceId);
      toast.success("Service published");
      onCreated?.(saved);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!serviceId) return;
    setSaving(true);
    try {
      const saved = await archiveAdminService(serviceId);
      toast.success("Service archived");
      onCreated?.(saved);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!serviceId || !scheduleInput) return;
    setSaving(true);
    try {
      const saved = await scheduleAdminService(
        serviceId,
        new Date(scheduleInput).toISOString()
      );
      toast.success("Service scheduled");
      onCreated?.(saved);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleIndustry = (id: string) => {
    setIndustryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className={embedded ? "space-y-5" : "space-y-6"}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category._id} value={category._id}>
                  {category.name_i18n?.vi ||
                    category.name_i18n?.en ||
                    category.key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input
            value={slug}
            onChange={(event) => {
              const value = event.target.value;
              setSlug(value);
              setSlugTouched(value.trim().length > 0);
            }}
            placeholder="service-slug"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Industries</Label>
        <div className="grid gap-2 rounded-md border border-input p-3 md:grid-cols-2">
          {industries.map((industry) => (
            <label
              key={industry._id}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={industryIds.includes(industry._id)}
                onChange={() => toggleIndustry(industry._id)}
              />
              {industry.name_i18n?.vi ||
                industry.name_i18n?.en ||
                industry.slug}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="vi">
        <TabsList>
          <TabsTrigger value="vi">Vietnamese</TabsTrigger>
          <TabsTrigger value="en">English</TabsTrigger>
        </TabsList>
        <TabsContent value="vi" className="space-y-3">
          <div className="space-y-2">
            <Label>Title (VI)</Label>
            <Input
              value={titleVi}
              onChange={(event) => {
                setTitleVi(event.target.value);
                setTitleTouched(true);
              }}
              placeholder="Ten dich vu"
            />
          </div>
          <div className="space-y-2">
            <Label>Excerpt (VI)</Label>
            <textarea
              value={excerptVi}
              onChange={(event) => setExcerptVi(event.target.value)}
              className="min-h-[100px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
              placeholder="Tom tat"
            />
          </div>
          <div className="space-y-2">
            <Label>Description (VI)</Label>
            <textarea
              value={descriptionVi}
              onChange={(event) => setDescriptionVi(event.target.value)}
              className="min-h-[140px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
              placeholder="Mo ta"
            />
          </div>
        </TabsContent>
        <TabsContent value="en" className="space-y-3">
          <div className="space-y-2">
            <Label>Title (EN)</Label>
            <Input
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
              placeholder="Service title"
            />
          </div>
          <div className="space-y-2">
            <Label>Excerpt (EN)</Label>
            <textarea
              value={excerptEn}
              onChange={(event) => setExcerptEn(event.target.value)}
              className="min-h-[100px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
              placeholder="Excerpt"
            />
          </div>
          <div className="space-y-2">
            <Label>Description (EN)</Label>
            <textarea
              value={descriptionEn}
              onChange={(event) => setDescriptionEn(event.target.value)}
              className="min-h-[140px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
              placeholder="Description"
            />
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      <Tabs defaultValue="vi">
        <TabsList>
          <TabsTrigger value="vi">Highlights (VI)</TabsTrigger>
          <TabsTrigger value="en">Highlights (EN)</TabsTrigger>
        </TabsList>
        <TabsContent value="vi">
          <textarea
            value={highlightsVi}
            onChange={(event) => setHighlightsVi(event.target.value)}
            className="min-h-[120px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
            placeholder="Each line is a highlight"
          />
        </TabsContent>
        <TabsContent value="en">
          <textarea
            value={highlightsEn}
            onChange={(event) => setHighlightsEn(event.target.value)}
            className="min-h-[120px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
            placeholder="Each line is a highlight"
          />
        </TabsContent>
      </Tabs>

      <Tabs defaultValue="vi">
        <TabsList>
          <TabsTrigger value="vi">Steps (VI)</TabsTrigger>
          <TabsTrigger value="en">Steps (EN)</TabsTrigger>
        </TabsList>
        <TabsContent value="vi">
          <textarea
            value={stepsVi}
            onChange={(event) => setStepsVi(event.target.value)}
            className="min-h-[120px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
            placeholder="Each line is a step"
          />
        </TabsContent>
        <TabsContent value="en">
          <textarea
            value={stepsEn}
            onChange={(event) => setStepsEn(event.target.value)}
            className="min-h-[120px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
            placeholder="Each line is a step"
          />
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Scope label (VI)</Label>
          <Input
            value={scopeLabelVi}
            onChange={(event) => setScopeLabelVi(event.target.value)}
            placeholder="Scope label"
          />
        </div>
        <div className="space-y-2">
          <Label>Scope label (EN)</Label>
          <Input
            value={scopeLabelEn}
            onChange={(event) => setScopeLabelEn(event.target.value)}
            placeholder="Scope label"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Cover image</Label>
          {coverPreviewUrl ? (
            <img
              src={coverPreviewUrl}
              alt=""
              className="h-20 w-28 rounded-md border object-cover"
            />
          ) : null}
          <Input
            type="file"
            accept="image/*"
            onChange={(event) =>
              handleCoverUpload(event.target.files?.[0] || null)
            }
          />
          {coverUploading ? (
            <p className="text-xs text-muted-foreground">Uploading...</p>
          ) : null}
          <Input
            value={coverAssetId}
            onChange={(event) => setCoverAssetId(event.target.value)}
            placeholder="media asset id"
          />
        </div>
        <div className="space-y-2">
          <Label>Gallery images</Label>
          {galleryPreviewUrls.length ? (
            <div className="flex flex-wrap gap-2">
              {galleryPreviewUrls.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-16 w-20 rounded-md border object-cover"
                />
              ))}
            </div>
          ) : null}
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => handleGalleryUpload(event.target.files)}
          />
          {galleryUploading ? (
            <p className="text-xs text-muted-foreground">Uploading...</p>
          ) : null}
          <Input
            value={galleryAssetIds}
            onChange={(event) => setGalleryAssetIds(event.target.value)}
            placeholder="id1, id2"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <Label>Tags</Label>
          <Input
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="photo, studio"
          />
        </div>
        <div className="space-y-2">
          <Label>Sort order</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(Number(event.target.value || 0))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-input px-3 py-2">
        <div>
          <p className="text-sm font-medium">Featured</p>
          <p className="text-xs text-muted-foreground">
            Highlight this service on the guest site.
          </p>
        </div>
        <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as ServiceStatus)}
          >
            <SelectTrigger>
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
        <div className="space-y-2 md:col-span-2">
          <Label>Schedule</Label>
          <Input
            type="datetime-local"
            value={scheduleInput}
            onChange={(event) => setScheduleInput(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        {mode === "edit" ? (
          <>
            <Button variant="outline" onClick={handlePublish} disabled={saving}>
              Publish
            </Button>
            <Button variant="outline" onClick={handleArchive} disabled={saving}>
              Archive
            </Button>
            <Button
              variant="outline"
              onClick={handleSchedule}
              disabled={saving || !scheduleInput}
            >
              Schedule
            </Button>
          </>
        ) : null}
        <Button onClick={handleSave} disabled={saving || !titleVi || !slug}>
          {saving ? "Saving..." : "Save service"}
        </Button>
      </div>
    </div>
  );
}
