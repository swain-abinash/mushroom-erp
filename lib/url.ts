/** Absolute URL for a path on this site (emails, sitemaps, structured data). */
export function appUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}

export function siteUrl(): string {
  return process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}
