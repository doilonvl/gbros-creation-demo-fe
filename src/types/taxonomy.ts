import type { LocalizedString } from "@/types/content";

export type Industry = {
  _id: string;
  code?: string;
  name_i18n: LocalizedString;
  slug: string;
  description_i18n?: LocalizedString;
  sortOrder?: number;
  isActive?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ServiceCategoryKey =
  | "photo"
  | "video"
  | "styling"
  | "design"
  | "other";

export type ServiceCategory = {
  _id: string;
  key: ServiceCategoryKey;
  name_i18n: LocalizedString;
  slug: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
