"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { MediaAsset, MediaAssetUpsertPayload } from "@/types/media";
import {
  createAdminMediaAsset,
  fetchAdminMediaAssetById,
  uploadMediaAsset,
  updateAdminMediaAsset,
} from "@/lib/api/mediaAssets.admin";
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

type MediaAssetEditorProps = {
  mode: "create" | "edit";
  assetId?: string;
  embedded?: boolean;
  onCreated?: (asset: MediaAsset) => void;
  onCancel?: () => void;
};

const KIND_OPTIONS = ["image", "video", "document"];
const PROVIDER_OPTIONS = ["cloudinary", "youtube", "vimeo", "direct"];

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

export default function MediaAssetEditor({
  mode,
  assetId,
  embedded = false,
  onCreated,
  onCancel,
}: MediaAssetEditorProps) {
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);

  const [kind, setKind] = useState("image");
  const [provider, setProvider] = useState("cloudinary");
  const [url, setUrl] = useState("");
  const [publicId, setPublicId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [width, setWidth] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [durationSec, setDurationSec] = useState<number | "">("");
  const [altVi, setAltVi] = useState("");
  const [altEn, setAltEn] = useState("");
  const [captionVi, setCaptionVi] = useState("");
  const [captionEn, setCaptionEn] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !assetId) return;
    let active = true;
    setLoading(true);
    fetchAdminMediaAssetById(assetId)
      .then((asset) => {
        if (!active) return;
        setKind(asset.kind);
        setProvider(asset.provider);
        setUrl(asset.url || "");
        setPublicId(asset.publicId || "");
        setThumbnailUrl(asset.thumbnailUrl || "");
        setWidth(asset.width ?? "");
        setHeight(asset.height ?? "");
        setDurationSec(asset.durationSec ?? "");
        setAltVi(asset.alt_i18n?.vi || "");
        setAltEn(asset.alt_i18n?.en || "");
        setCaptionVi(asset.caption_i18n?.vi || "");
        setCaptionEn(asset.caption_i18n?.en || "");
        setTagsInput((asset.tags || []).join(", "));
        setIsActive(asset.isActive ?? true);
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
  }, [assetId, mode]);

  const payload: MediaAssetUpsertPayload = useMemo(
    () => ({
      kind: kind as MediaAssetUpsertPayload["kind"],
      provider: provider as MediaAssetUpsertPayload["provider"],
      url,
      publicId: publicId || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      width: width === "" ? undefined : Number(width),
      height: height === "" ? undefined : Number(height),
      durationSec: durationSec === "" ? undefined : Number(durationSec),
      alt_i18n: { vi: altVi || undefined, en: altEn || undefined },
      caption_i18n: { vi: captionVi || undefined, en: captionEn || undefined },
      tags: parseTags(tagsInput),
      isActive,
    }),
    [
      kind,
      provider,
      url,
      publicId,
      thumbnailUrl,
      width,
      height,
      durationSec,
      altVi,
      altEn,
      captionVi,
      captionEn,
      tagsInput,
      isActive,
    ]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved =
        mode === "edit" && assetId
          ? await updateAdminMediaAsset(assetId, payload)
          : await createAdminMediaAsset(payload);
      toast.success(mode === "edit" ? "Media updated" : "Media created");
      onCreated?.(saved);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFileChange = async (file: File | null) => {
    setUploadFile(file);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      setUploadFile(null);
      return;
    }
    setUploading(true);
    try {
      const result = await uploadMediaAsset(file);
      const url = result.secure_url || result.url;
      if (!url) throw new Error("Upload failed");
      setKind("image");
      setProvider("cloudinary");
      setUrl(url);
      setPublicId(result.publicId || result.public_id || "");
      setWidth(typeof result.width === "number" ? result.width : "");
      setHeight(typeof result.height === "number" ? result.height : "");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className={embedded ? "space-y-4" : "space-y-6"}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Kind</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger>
              <SelectValue placeholder="Kind" />
            </SelectTrigger>
            <SelectContent>
              {KIND_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Upload image</Label>
        {url ? (
          <img
            src={url}
            alt=""
            className="h-24 w-32 rounded-md border object-cover"
          />
        ) : null}
        <Input
          type="file"
          accept="image/*"
          onChange={(event) =>
            handleUploadFileChange(event.target.files?.[0] || null)
          }
        />
        {uploading ? (
          <p className="text-xs text-muted-foreground">Uploading...</p>
        ) : uploadFile ? (
          <p className="text-xs text-muted-foreground">
            Selected: {uploadFile.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>URL</Label>
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Public ID</Label>
          <Input
            value={publicId}
            onChange={(event) => setPublicId(event.target.value)}
            placeholder="cloudinary-id"
          />
        </div>
        <div className="space-y-2">
          <Label>Thumbnail URL</Label>
          <Input
            value={thumbnailUrl}
            onChange={(event) => setThumbnailUrl(event.target.value)}
            placeholder="https://thumb"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Width</Label>
          <Input
            type="number"
            value={width}
            onChange={(event) =>
              setWidth(event.target.value ? Number(event.target.value) : "")
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Height</Label>
          <Input
            type="number"
            value={height}
            onChange={(event) =>
              setHeight(event.target.value ? Number(event.target.value) : "")
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Duration (sec)</Label>
          <Input
            type="number"
            value={durationSec}
            onChange={(event) =>
              setDurationSec(
                event.target.value ? Number(event.target.value) : ""
              )
            }
          />
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
            <Label>Alt (VI)</Label>
            <Input
              value={altVi}
              onChange={(event) => setAltVi(event.target.value)}
              placeholder="Mo ta hinh anh"
            />
          </div>
          <div className="space-y-2">
            <Label>Caption (VI)</Label>
            <Input
              value={captionVi}
              onChange={(event) => setCaptionVi(event.target.value)}
              placeholder="Chu thich"
            />
          </div>
        </TabsContent>
        <TabsContent value="en" className="space-y-3">
          <div className="space-y-2">
            <Label>Alt (EN)</Label>
            <Input
              value={altEn}
              onChange={(event) => setAltEn(event.target.value)}
              placeholder="Alt text"
            />
          </div>
          <div className="space-y-2">
            <Label>Caption (EN)</Label>
            <Input
              value={captionEn}
              onChange={(event) => setCaptionEn(event.target.value)}
              placeholder="Caption"
            />
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tags</Label>
          <Input
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="photo, studio"
          />
        </div>
        <div className="flex items-center justify-between rounded-md border border-input px-3 py-2">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">
              Hide inactive media from guest views.
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button onClick={handleSave} disabled={saving || uploading || !url}>
          {saving ? "Saving..." : "Save media"}
        </Button>
      </div>
    </div>
  );
}
