/**
 * Image URL utility functions for handling both local and Supabase Storage URLs
 */

/**
 * Get the full image URL for a product image
 * Handles both:
 * - Supabase Storage URLs (absolute, starts with http/https)
 * - Local uploads (relative, starts with /uploads/)
 *
 * @param imageUrl - The image URL from the database (can be absolute or relative)
 * @returns Full image URL or placeholder if no image
 */
export function getImageUrl(imageUrl: string | null | undefined): string {
  // Return placeholder if no image
  if (!imageUrl) {
    return "/images/placeholder-product.svg";
  }

  // If already absolute URL (Supabase Storage), return as is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // If relative path (local upload), prepend backend URL
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  return `${backendUrl}${imageUrl}`;
}

/**
 * Check if an image URL is from Supabase Storage
 *
 * @param imageUrl - The image URL to check
 * @returns true if URL is from Supabase Storage
 */
export function isSupabaseStorageUrl(
  imageUrl: string | null | undefined
): boolean {
  if (!imageUrl) return false;
  return imageUrl.includes("supabase.co/storage/v1/object/public");
}

/**
 * Check if an image URL is a local upload
 *
 * @param imageUrl - The image URL to check
 * @returns true if URL is a local upload path
 */
export function isLocalUploadUrl(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return false;
  return imageUrl.startsWith("/uploads/");
}

/**
 * Extract filename from image URL (works for both Supabase and local)
 *
 * @param imageUrl - The image URL
 * @returns Filename or empty string
 */
export function getImageFilename(imageUrl: string | null | undefined): string {
  if (!imageUrl) return "";

  // Extract filename from URL
  const parts = imageUrl.split("/");
  return parts[parts.length - 1] || "";
}

/**
 * Get image dimensions class for Next.js Image component
 *
 * @param size - Size preset
 * @returns Object with width and height
 */
export function getImageDimensions(
  size: "thumb" | "small" | "medium" | "large" = "medium"
) {
  const dimensions = {
    thumb: { width: 64, height: 64 },
    small: { width: 128, height: 128 },
    medium: { width: 256, height: 256 },
    large: { width: 512, height: 512 },
  };

  return dimensions[size];
}
