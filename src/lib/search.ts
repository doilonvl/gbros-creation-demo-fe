export function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111|\u0110/g, "d")
    .trim();
}

export function includesSearch(haystack: string, needle: string) {
  const normalizedNeedle = normalizeSearch(needle);
  if (!normalizedNeedle) return true;
  return normalizeSearch(haystack).includes(normalizedNeedle);
}