import type { LocalizedString } from "@/types/content";

export type MediaKind = "image" | "video" | "document";
export type MediaProvider = "cloudinary" | "youtube" | "vimeo" | "direct";

export type MediaAsset = {
  _id?: string;
  kind: MediaKind;
  provider: MediaProvider;
  url: string;
  publicId?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  durationSec?: number;
  alt_i18n?: LocalizedString;
  caption_i18n?: LocalizedString;
  tags?: string[];
  isActive?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MediaAssetUpsertPayload = {
  kind: MediaKind;
  provider: MediaProvider;
  url: string;
  publicId?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  durationSec?: number;
  alt_i18n?: LocalizedString;
  caption_i18n?: LocalizedString;
  tags?: string[];
  isActive?: boolean;
};
