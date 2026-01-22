"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  PortfolioItem,
  PortfolioStatus,
  PortfolioUpsertPayload,
} from "@/types/portfolio";
import type { Industry } from "@/types/taxonomy";
import type { Service } from "@/types/service";
import {
  archiveAdminPortfolio,
  createAdminPortfolio,
  fetchAdminPortfolioById,
  publishAdminPortfolio,
  scheduleAdminPortfolio,
  updateAdminPortfolio,
} from "@/lib/api/portfolios.admin";
import {
  createAdminMediaAsset,
  fetchAdminMediaAssetById,
  uploadMediaAsset,
  uploadMediaAssets,
} from "@/lib/api/mediaAssets.admin";
import { fetchAdminIndustries } from "@/lib/api/industries.admin";
import { fetchAdminServices } from "@/lib/api/services.admin";
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

type PortfolioEditorProps = {
  mode: "create" | "edit";
  portfolioId?: string;
  embedded?: boolean;
  onCreated?: (item: PortfolioItem) => void;
  onCancel?: () => void;
};

const TYPE_OPTIONS = [
  { value: "album", label: "Album" },
  { value: "case_study", label: "Case Study" },
  { value: "showreel", label: "Showreel" },
];

const STATUS_OPTIONS: Array<{ value: PortfolioStatus; label: string }> = [
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

export default function PortfolioEditor({
  mode,
  portfolioId,
  embedded = false,
  onCreated,
  onCancel,
}: PortfolioEditorProps) {
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);

  const [type, setType] = useState("album");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [titleVi, setTitleVi] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [industryIds, setIndustryIds] = useState<string[]>([]);
  const [coverAssetId, setCoverAssetId] = useState("");
  const [assetIds, setAssetIds] = useState("");
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [galleryPreviewItems, setGalleryPreviewItems] = useState<
    Array<{ id: string; url: string }>
  >([]);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState<PortfolioStatus>("draft");
  const [scheduleInput, setScheduleInput] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(0);

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
        const existing = parseCommaList(assetIds);
        setAssetIds([...existing, ...nextIds].join(", "));
      }
      const nextItems = created
        .map((item) =>
          item._id && item.url ? { id: item._id, url: item.url } : null
        )
        .filter(Boolean) as Array<{ id: string; url: string }>;
      if (nextItems.length) {
        setGalleryPreviewItems((prev) => [...prev, ...nextItems]);
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
      fetchAdminServices({ page: 1, limit: 200, sort: "sortOrder" }),
      fetchAdminIndustries({ page: 1, limit: 200, sort: "sortOrder" }),
    ])
      .then(([servicesRes, industriesRes]) => {
        if (!active) return;
        setServices(servicesRes.items || []);
        setIndustries(industriesRes.items || []);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !portfolioId) return;
    let active = true;
    setLoading(true);
    fetchAdminPortfolioById(portfolioId)
      .then(async (item) => {
        if (!active) return;
        setType(item.type || "album");
        setSlug(
          typeof item.slug_i18n === "string"
            ? item.slug_i18n
            : item.slug_i18n?.vi || item.slug || ""
        );
        setSlugTouched(false);
        setTitleVi(item.title_i18n?.vi || "");
        setTitleEn(item.title_i18n?.en || "");
        setTitleTouched(false);
        setServiceIds(item.serviceIds || []);
        setIndustryIds(item.industryIds || []);
        setCoverAssetId(item.coverAssetId || "");
        setAssetIds((item.assetIds || []).join(", "));
        setCoverPreviewUrl("");
        setGalleryPreviewItems([]);
        setTagsInput((item.tags || []).join(", "));
        setStatus(item.status || "draft");
        setScheduleInput(toInputDateTime(item.scheduledAt));
        setIsFeatured(!!item.isFeatured);
        setSortOrder(item.sortOrder ?? 0);

        const coverId = item.coverAssetId;
        if (coverId) {
          try {
            const coverAsset = await fetchAdminMediaAssetById(coverId);
            if (active) setCoverPreviewUrl(coverAsset.url || "");
          } catch (error) {
            if (active) setCoverPreviewUrl("");
          }
        }

        const galleryIds = item.assetIds || [];
        if (galleryIds.length) {
          const galleryAssets = await Promise.all(
            galleryIds.map((id) =>
              fetchAdminMediaAssetById(id)
                .then((asset) => ({ id, url: asset.url || "" }))
                .catch(() => ({ id, url: "" }))
            )
          );
          if (active) {
            setGalleryPreviewItems(
              galleryAssets.filter((asset) => asset.url)
            );
          }
        }
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode, portfolioId]);

  const payload: PortfolioUpsertPayload = useMemo(
    () => ({
      type: type as PortfolioUpsertPayload["type"],
      slug,
      slug_i18n: { vi: slug, en: slug },
      title_i18n: { vi: titleVi, en: titleEn },
      serviceIds,
      industryIds,
      coverAssetId: coverAssetId || undefined,
      assetIds: parseCommaList(assetIds),
      tags: parseCommaList(tagsInput),
      status,
      scheduledAt: scheduleInput ? new Date(scheduleInput).toISOString() : null,
      isFeatured,
      sortOrder,
    }),
    [
      type,
      slug,
      titleVi,
      titleEn,
      serviceIds,
      industryIds,
      coverAssetId,
      assetIds,
      tagsInput,
      status,
      scheduleInput,
      isFeatured,
      sortOrder,
    ]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved =
        mode === "edit" && portfolioId
          ? await updateAdminPortfolio(portfolioId, payload)
          : await createAdminPortfolio(payload);
      toast.success(
        mode === "edit" ? "Portfolio updated" : "Portfolio created"
      );
      onCreated?.(saved);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!portfolioId) return;
    setSaving(true);
    try {
      const saved = await publishAdminPortfolio(portfolioId);
      toast.success("Portfolio published");
      onCreated?.(saved);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!portfolioId) return;
    setSaving(true);
    try {
      const saved = await archiveAdminPortfolio(portfolioId);
      toast.success("Portfolio archived");
      onCreated?.(saved);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!portfolioId || !scheduleInput) return;
    setSaving(true);
    try {
      const saved = await scheduleAdminPortfolio(
        portfolioId,
        new Date(scheduleInput).toISOString()
      );
      toast.success("Portfolio scheduled");
      onCreated?.(saved);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (id: string) => {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleIndustry = (id: string) => {
    setIndustryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const removeGalleryItem = (id: string) => {
    const existing = parseCommaList(assetIds).filter((item) => item !== id);
    setAssetIds(existing.join(", "));
    setGalleryPreviewItems((prev) => prev.filter((item) => item.id !== id));
  };

  const removeCover = () => {
    setCoverAssetId("");
    setCoverPreviewUrl("");
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className={embedded ? "space-y-5" : "space-y-6"}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
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
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input
            value={slug}
            onChange={(event) => {
              const value = event.target.value;
              setSlug(value);
              setSlugTouched(value.trim().length > 0);
            }}
            placeholder="portfolio-slug"
          />
        </div>
      </div>

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
            />
          </div>
        </TabsContent>
        <TabsContent value="en" className="space-y-3">
          <div className="space-y-2">
            <Label>Title (EN)</Label>
            <Input
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
            />
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="space-y-2">
        <Label>Services</Label>
        <div className="grid gap-2 rounded-md border border-input p-3 md:grid-cols-2">
          {services.map((service) => (
            <label
              key={service._id}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={serviceIds.includes(service._id)}
                onChange={() => toggleService(service._id)}
              />
              {service.title_i18n?.vi || service.title_i18n?.en}
            </label>
          ))}
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Cover image</Label>
          {coverPreviewUrl ? (
            <div className="relative w-fit">
              <img
                src={coverPreviewUrl}
                alt=""
                className="h-20 w-28 rounded-md border object-cover"
              />
              <button
                type="button"
                onClick={removeCover}
                className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-xs text-white shadow"
                aria-label="Remove cover image"
              >
                ×
              </button>
            </div>
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
          {galleryPreviewItems.length ? (
            <div className="flex flex-wrap gap-2">
              {galleryPreviewItems.map((item) => (
                <div key={item.id} className="relative">
                  <img
                    src={item.url}
                    alt=""
                    className="h-16 w-20 rounded-md border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryItem(item.id)}
                    className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-xs text-white shadow"
                    aria-label="Remove gallery image"
                  >
                    ×
                  </button>
                </div>
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
            value={assetIds}
            onChange={(event) => setAssetIds(event.target.value)}
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
            placeholder="fashion, commercial"
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
            Highlight on the guest site.
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
            onValueChange={(value) => setStatus(value as PortfolioStatus)}
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
          {saving ? "Saving..." : "Save portfolio"}
        </Button>
      </div>
    </div>
  );
}
