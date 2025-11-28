export function sanitizeFileName(title: string): string {
  const sanitized = title
    .normalize('NFD') // Convert to base letters + accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-zA-Z0-9-_ ]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .toLowerCase(); // Optional: lowercase everything
  return `${sanitized}-${Date.now()}.jpg`;
}
