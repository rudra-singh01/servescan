/**
 * Resolve the public app base URL at request time (not only at build time).
 * NEXT_PUBLIC_APP_URL is inlined during `next build`; VERCEL_URL is set at runtime on Vercel.
 */
export function getAppUrl(): string {
  const explicit =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return `https://${vercelHost.replace(/^https?:\/\//, '')}`;
  }

  return 'http://localhost:3000';
}
