/**
 * Image URL Optimization Utility
 * Automatically transforms Unsplash and ImageKit URLs to serve optimized sizes and modern WebP formats.
 */
export function getOptimizedImageUrl(url: string | undefined | null, width = 600, quality = 75): string {
  if (!url) return 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png';

  try {
    // Unsplash Optimization
    if (url.includes('images.unsplash.com')) {
      const parsed = new URL(url);
      parsed.searchParams.set('w', width.toString());
      parsed.searchParams.set('q', quality.toString());
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      return parsed.toString();
    }

    // ImageKit Optimization
    if (url.includes('ik.imagekit.io')) {
      const separator = url.includes('?') ? '&' : '?';
      if (!url.includes('tr=')) {
        return `${url}${separator}tr=w-${width},q-${quality},f-auto`;
      }
    }
  } catch (e) {
    // Fallback if URL parsing fails
  }

  return url;
}
