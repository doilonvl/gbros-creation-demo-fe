"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { ServiceCategory, ServiceCategoryKey } from "@/types/taxonomy";
import {
  createAdminServiceCategory,
  fetchAdminServiceCategoryById,
  updateAdminServiceCategory,
} from "@/lib/api/serviceCategories.admin";
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

type ServiceCategoryEditorProps = {
  mode: "create" | "edit";
  categoryId?: string;
  embedded?: boolean;
  onCreated?: (category: ServiceCategory) => void;
  onCancel?: () => void;
};

const CATEGORY_KEYS: ServiceCategoryKey[] = [
  "photo",
  "video",
  "styling",
  "design",
  "other",
];

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

export default function ServiceCategoryEditor({
  mode,
  categoryId,
  embedded = false,
  onCreated,
  onCancel,
}: ServiceCategoryEditorProps) {
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);

  const [keyValue, setKeyValue] = useState<ServiceCategoryKey>("photo");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [icon, setIcon] = useState("");
  const [nameVi, setNameVi] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!nameVi || slugTouched || !nameTouched) return;
    setSlug(slugifyText(nameVi));
  }, [nameVi, slugTouched, nameTouched]);

  useEffect(() => {
    if (mode !== "edit" || !categoryId) return;
    let active = true;
    setLoading(true);
    fetchAdminServiceCategoryById(categoryId)
      .then((category) => {
        if (!active) return;
        setKeyValue(category.key || "photo");
        setSlug(category.slug || "");
        setSlugTouched(false);
        setIcon(category.icon || "");
        setNameVi(category.name_i18n?.vi || "");
        setNameEn(category.name_i18n?.en || "");
        setNameTouched(false);
        setSortOrder(category.sortOrder ?? 0);
        setIsActive(category.isActive ?? true);
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
  }, [categoryId, mode]);

  const payload = useMemo(
    () => ({
      key: keyValue,
      slug,
      icon: icon || undefined,
      name_i18n: { vi: nameVi, en: nameEn },
      sortOrder,
      isActive,
    }),
    [keyValue, slug, icon, nameVi, nameEn, sortOrder, isActive]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved =
        mode === "edit" && categoryId
          ? await updateAdminServiceCategory(categoryId, payload)
          : await createAdminServiceCategory(payload);
      toast.success(mode === "edit" ? "Category updated" : "Category created");
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
          <Label>Key</Label>
          <Select
            value={keyValue}
            onValueChange={(value) => setKeyValue(value as ServiceCategoryKey)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select key" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-slug">Slug</Label>
          <Input
            id="category-slug"
            value={slug}
            onChange={(event) => {
              const value = event.target.value;
              setSlug(value);
              setSlugTouched(value.trim().length > 0);
            }}
            placeholder="service-category"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category-icon">Icon</Label>
          <Input
            id="category-icon"
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            placeholder="icon-name"
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
              placeholder="Ten danh muc"
            />
          </div>
        </TabsContent>
        <TabsContent value="en" className="space-y-3">
          <div className="space-y-2">
            <Label>Name (EN)</Label>
            <Input
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
              placeholder="Category name"
            />
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex items-center justify-between rounded-md border border-input px-3 py-2">
        <div>
          <p className="text-sm font-medium">Active</p>
          <p className="text-xs text-muted-foreground">
            Hide inactive categories from guest views.
          </p>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button onClick={handleSave} disabled={saving || !nameVi || !slug}>
          {saving ? "Saving..." : "Save category"}
        </Button>
      </div>
    </div>
  );
}
