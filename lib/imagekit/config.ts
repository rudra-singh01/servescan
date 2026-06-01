/** ImageKit credentials (https://imagekit.io/dashboard). */
export function getImageKitConfig() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
  const urlEndpoint = (
    process.env.IMAGEKIT_URL_ENDPOINT ?? process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
  )?.trim();

  if (!privateKey || !urlEndpoint) {
    throw new Error(
      'ImageKit is not configured. Set IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT.',
    );
  }

  return { privateKey, urlEndpoint };
}

export function isImageKitConfigured(): boolean {
  return Boolean(
    process.env.IMAGEKIT_PRIVATE_KEY?.trim() &&
      (process.env.IMAGEKIT_URL_ENDPOINT?.trim() ||
        process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.trim()),
  );
}

export function getImageKitUrlHostname(): string | null {
  const endpoint =
    process.env.IMAGEKIT_URL_ENDPOINT ?? process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  if (!endpoint) return null;
  try {
    return new URL(endpoint).hostname;
  } catch {
    return null;
  }
}
