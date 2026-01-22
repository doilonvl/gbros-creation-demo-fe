/* eslint-disable @typescript-eslint/no-explicit-any */
export type LocalizedString = { vi?: string; en?: string };
export type I18nString = { vi: string; en: string };

export type TocItem = { id: string; text: string; level: 2 | 3 };

export type BlogStatus = "draft" | "published" | "scheduled" | "archived";
export type RichDocJSON = Record<string, any>;

export type BlogImage = {
  url: string;
  publicId?: string;
  alt_i18n?: LocalizedString;
};

export type BlogGalleryItem = BlogImage & {
  caption_i18n?: LocalizedString;
};

export type Blog = {
  _id: string;
  slug?: string;
  slug_i18n?: I18nString | string;
  title_i18n: I18nString;
  excerpt_i18n?: LocalizedString;
  content_i18n?: { vi?: RichDocJSON; en?: RichDocJSON };
  content?: RichDocJSON | string;
  coverImage?: BlogImage;
  gallery?: BlogGalleryItem[];
  tags?: string[];
  status: BlogStatus;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  isFeatured?: boolean;
  sortOrder?: number;
  seoTitle_i18n?: LocalizedString;
  seoDescription_i18n?: LocalizedString;
  canonicalUrl?: string;
  ogImageUrl?: string;
  ogImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  toc_i18n?: { vi: TocItem[]; en: TocItem[] };
  plainText_i18n?: LocalizedString;
  readingTimeMinutes?: number;
  stats?: { viewCount?: number };
  robots?: { index: boolean; follow: boolean };
  authorName?: string;
  relatedServiceIds?: string[];
  relatedPortfolioIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type BlogListResponse = {
  items: Blog[];
  total: number;
  page: number;
  limit: number;
};

export type BlogUpsertPayload = {
  slug?: string;
  title_i18n: I18nString;
  slug_i18n: I18nString;
  excerpt_i18n?: LocalizedString;
  content_i18n: { vi: RichDocJSON; en: RichDocJSON };
  coverImage?: {
    url: string;
    publicId?: string;
    alt_i18n?: LocalizedString;
  };
  tags?: string[];
  isFeatured?: boolean;
  sortOrder?: number;
  seoTitle_i18n?: LocalizedString;
  seoDescription_i18n?: LocalizedString;
  canonicalUrl?: string;
  ogImageUrl?: string;
};
