import type { LocalizedString } from "@/types/content";
import type { MediaAsset } from "@/types/media";
import type { I18nString } from "@/types/service";

export type PortfolioType = "album" | "case_study" | "showreel";
export type PortfolioStatus = "draft" | "published" | "scheduled" | "archived";

export type PortfolioItem = {
  _id: string;
  type: PortfolioType;
  slug_i18n?: I18nString | string;
  slug: string;
  title_i18n: I18nString;
  serviceIds?: string[];
  industryIds?: string[];
  coverAssetId?: string;
  assetIds?: string[];
  coverAsset?: MediaAsset;
  assets?: MediaAsset[];
  tags?: string[];
  status: PortfolioStatus;
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

export type PortfolioListResponse = {
  items: PortfolioItem[];
  total: number;
  page: number;
  limit: number;
};

export type PortfolioUpsertPayload = {
  type: PortfolioType;
  slug_i18n?: I18nString | string;
  slug?: string;
  title_i18n: I18nString;
  serviceIds?: string[];
  industryIds?: string[];
  coverAssetId?: string;
  assetIds?: string[];
  tags?: string[];
  status?: PortfolioStatus;
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
