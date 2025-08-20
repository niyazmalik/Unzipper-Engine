export function extractZipLinkFromHtml(html: string, baseUrl: string): string | null {
  const zipRegex = /href=["']([^"']+\.zip)["']/gi;
  let match;
  while ((match = zipRegex.exec(html)) !== null) {
    try {
      const link = match[1];
      // handle relative links
      return new URL(link, baseUrl).toString();
    } catch {
      continue;
    }
  }
  return null;
}