"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AddOn, AddOnUpsertPayload, Service } from "@/types/service";
import { fetchAdminServices } from "@/lib/api/services.admin";
import {
  createAdminAddOn,
  fetchAdminAddOnById,
  updateAdminAddOn,
} from "@/lib/api/addons.admin";
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

type AddOnEditorProps = {
  mode: "create" | "edit";
  addonId?: string;
  embedded?: boolean;
  onCreated?: (addon: AddOn) => void;
  onCancel?: () => void;
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

export default function AddOnEditor({
  mode,
  addonId,
  embedded = false,
  onCreated,
  onCancel,
}: AddOnEditorProps) {
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  const [serviceId, setServiceId] = useState("");
  const [nameVi, setNameVi] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [priceAmount, setPriceAmount] = useState<number>(0);
  const [priceUnit, setPriceUnit] = useState("");
  const [priceIsFrom, setPriceIsFrom] = useState(false);
  const [conditionsVi, setConditionsVi] = useState("");
  const [conditionsEn, setConditionsEn] = useState("");
  const [isActive, setIsActive] = useState(true);
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
    if (mode !== "edit" || !addonId) return;
    let active = true;
    setLoading(true);
    fetchAdminAddOnById(addonId)
      .then((addon) => {
        if (!active) return;
        setServiceId(addon.serviceId || "");
        setNameVi(addon.name_i18n?.vi || "");
        setNameEn(addon.name_i18n?.en || "");
        setPriceAmount(addon.price?.amount ?? 0);
        setPriceUnit(addon.price?.unit || "");
        setPriceIsFrom(!!addon.price?.isFrom);
        setConditionsVi(addon.conditions_i18n?.vi || "");
        setConditionsEn(addon.conditions_i18n?.en || "");
        setIsActive(addon.isActive ?? true);
        setSortOrder(addon.sortOrder ?? 0);
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [addonId, mode]);

  const payload: AddOnUpsertPayload = useMemo(
    () => ({
      serviceId: serviceId || undefined,
      name_i18n: { vi: nameVi, en: nameEn },
      price: {
        currency: "VND",
        amount: priceAmount,
        isFrom: priceIsFrom,
        unit: priceUnit || undefined,
      },
      conditions_i18n: {
        vi: conditionsVi || undefined,
        en: conditionsEn || undefined,
      },
      isActive,
      sortOrder,
    }),
    [
      serviceId,
      nameVi,
      nameEn,
      priceAmount,
      priceIsFrom,
      priceUnit,
      conditionsVi,
      conditionsEn,
      isActive,
      sortOrder,
    ]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved =
        mode === "edit" && addonId
          ? await updateAdminAddOn(addonId, payload)
          : await createAdminAddOn(payload);
      toast.success(mode === "edit" ? "Add-on updated" : "Add-on created");
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
          <Label>Sort order</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(Number(event.target.value || 0))}
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
              onChange={(event) => setNameVi(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Conditions (VI)</Label>
            <textarea
              value={conditionsVi}
              onChange={(event) => setConditionsVi(event.target.value)}
              className="min-h-[120px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
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
            <Label>Conditions (EN)</Label>
            <textarea
              value={conditionsEn}
              onChange={(event) => setConditionsEn(event.target.value)}
              className="min-h-[120px] w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm"
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
            placeholder="per add-on"
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

      <div className="flex items-center justify-between rounded-md border border-input px-3 py-2">
        <div>
          <p className="text-sm font-medium">Active</p>
          <p className="text-xs text-muted-foreground">
            Show this add-on on guest pages.
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
        <Button onClick={handleSave} disabled={saving || !nameVi || !serviceId}>
          {saving ? "Saving..." : "Save add-on"}
        </Button>
      </div>
    </div>
  );
}
