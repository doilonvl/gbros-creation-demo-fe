import type { LocalizedString } from "@/types/content";
import type { MediaAsset } from "@/types/media";

export type I18nString = { vi: string; en: string };

export type ServiceStatus = "draft" | "published" | "scheduled" | "archived";

export type Service = {
  _id: string;
  categoryId?: string;
  industryIds?: string[];
  slug_i18n?: I18nString | string;
  slug: string;
  title_i18n: I18nString;
  excerpt_i18n?: LocalizedString;
  description_i18n?: LocalizedString;
  coverAssetId?: string;
  galleryAssetIds?: string[];
  coverAsset?: MediaAsset;
  galleryAssets?: MediaAsset[];
  highlights_i18n?: LocalizedString[];
  scopeLabel_i18n?: LocalizedString;
  includedSteps_i18n?: LocalizedString[];
  tags?: string[];
  status: ServiceStatus;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  isFeatured?: boolean;
  sortOrder?: number;
  seoTitle_i18n?: LocalizedString;
  seoDescription_i18n?: LocalizedString;
  canonicalUrl?: string;
  ogImageUrl?: string;
  robots?: { index: boolean; follow: boolean };
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ServiceUpsertPayload = {
  categoryId?: string;
  industryIds?: string[];
  slug_i18n?: I18nString | string;
  slug?: string;
  title_i18n: I18nString;
  excerpt_i18n?: LocalizedString;
  description_i18n?: LocalizedString;
  coverAssetId?: string;
  galleryAssetIds?: string[];
  highlights_i18n?: LocalizedString[];
  scopeLabel_i18n?: LocalizedString;
  includedSteps_i18n?: LocalizedString[];
  tags?: string[];
  status?: ServiceStatus;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  isFeatured?: boolean;
  sortOrder?: number;
  seoTitle_i18n?: LocalizedString;
  seoDescription_i18n?: LocalizedString;
  canonicalUrl?: string;
  ogImageUrl?: string;
  robots?: { index: boolean; follow: boolean };
};

export type ServicePackage = {
  _id?: string;
  serviceId?: string;
  name_i18n: I18nString;
  slug?: string;
  price: { currency: "VND"; amount: number; isFrom?: boolean; unit?: string };
  included_i18n?: LocalizedString[];
  deliverables?: {
    key: string;
    label_i18n: LocalizedString;
    quantity: number;
    specs?: Record<string, unknown>;
  }[];
  turnaroundDays?: number;
  revisionsIncluded?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ServicePackageUpsertPayload = {
  serviceId?: string;
  name_i18n: I18nString;
  slug?: string;
  price: { currency: "VND"; amount: number; isFrom?: boolean; unit?: string };
  included_i18n?: LocalizedString[];
  deliverables?: {
    key: string;
    label_i18n: LocalizedString;
    quantity: number;
    specs?: Record<string, unknown>;
  }[];
  turnaroundDays?: number;
  revisionsIncluded?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
};

export type AddOn = {
  _id?: string;
  serviceId?: string;
  name_i18n: I18nString;
  price: { currency: "VND"; amount: number; isFrom?: boolean; unit?: string };
  conditions_i18n?: LocalizedString;
  isActive?: boolean;
  sortOrder?: number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AddOnUpsertPayload = {
  serviceId?: string;
  name_i18n: I18nString;
  price: { currency: "VND"; amount: number; isFrom?: boolean; unit?: string };
  conditions_i18n?: LocalizedString;
  isActive?: boolean;
  sortOrder?: number;
};
