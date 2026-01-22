"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  ServicePackage,
  ServicePackageUpsertPayload,
} from "@/types/service";
import type { Service } from "@/types/service";
import { fetchAdminServices } from "@/lib/api/services.admin";
import {
  createAdminServicePackage,
  fetchAdminServicePackageById,
  updateAdminServicePackage,
} from "@/lib/api/servicePackages.admin";
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

type ServicePackageEditorProps = {
  mode: "create" | "edit";
  packageId?: string;
  embedded?: boolean;
  onCreated?: (pkg: ServicePackage) => void;
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

export default function ServicePackageEditor({
  mode,
  packageId,
  embedded = false,
  onCreated,
  onCancel,
}: ServicePackageEditorProps) {
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  const [serviceId, setServiceId] = useState("");
  const [nameVi, setNameVi] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [priceAmount, setPriceAmount] = useState<number>(0);
  const [priceUnit, setPriceUnit] = useState("");
  const [priceIsFrom, setPriceIsFrom] = useState(false);
  const [includedVi, setIncludedVi] = useState("");
  const [includedEn, setIncludedEn] = useState("");
  const [deliverablesRaw, setDeliverablesRaw] = useState("");
  const [turnaroundDays, setTurnaroundDays] = useState<number>(0);
  const [revisionsIncluded, setRevisionsIncluded] = useState<number>(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(0);

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

  useEffect(() => {
    if (!nameVi || slugTouched || !nameTouched) return;
    setSlug(slugifyText(nameVi));
  }, [nameVi, slugTouched, nameTouched]);

  useEffect(() => {
    if (mode !== "edit" || !packageId) return;
    let active = true;
    setLoading(true);
    fetchAdminServicePackageById(packageId)
      .then((pkg) => {
        if (!active) return;
        setServiceId(pkg.serviceId || "");
        setNameVi(pkg.name_i18n?.vi || "");
        setNameEn(pkg.name_i18n?.en || "");
        setSlug(pkg.slug || "");
        setSlugTouched(false);
        setNameTouched(false);
        setPriceAmount(pkg.price?.amount ?? 0);
        setPriceUnit(pkg.price?.unit || "");
        setPriceIsFrom(!!pkg.price?.isFrom);
        setIncludedVi(
          (pkg.included_i18n || [])
            .map((item) => item.vi)
            .filter(Boolean)
            .join("\n")
        );
        setIncludedEn(
          (pkg.included_i18n || [])
            .map((item) => item.en)
            .filter(Boolean)
            .join("\n")
        );
        setDeliverablesRaw(
          pkg.deliverables?.length
            ? JSON.stringify(pkg.deliverables, null, 2)
            : ""
        );
        setTurnaroundDays(pkg.turnaroundDays ?? 0);
        setRevisionsIncluded(pkg.revisionsIncluded ?? 0);
        setIsFeatured(!!pkg.isFeatured);
        setIsPublished(!!pkg.isPublished);
        setSortOrder(pkg.sortOrder ?? 0);
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
  }, [mode, packageId]);

  const payload: ServicePackageUpsertPayload = useMemo(() => {
    let deliverables;
    if (deliverablesRaw.trim()) {
      try {
        deliverables = JSON.parse(deliverablesRaw);
      } catch {
        deliverables = undefined;
      }
    }
    return {
      serviceId: serviceId || undefined,
      name_i18n: { vi: nameVi, en: nameEn },
      slug: slug || undefined,
      price: {
        currency: "VND",
        amount: priceAmount,
        isFrom: priceIsFrom,
        unit: priceUnit || undefined,
      },
      included_i18n: mergeLocalizedLines(includedVi, includedEn),
      deliverables,
      turnaroundDays,
      revisionsIncluded,
      isFeatured,
      isPublished,
      sortOrder,
    };
  }, [
    serviceId,
    nameVi,
    nameEn,
    slug,
    priceAmount,
    priceIsFrom,
    priceUnit,
    includedVi,
    includedEn,
    deliverablesRaw,
    turnaroundDays,
    revisionsIncluded,
    isFeatured,
    isPublished,
    sortOrder,
  ]);

  const handleSave = async () => {
    if (deliverablesRaw.trim()) {
      try {
        JSON.parse(deliverablesRaw);
      } catch {
        toast.error("Deliverables JSON is invalid");
        return;
      }
    }

    setSaving(true);
    try {
      const saved =
        mode === "edit" && packageId
          ? await updateAdminServicePackage(packageId, payload)
          : await createAdminServicePackage(payload);
      toast.success(mode === "edit" ? "Package updated" : "Package created");
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
          <Label>Service</Label>
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger>
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service._id} value={service._id}>
                  {service.title_i18n?.vi || service.title_i18n?.en}
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
            placeholder="package-slug"
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
            <Label>Name (VI)</Label>
            <Input
              value={nameVi}
              onChange={(event) => {
                setNameVi(event.target.value);
                setNameTouched(true);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Included (VI)</Label>
            <textarea
              value={includedVi}
              onChange={(event) => setIncludedVi(event.target.value)}
              className="min-h-[120px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
              placeholder="Each line is included"
            />
          </div>
        </TabsContent>
        <TabsContent value="en" className="space-y-3">
          <div className="space-y-2">
            <Label>Name (EN)</Label>
            <Input
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Included (EN)</Label>
            <textarea
              value={includedEn}
              onChange={(event) => setIncludedEn(event.target.value)}
              className="min-h-[120px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
              placeholder="Each line is included"
            />
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Price amount (VND)</Label>
          <Input
            type="number"
            value={priceAmount}
            onChange={(event) =>
              setPriceAmount(Number(event.target.value || 0))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Input
            value={priceUnit}
            onChange={(event) => setPriceUnit(event.target.value)}
            placeholder="per package"
          />
        </div>
        <div className="flex items-center justify-between rounded-md border border-input px-3 py-2">
          <div>
            <p className="text-sm font-medium">Price is from</p>
            <p className="text-xs text-muted-foreground">Show price prefix.</p>
          </div>
          <Switch checked={priceIsFrom} onCheckedChange={setPriceIsFrom} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Deliverables (JSON)</Label>
        <textarea
          value={deliverablesRaw}
          onChange={(event) => setDeliverablesRaw(event.target.value)}
          className="min-h-[140px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
          placeholder='[{"key":"images","label_i18n":{"vi":"Anh","en":"Images"},"quantity":10,"specs":{}}]'
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Turnaround (days)</Label>
          <Input
            type="number"
            value={turnaroundDays}
            onChange={(event) =>
              setTurnaroundDays(Number(event.target.value || 0))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Revisions included</Label>
          <Input
            type="number"
            value={revisionsIncluded}
            onChange={(event) =>
              setRevisionsIncluded(Number(event.target.value || 0))
            }
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-md border border-input px-3 py-2">
          <div>
            <p className="text-sm font-medium">Featured</p>
            <p className="text-xs text-muted-foreground">Highlight package.</p>
          </div>
          <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
        </div>
        <div className="flex items-center justify-between rounded-md border border-input px-3 py-2">
          <div>
            <p className="text-sm font-medium">Published</p>
            <p className="text-xs text-muted-foreground">
              Show this package on guest pages.
            </p>
          </div>
          <Switch checked={isPublished} onCheckedChange={setIsPublished} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button onClick={handleSave} disabled={saving || !nameVi || !serviceId}>
          {saving ? "Saving..." : "Save package"}
        </Button>
      </div>
    </div>
  );
}
