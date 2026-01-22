"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Industry } from "@/types/taxonomy";
import {
  createAdminIndustry,
  fetchAdminIndustryById,
  updateAdminIndustry,
} from "@/lib/api/industries.admin";
import type { AdminApiError } from "@/lib/api/adminFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

type IndustryEditorProps = {
  mode: "create" | "edit";
  industryId?: string;
  embedded?: boolean;
  onCreated?: (industry: Industry) => void;
  onCancel?: () => void;
};

function slugifyText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

export default function IndustryEditor({
  mode,
  industryId,
  embedded = false,
  onCreated,
  onCancel,
}: IndustryEditorProps) {
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [nameVi, setNameVi] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [descVi, setDescVi] = useState("");
  const [descEn, setDescEn] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!nameVi || slugTouched || !nameTouched) return;
    setSlug(slugifyText(nameVi));
  }, [nameVi, slugTouched, nameTouched]);

  useEffect(() => {
    if (mode !== "edit" || !industryId) return;
    let active = true;
    setLoading(true);
    fetchAdminIndustryById(industryId)
      .then((industry) => {
        if (!active) return;
        setCode(industry.code || "");
        setSlug(industry.slug || "");
        setSlugTouched(false);
        setNameVi(industry.name_i18n?.vi || "");
        setNameEn(industry.name_i18n?.en || "");
        setNameTouched(false);
        setDescVi(industry.description_i18n?.vi || "");
        setDescEn(industry.description_i18n?.en || "");
        setSortOrder(industry.sortOrder ?? 0);
        setIsActive(industry.isActive ?? true);
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
  }, [industryId, mode]);

  const payload = useMemo(
    () => ({
      code: code || undefined,
      slug,
      name_i18n: { vi: nameVi, en: nameEn },
      description_i18n: { vi: descVi, en: descEn },
      sortOrder,
      isActive,
    }),
    [code, slug, nameVi, nameEn, descVi, descEn, sortOrder, isActive]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved =
        mode === "edit" && industryId
          ? await updateAdminIndustry(industryId, payload)
          : await createAdminIndustry(payload);
      toast.success(mode === "edit" ? "Industry updated" : "Industry created");
      onCreated?.(saved);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className={embedded ? "space-y-4" : "space-y-6"}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="industry-code">Code</Label>
          <Input
            id="industry-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="industry-code"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry-slug">Slug</Label>
          <Input
            id="industry-slug"
            value={slug}
            onChange={(event) => {
              const value = event.target.value;
              setSlug(value);
              setSlugTouched(value.trim().length > 0);
            }}
            placeholder="industry-slug"
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
            <Label>Name (VI)</Label>
            <Input
              value={nameVi}
              onChange={(event) => {
                setNameVi(event.target.value);
                setNameTouched(true);
              }}
              placeholder="Ten nganh"
            />
          </div>
          <div className="space-y-2">
            <Label>Description (VI)</Label>
            <textarea
              value={descVi}
              onChange={(event) => setDescVi(event.target.value)}
              className="min-h-[120px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
              placeholder="Mo ta"
            />
          </div>
        </TabsContent>
        <TabsContent value="en" className="space-y-3">
          <div className="space-y-2">
            <Label>Name (EN)</Label>
            <Input
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
              placeholder="Industry name"
            />
          </div>
          <div className="space-y-2">
            <Label>Description (EN)</Label>
            <textarea
              value={descEn}
              onChange={(event) => setDescEn(event.target.value)}
              className="min-h-[120px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
              placeholder="Description"
            />
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Sort order</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(Number(event.target.value || 0))}
          />
        </div>
        <div className="flex items-center justify-between rounded-md border border-input px-3 py-2">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">
              Hide inactive industries from guest views.
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
        <Button onClick={handleSave} disabled={saving || !nameVi || !slug}>
          {saving ? "Saving..." : "Save industry"}
        </Button>
      </div>
    </div>
  );
}
