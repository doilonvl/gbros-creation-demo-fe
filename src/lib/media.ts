const CLOUDINARY_HOST = "res.cloudinary.com";
const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";
const TRANSFORM_PATTERN = /(^|,)(w|h|q|f|c|g|ar|dpr|e|fl)_[^/]+/;

function injectCloudinaryTransform(url: string, transform: string) {
  if (!url.includes(CLOUDINARY_HOST)) return url;
  const split = url.split(CLOUDINARY_UPLOAD_SEGMENT);
  if (split.length !== 2) return url;
  const [prefix, rest] = split;
  if (!rest) return url;

  const segments = rest.split("/");
  if (!segments.length) return url;

  const signatureOffset = segments[0].startsWith("s--") ? 1 : 0;
  const targetSegment = segments[signatureOffset] || "";
  if (TRANSFORM_PATTERN.test(targetSegment)) return url;

  const nextSegments = [...segments];
  nextSegments.splice(signatureOffset, 0, transform);
  return `${prefix}${CLOUDINARY_UPLOAD_SEGMENT}${nextSegments.join("/")}`;
}

export function getCloudinarySizedUrl(
  url: string,
  width: number,
  quality: number
) {
  const transform = `f_auto,q_${quality},w_${width}`;
  return injectCloudinaryTransform(url, transform);
}
